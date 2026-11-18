const attempts = 3;
const leaseMs = 180000;
const encoder = new TextEncoder();
export const reply = (value, status = 200, headers = {}) => Response.json(value, { status, headers: {
  "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers,
} });

export async function digest(value) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function readText(request, size) {
  const stream = request.body?.getReader();
  if (!stream) return "";
  let total = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await stream.read();
    if (done) break;
    total += value.length;
    if (total > size) {
      await stream.cancel();
      throw new RangeError("Request body exceeds limit");
    }
    chunks.push(value);
  }
  const output = new Uint8Array(total);
  let cursor = 0;
  for (const chunk of chunks) { output.set(chunk, cursor); cursor += chunk.length; }
  return new TextDecoder().decode(output);
}

export async function enqueue(env, args, now = Date.now()) {
  const prompt = typeof args.prompt === "string" ? args.prompt.trim() : "";
  const kind = args.kind ?? "module";
  const key = args.idempotency_key ?? null;
  if (!prompt || prompt.length > 4000 || !["module", "probe"].includes(kind) ||
      (args.publish !== undefined && typeof args.publish !== "boolean") ||
      (key !== null && (typeof key !== "string" || !/^[A-Za-z0-9._:-]{1,100}$/.test(key)))) {
    throw new RangeError("Provide a prompt up to 4,000 characters, a valid build kind and idempotency key.");
  }
  const publish = args.publish === true ? 1 : 0;
  const requestHash = await digest(JSON.stringify([prompt, kind, publish]));
  const id = crypto.randomUUID();
  const path = "generated-builds/" + id + ".mjs";
  await env.DB.prepare(`INSERT INTO build_queue(id,idempotency_key,request_hash,task_prompt,file_path,kind,
    status,publish,next_at,created_at) VALUES(?,?,?,?,?,?,'pending',?,?,?) ON CONFLICT(idempotency_key) DO NOTHING`)
    .bind(id,key,requestHash,prompt,path,kind,publish,now,now).run();
  const row = key !== null ? await env.DB.prepare("SELECT id,file_path,status,request_hash FROM build_queue WHERE idempotency_key=?").bind(key).first() :
    await env.DB.prepare("SELECT id,file_path,status,request_hash FROM build_queue WHERE id=?").bind(id).first();
  if (!row || row.request_hash !== requestHash) throw new RangeError("That idempotency key already belongs to another request.");
  return { id: row.id, file_path: row.file_path, status: row.status };
}

async function claim(env, now) {
  await env.DB.prepare(`UPDATE build_queue SET status='failed',last_error='Lease expired at retry limit',finished_at=?
    WHERE status='running' AND lease_until<=? AND attempts>=?`).bind(now,now,attempts).run();
  return env.DB.prepare(`UPDATE build_queue SET status='running', attempts=attempts+1, lease_owner=?,lease_until=?
    WHERE id=(SELECT id FROM build_queue WHERE attempts<? AND
    ((status='pending' AND next_at<=?) OR (status='running' AND lease_until<=?))
    ORDER BY next_at,created_at LIMIT 1) RETURNING *`)
    .bind(crypto.randomUUID(),now+leaseMs,attempts,now,now).first();
}

const guidance = "Return only one self-contained JavaScript ES module with named exports. Keep it dependency-free and concise. Do not use network access, credentials, shell access, or process APIs. The module is a code draft for review.";
async function generate(env, task, fetcher) {
  if (task.kind === "probe") {
    return { provider: "deterministic", code: "export function buildReceipt() {\n  return " +
      JSON.stringify({ id: task.id, prompt: task.task_prompt }) + ";\n}\n" };
  }
  let code, provider;
  if (env.OPENAI_API_KEY) {
    const response = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST", headers: { authorization: "Bearer " + env.OPENAI_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-4.1-mini", instructions: guidance, input: task.task_prompt,
        max_output_tokens: 2500, store: false }),
      signal: AbortSignal.timeout(65000),
    });
    if (!response.ok) throw new Error("OpenAI returned HTTP " + response.status);
    const data = await response.json();
    code = data.output?.flatMap(item => item.content ?? []).filter(item => item.type === "output_text").map(item => item.text).join("\n");
    provider = "OpenAI";
  } else if (env.AI) {
    const data = await env.AI.run(env.WORKERS_AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [{ role: "system", content: guidance }, { role: "user", content: task.task_prompt }],
      max_tokens: 2500,
    });
    code = data.response;
    provider = "Workers AI";
  } else {
    throw new Error("A model binding is required for module tasks");
  }
  code = typeof code === "string" ? code.trim().replace(/^```(?:javascript|js|mjs)?\s*\n/i, "").replace(/\n```\s*$/, "") : "";
  if (!code || code.length > 24000 || !/^export\s/m.test(code)) throw new Error("Model output did not contain a JavaScript module");
  return { provider, code: code + "\n" };
}

function base64(bytes) {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw);
}
async function publishDraft(env, task, code, fetcher) {
  if (!task.publish) return { state: "not_requested" };
  if (!env.GITHUB_TOKEN) return { state: "awaiting_github_token" };
  const repository = env.GITHUB_REPOSITORY;
  const branch = env.GITHUB_DRAFT_BRANCH;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || "") || !/^automation\/[\w-]+$/.test(branch || "")) {
    return { state: "draft_branch_unconfigured" };
  }
  const url = "https://api.github.com/repos/" + repository + "/contents/" + task.file_path;
  const headers = { authorization: "Bearer " + env.GITHUB_TOKEN, accept: "application/vnd.github+json",
    "user-agent": "Tabor-Build-Loop", "content-type": "application/json" };
  const content = base64(encoder.encode(code));
  const response = await fetcher(url, { method:"PUT", headers,
    body: JSON.stringify({ message: "Generate coding draft " + task.id, content, branch }),
    signal: AbortSignal.timeout(20000),
  });
  if (response.ok) {
    const result = await response.json();
    return { state: "published", url: result.commit?.html_url ?? result.content?.html_url };
  }
  if (response.status === 422 || response.status === 409) {
    const existing = await fetcher(url + "?ref=" + encodeURIComponent(branch), { headers, signal: AbortSignal.timeout(12000) });
    if (existing.ok) {
      const item = await existing.json();
      if ((item.content ?? "").replace(/\s/g,"") === content) return { state: "published", url: item.html_url };
    }
  }
  return { state: "github_http_" + response.status };
}

export async function runOne(env, fetcher = fetch, now = Date.now()) {
  const task = await claim(env, now);
  if (!task) return null;
  try {
    const generated = await generate(env, task, fetcher);
    const sha = await digest(generated.code);
    let draft;
    try { draft = await publishDraft(env, task, generated.code, fetcher); }
    catch { draft = { state: "github_delivery_error" }; }
    const status = draft.state === "published" ? "published" : "generated";
    const update = await env.DB.prepare(`UPDATE build_queue SET status=?,code_output=?,code_sha256=?,provider=?,
      publish_status=?,commit_url=?,finished_at=?,lease_until=NULL,lease_owner=NULL,last_error=NULL
      WHERE id=? AND status='running' AND lease_owner=?`)
      .bind(status,generated.code,sha,generated.provider,draft.state,draft.url ?? null,Date.now(),task.id,task.lease_owner).run();
    return update.meta.changes ? { id: task.id, status, sha256: sha, provider: generated.provider } : null;
  } catch (error) {
    const status = task.attempts >= attempts ? "failed" : "pending";
    const errorText = error instanceof Error ? error.message.slice(0,160) : "Build failed";
    await env.DB.prepare(`UPDATE build_queue SET status=?,next_at=?,last_error=?,finished_at=?,lease_owner=NULL,lease_until=NULL
      WHERE status='running' AND id=? AND lease_owner=?`)
      .bind(status,Date.now() + (30000 * 2 ** (task.attempts - 1)),errorText,status === "failed" ? Date.now() : null,task.id,task.lease_owner).run();
    return { id: task.id, status };
  }
}

export async function nextWake(env) {
  return (await env.DB.prepare(`SELECT min(CASE WHEN status='pending' THEN next_at ELSE lease_until END) AS at
    FROM build_queue WHERE status IN ('pending','running')`).first())?.at;
}

export async function stats(env) {
  const { results } = await env.DB.prepare("SELECT status,count(*) AS count FROM build_queue GROUP BY status").all();
  const clock = await env.DB.prepare("SELECT last_cron_at,last_alarm_at FROM build_clock WHERE singleton=1").first();
  return { ...clock, queue: Object.fromEntries(results.map(item => [item.status, item.count])) };
}

export async function getJob(env, id, code = false) {
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new RangeError("Invalid job ID.");
  const columns = "id,file_path,status,provider,code_sha256,publish_status,commit_url,attempts,last_error,created_at,finished_at";
  return env.DB.prepare("SELECT " + columns + (code ? ",code_output" : "") + " FROM build_queue WHERE id=?").bind(id).first();
}

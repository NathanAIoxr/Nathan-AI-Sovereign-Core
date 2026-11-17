const TARGETS = {
  "github:goldener-data/goldener#422": {
    repository: "goldener-data/goldener",
    paths: new Set(["README.md", "docs/posts/GOLD_DENSITY_WEIGHING.md"])
  },
  "github:open-glassbeetle/glassbeetle#341": {
    repository: "Open-Glassbeetle/glassbeetle",
    paths: new Set(["apps/api/test/projects-artifacts.e2e-spec.ts"])
  }
};

const SELECT_HANDOFFS = `
  SELECT h.job_id, h.job_status, h.source_receipt,
    v.checked_at, v.status, v.base, v.files, v.hunks, v.reason, v.execution
  FROM repair_handoff_outbox h
  LEFT JOIN repair_patch_checks v ON v.job_id = h.job_id
    AND v.source_receipt = h.source_receipt
  WHERE h.job_id IN (?, ?) ORDER BY h.job_id
`;

const PENDING_HANDOFFS = `
  SELECT h.job_id,h.source_receipt,j.repository
  FROM repair_handoff_outbox h
  JOIN repair_jobs j ON j.id=h.job_id
  LEFT JOIN repair_patch_checks v ON v.job_id=h.job_id AND v.source_receipt=h.source_receipt
  WHERE j.provider='github' AND j.status='PATCH_READY' AND h.source_receipt=j.receipt
    AND (v.job_id IS NULL OR (v.status='SOURCE_UNAVAILABLE' AND v.checked_at<=?1)
      OR (v.status='SOURCE_MATCH' AND v.execution<>'Cloudflare scheduled run'))
  ORDER BY v.checked_at IS NOT NULL, v.checked_at, j.scope='INTERNAL' DESC, h.draft_at, h.job_id
  LIMIT 4
`;

const STORE_CHECK = `
  INSERT INTO repair_patch_checks
    (job_id, source_receipt, checked_at, status, base, files, hunks, reason, execution)
  SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
  WHERE EXISTS(SELECT 1 FROM repair_handoff_outbox WHERE job_id = ? AND source_receipt = ?)
  ON CONFLICT(job_id) DO UPDATE SET source_receipt=excluded.source_receipt,
    checked_at=excluded.checked_at, status=excluded.status, base=excluded.base,
    files=excluded.files, hunks=excluded.hunks, reason=excluded.reason, execution=excluded.execution
  WHERE excluded.checked_at > repair_patch_checks.checked_at
    OR (excluded.checked_at = repair_patch_checks.checked_at
        AND excluded.source_receipt <> repair_patch_checks.source_receipt)
`;

class PendingSource extends Error {}

function validPath(path) {
  return /^[\w.@+/-]+$/.test(path) &&
    path.split("/").every(part => part && part !== "." && part !== "..");
}

function parseDiff(diff, allowed) {
  if (typeof diff !== "string" || !diff.startsWith("diff --git ") || diff.length > 50000) {
    throw Error("Expected a bounded unified diff");
  }
  const files = new Map();
  let file, hunk;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = /^diff --git a\/([^ ]+) b\/([^ ]+)$/.exec(line);
      if (!match || match[1] !== match[2] || !validPath(match[1]) ||
          (allowed && !allowed.has(match[1])) || files.has(match[1]) || files.size >= 8) {
        throw Error("Diff includes an unsupported path or operation");
      }
      file = { path: match[1], hunks: [], created: false, oldHeader: false, newHeader: false };
      files.set(file.path, file);
      hunk = null;
    } else if (line.startsWith("@@ ")) {
      const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?: .*)?$/.exec(line);
      if (!m || !file?.oldHeader || !file.newHeader) throw Error("Invalid hunk header");
      const [, oldLine, oldCount = "1", newLine, newCount = "1"] = m;
      hunk = { oldLine: Number(oldLine), oldCount: Number(oldCount), newLine: Number(newLine),
        newCount: Number(newCount), before: [], after: [] };
      file.hunks.push(hunk);
    } else if (hunk && " +-".includes(line[0])) {
      if (line[0] !== "+") hunk.before.push(line.slice(1));
      if (line[0] !== "-") hunk.after.push(line.slice(1));
    } else if (hunk && line === "" && hunk.before.length < hunk.oldCount && hunk.after.length < hunk.newCount) {
      hunk.before.push("");
      hunk.after.push("");
    } else if (!hunk && line.startsWith("--- ")) {
      file.created = line === "--- /dev/null";
      file.oldHeader = file.created || line === "--- a/" + file.path;
    } else if (!hunk && line.startsWith("+++ ")) {
      file.newHeader = line === "+++ b/" + file.path;
    } else if (line !== "" && !(file && !hunk && /^(index [0-9a-f]+\.\.[0-9a-f]+(?: 100644)?|new file mode 100644)$/.test(line))) {
      throw Error("Unexpected unified diff content");
    }
  }
  for (const f of files.values()) {
    if (!f.hunks.length || (f.created && f.hunks.length !== 1)) throw Error("Invalid file hunks");
    let priorEnd = 0;
    let offset = 0;
    for (const h of f.hunks) {
      if (!f.created && (!h.oldCount || h.oldLine < 1)) throw Error("Expected source context");
      const oldIndex = h.oldCount ? h.oldLine - 1 : h.oldLine;
      const newIndex = h.newCount ? h.newLine - 1 : h.newLine;
      if (h.before.length !== h.oldCount || h.after.length !== h.newCount ||
          oldIndex < priorEnd || newIndex !== oldIndex + offset ||
          (f.created && (h.oldLine !== 0 || h.oldCount !== 0 || !h.newCount))) {
        throw Error("Hunk count or position is inconsistent");
      }
      priorEnd = oldIndex + h.oldCount;
      offset += h.newCount - h.oldCount;
    }
  }
  return [...files.values()];
}

async function readSource(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new PendingSource("Source response had no body");
  const decoder = new TextDecoder("utf-8", { fatal:true });
  let bytes = 0, code = "";
  try {
    for (;;) {
      const {done,value} = await reader.read();
      if (done) return code + decoder.decode();
      bytes += value.byteLength;
      if (bytes > 300000) throw Error("Source exceeds verifier size limit");
      code += decoder.decode(value, {stream:true});
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
}

async function getPinnedFile(read, repository, base, path) {
  const raw = "https://raw.githubusercontent.com/" + repository + "/" + base + "/" + path;
  const primary = await read(raw, {redirect:"error", signal:AbortSignal.timeout(4000)}).catch(() => null);
  if (primary && (primary.ok || primary.status === 404)) return {response:primary, fromApi:false};
  await primary?.body?.cancel().catch(() => {});
  const api = new URL("https://api.github.com/repos/" + repository + "/contents/" + path);
  api.searchParams.set("ref",base);
  const response = await read(api.href, {
    headers: {"User-Agent":"NathanAI-Sovereign-Hive",Accept:"application/vnd.github.raw+json"},
    redirect:"error",signal:AbortSignal.timeout(6000)
  });
  return {response, fromApi:true};
}

async function fileText(response, fromApi) {
  const code = await readSource(response);
  if (!fromApi || !response.headers.get("content-type")?.includes("application/json")) return code;
  const {type,encoding,content} = JSON.parse(code);
  if (type !== "file" || encoding !== "base64" || typeof content !== "string") {
    throw new PendingSource("GitHub returned an unsupported source representation");
  }
  const bytes = Uint8Array.from(atob(content), char => char.charCodeAt(0));
  return new TextDecoder("utf-8", {fatal:true}).decode(bytes);
}

export async function verifyPatch(jobId, receipt, read = fetch, repository) {
  const canonical = /^github:([\w.-]+\/[\w.-]+)#[1-9]\d*$/.exec(jobId);
  const target = TARGETS[jobId] ??
    (repository && canonical?.[1] === repository.toLowerCase() && validPath(repository) ? {repository} : null);
  if (!target || !/^[0-9a-f]{40}$/i.test(receipt.base || "")) throw Error("Missing pinned Git revision");
  const files = parseDiff(receipt.patch, target.paths);
  const request = { redirect: "error", signal: AbortSignal.timeout(10000) };
  if (files.every(file => file.created)) {
    const base = await read("https://api.github.com/repos/" + target.repository + "/commits/" + receipt.base,
      {...request, headers: {"User-Agent":"NathanAI-Sovereign-Hive",Accept:"application/vnd.github+json"}});
    await base.body?.cancel();
    if (!base.ok) throw new PendingSource("Could not establish the pinned commit (HTTP " + base.status + ")");
  }
  await Promise.all(files.map(async f => {
    const {response,fromApi} = await getPinnedFile(read,target.repository,receipt.base,f.path);
    if (!response.ok || f.created) {
      await response.body?.cancel();
      if (f.created && response.status === 404) return;
      if (!response.ok) throw new PendingSource("Source read returned HTTP " + response.status);
      throw Error("New file already exists at the pinned revision");
    }
    const code = await fileText(response,fromApi);
    const source = code.split("\n");
    for (const h of f.hunks) {
      if (h.before.some((line, i) => line !== source[h.oldLine - 1 + i])) {
        throw Error("Source context differs at the pinned revision");
      }
    }
  }));
  return { base: receipt.base, files: files.length, hunks: files.reduce((n, f) => n + f.hunks.length, 0) };
}

export async function refreshChecks(db, scheduledAt, read = fetch) {
  const rows = (await db.prepare(PENDING_HANDOFFS).bind(scheduledAt - 15 * 60_000).all()).results;
  await Promise.all(rows.map(async row => {
    let status = "SOURCE_MATCH", reason = null, proof = {base:null,files:0,hunks:0};
    try {
      proof = await verifyPatch(row.job_id, JSON.parse(row.source_receipt), read, row.repository);
    } catch (error) {
      status = error instanceof PendingSource || error.name === "TimeoutError" ||
        error.name === "AbortError" || error instanceof TypeError ? "SOURCE_UNAVAILABLE" : "REVIEW";
      reason = error instanceof TypeError ? "Network or source-read error" : error.message.slice(0, 180);
    }
    await db.prepare(STORE_CHECK).bind(row.job_id, row.source_receipt, scheduledAt, status, proof.base,
      proof.files, proof.hunks, reason, "Cloudflare scheduled run", row.job_id, row.source_receipt).run();
  }));
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return new Response("Method not allowed", {status:405,headers:{Allow:"GET"}});
    const path = new URL(request.url).pathname;
    if (path !== "/" && path !== "/api/status") return new Response("Not found", {status:404});
    const rows = (await env.HIVE.prepare(SELECT_HANDOFFS).bind(...Object.keys(TARGETS)).all()).results;
    return Response.json({
      name: "Nathan AI Absolute Intelligence Patch Verifier",
      byline: "By Nathan Tabor and Nathan AI",
      build: "1+1=2", clear: "1-1=0",
      manMadeTraps: ["multiplication", "division"],
      verification: "Pinned source context",
      checks: rows.map(({source_receipt, ...row}) => row)
    }, {headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  },
  async scheduled(controller, env) {
    await refreshChecks(env.HIVE, controller.scheduledTime);
  }
};

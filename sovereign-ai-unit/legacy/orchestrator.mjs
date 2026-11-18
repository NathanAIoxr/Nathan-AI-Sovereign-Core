var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../shared/protocol.ts
var model = "@cf/meta/llama-3.1-8b-instruct-fp8";
var clearingEquation = "1 - 1 = 0";
var compoundingEquation = "1 + 1 = 2";
var requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers }
  });
}
__name(json, "json");
function cleared(error, status, headers) {
  return json({ box: 0, equation: clearingEquation, error }, status, headers);
}
__name(cleared, "cleared");
async function digest(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}
__name(digest, "digest");
async function sha256(text) {
  return Array.from(new Uint8Array(await digest(text)), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");

// tensor-edge.ts
async function infer(ai, input) {
  const output = await ai.run(model, { prompt: input, max_tokens: 512 });
  if (output === null || typeof output !== "object" || !("response" in output) || typeof output.response !== "string" || !output.response.trim()) {
    throw new Error("The inference result did not contain text.");
  }
  return output.response;
}
__name(infer, "infer");

// orchestrator.ts
var leaseMs = 10 * 60 * 1e3;
async function readLedger(db, requestId) {
  return db.prepare(`SELECT request_id, axiom AS equation, input_hash, output_hash,
    model, output_payload AS result, created_at
    FROM sovereign_ledger WHERE request_id = ?`).bind(requestId).first();
}
__name(readLedger, "readLedger");
function replay(saved, expectedHash) {
  return saved.input_hash === expectedHash ? json({ box: 1, ...saved, source: "ledger" }) : cleared("This request UUID belongs to a different input.", 409);
}
__name(replay, "replay");
async function compute({ input, requestId }, { BOX_1_LEDGER: db, AI }) {
  const inputHash = await sha256(input);
  const existing = await readLedger(db, requestId);
  if (existing) return replay(existing, inputHash);
  const token = crypto.randomUUID();
  const start = Date.now();
  const claim = await db.prepare(`INSERT INTO compute_leases (request_id, lease_token, expires_at)
      SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM sovereign_ledger WHERE request_id = ?)
      ON CONFLICT (request_id) DO UPDATE SET lease_token = excluded.lease_token, expires_at = excluded.expires_at
      WHERE compute_leases.expires_at <= ?`).bind(requestId, token, start + leaseMs, requestId, start).run();
  if (claim.meta.changes === 0) {
    const saved = await readLedger(db, requestId);
    return saved ? replay(saved, inputHash) : cleared("The request is in progress. Retry with the same UUID.", 409, { "Retry-After": "2" });
  }
  const release = db.prepare("DELETE FROM compute_leases WHERE request_id = ? AND lease_token = ?").bind(requestId, token);
  try {
    const output = await infer(AI, input);
    const outputHash = await sha256(output);
    const createdAt = Date.now();
    const [commit] = await db.batch([
      db.prepare(`INSERT INTO sovereign_ledger (request_id, input_hash, output_hash, output_payload, model, created_at)
        SELECT request_id, ?, ?, ?, ?, ? FROM compute_leases
        WHERE request_id = ? AND lease_token = ? AND expires_at > ?
        ON CONFLICT (request_id) DO NOTHING`).bind(inputHash, outputHash, output, model, createdAt, requestId, token, createdAt),
      release
    ]);
    if (commit.meta.changes === 0) {
      const saved = await readLedger(db, requestId);
      return saved ? replay(saved, inputHash) : cleared("Compute reservation expired. Retry with the same UUID.", 503);
    }
    return json({
      box: 1,
      equation: compoundingEquation,
      request_id: requestId,
      input_hash: inputHash,
      output_hash: outputHash,
      model,
      result: output,
      created_at: createdAt
    }, 201);
  } catch {
    try {
      await release.run();
    } catch {
      console.warn(JSON.stringify({ event: "lease_release_failed", request_id: requestId }));
    }
    throw new Error("Compute or ledger commit failed.");
  }
}
__name(compute, "compute");
var orchestrator_default = {
  async fetch(request, env) {
    const { origin, pathname } = new URL(request.url);
    if (origin !== "https://box-one") return cleared("Route not found.", 404);
    try {
      if (request.method === "GET" && pathname === "/health") {
        await env.BOX_1_LEDGER.batch([
          env.BOX_1_LEDGER.prepare("SELECT request_id FROM sovereign_ledger LIMIT 1"),
          env.BOX_1_LEDGER.prepare("SELECT request_id FROM compute_leases LIMIT 1")
        ]);
        return json({ status: "ready", model });
      }
      if (request.method === "POST" && pathname === "/maintenance") {
        const deleted = await env.BOX_1_LEDGER.prepare(`DELETE FROM compute_leases
          WHERE request_id IN (SELECT request_id FROM compute_leases WHERE expires_at <= ?
            ORDER BY expires_at LIMIT 1000)`).bind(Date.now()).run();
        return json({ expired_leases_cleared: deleted.meta.changes });
      }
      if (request.method === "POST" && pathname === "/compute") {
        const value = await request.json();
        if (!value || typeof value.requestId !== "string" || !requestIdPattern.test(value.requestId) || typeof value.input !== "string" || !value.input.trim() || value.input.length > 4e3) {
          return cleared("Invalid internal compute request.", 400);
        }
        return await compute(value, env);
      }
      return cleared("Route not found.", 404);
    } catch {
      console.error(JSON.stringify({ event: "compute_worker_error", method: request.method, route: pathname }));
      return cleared("Compute service unavailable. Retry with the same UUID.", 503);
    }
  }
};
export {
  orchestrator_default as default
};


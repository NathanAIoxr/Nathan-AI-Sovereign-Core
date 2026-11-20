const service = "nathan-ai-sovereign-engine";
const kinds = {
  "ci-failure": ["triaged"],
  "hop-in": ["verified", "rejected"],
  "voice-box": ["verified", "rejected"],
};
const hex = /^[a-f0-9]{64}$/;
const encoder = new TextEncoder();

const json = (data, status = 200) => Response.json(data, {
  status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});

export async function digest(text) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function authorized(request, secret) {
  const token = request.headers.get("authorization")?.match(/^Bearer ([^\s]{32,256})$/i)?.[1];
  if (!token || !secret || secret.length < 32) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("sovereign-engine/v1"));
  const candidate = await crypto.subtle.importKey("raw", encoder.encode(token), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", candidate, signature, encoder.encode("sovereign-engine/v1"));
}

async function limitedJson(request) {
  if (!request.body) throw new SyntaxError("Missing request body");
  const reader = request.body.getReader();
  const buffer = new Uint8Array(16384);
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (size + value.byteLength > buffer.length) {
        await reader.cancel();
        throw new RangeError("Request exceeds 16 KiB");
      }
      buffer.set(value, size);
      size += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, size)));
}

async function receiptFor(value) {
  if (!value || typeof value !== "object" || Object.keys(value).length !== 4 ||
      typeof value.source !== "string" || !Object.hasOwn(kinds, value.source) || !kinds[value.source].includes(value.verdict) ||
      typeof value.input_sha256 !== "string" || !hex.test(value.input_sha256) ||
      typeof value.evidence_sha256 !== "string" || !hex.test(value.evidence_sha256)) {
    throw new TypeError("Invalid receipt");
  }
  const receipt = { source: value.source, verdict: value.verdict, input_sha256: value.input_sha256, evidence_sha256: value.evidence_sha256 };
  const text = JSON.stringify(receipt);
  return { seal: await digest(text), text };
}

async function writeShard(db, receipts, day, budget, overflow) {
  // The conditional insert and the daily count run inside the same database transaction.
  const insert = `INSERT OR IGNORE INTO engine_receipts(seal, receipt, received_day)
    SELECT ?, ?, ? WHERE COALESCE((SELECT accepted FROM engine_budget WHERE day = ?), 0) < ?
    RETURNING seal`;
  const lookup = "SELECT seal FROM engine_receipts WHERE seal = ?";
  const statements = receipts.flatMap(({ seal, text }) => [
    db.prepare(insert).bind(seal, text, day, day, budget),
    db.prepare(lookup).bind(seal),
  ]);
  const results = await db.batch(statements);
  return Promise.all(receipts.map(async ({ seal, text }, i) => {
    if (results[2 * i].results?.[0]) return { seal, state: "committed" };
    if (results[2 * i + 1].results?.[0]) return { seal, state: "already_committed" };
    if (overflow) {
      await overflow.put(`sovereign-engine/receipts/${seal}.json`, text, { onlyIf: new Headers({ "if-none-match": "*" }) });
      return { seal, state: "buffered" };
    }
    return { seal, state: "deferred" };
  }));
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const shards = [env.DB_PRIMARY, env.DB_SHARD_2].filter(Boolean);
    if (request.method === "GET" && path === "/api/health") {
      try {
        if (!shards.length) throw new Error("Missing D1");
        await Promise.all(shards.map(db => db.prepare("SELECT day FROM engine_budget LIMIT 0").all()));
        return json({ service, ready: true, release: env.RELEASE_SHA ?? "local", shards: shards.length, overflow: Boolean(env.OVERFLOW_R2), intake: Boolean(env.ENGINE_TOKEN?.length >= 32) });
      } catch {
        return json({ service, ready: false }, 503);
      }
    }
    if (request.method !== "POST" || path !== "/api/receipts") return json({ error: "not_found" }, 404);
    if (!await authorized(request, env.ENGINE_TOKEN)) return json({ error: "unauthorized" }, 401);

    let receipts;
    try {
      const values = await limitedJson(request);
      if (!Array.isArray(values) || !values.length || values.length > 20) throw new TypeError("Expected 1–20 receipts");
      receipts = await Promise.all(values.map(receiptFor));
    } catch (error) {
      return json({ error: error instanceof RangeError ? "body_too_large" : "invalid_receipts" }, error instanceof RangeError ? 413 : 400);
    }

    const budget = Number(env.DAILY_RECEIPTS_PER_SHARD ?? 1000);
    if (!env.DB_PRIMARY || !Number.isSafeInteger(budget) || budget < 1 || budget > 10000) {
      return json({ error: "ledger_unavailable" }, 503);
    }
    try {
      const results = new Map();
      const day = new Date().toISOString().slice(0, 10);
      const unique = [...new Map(receipts.map(item => [item.seal, item])).values()];
      await Promise.all(shards.map(async (db, index) => {
        const group = unique.filter(({ seal }) => parseInt(seal.slice(0, 2), 16) % shards.length === index);
        if (!group.length) return;
        for (const result of await writeShard(db, group, day, budget, env.OVERFLOW_R2)) results.set(result.seal, result);
      }));
      const ordered = receipts.map(({ seal }) => results.get(seal));
      const pending = ordered.some(({ state }) => state === "buffered" || state === "deferred");
      return json({ receipts: ordered }, pending ? 202 : 200);
    } catch {
      console.error(JSON.stringify({ service, event: "ledger_write_failed" }));
      return json({ error: "ledger_unavailable" }, 503);
    }
  },
};

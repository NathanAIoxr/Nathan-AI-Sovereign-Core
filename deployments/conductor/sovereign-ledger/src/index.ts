import {
  FORMAT_ANCHOR,
  GENESIS_HASH,
  MAX_BATCH,
  MAX_BODY_BYTES,
  clientHash,
  isoFromUnix,
  payloadHash,
  validateAnchorFrame,
  validateRecord,
  verifyRows,
  verifySignature,
  type CleanRecord,
  type LedgerRow,
} from "./core.ts";

export interface Env {
  DB: D1Database;
  LEDGER_HMAC_SECRET: string;
  LEDGER_HMAC_SECRET_NEXT?: string; // set during secret rotation, remove afterwards
}

const MAX_ATTEMPTS = 3;
const json = (body: unknown, status = 200) => Response.json(body, { status });

const INSERT_SQL = `INSERT INTO artifact_scroll_ledger (
  entry_type, ref_client_sha256, format_anchor, scroll_siglum, cave_or_site, medium, script_lang,
  epigraphic_status, unix_timestamp, iso_timestamp, content_nfc, media_asset_sha256,
  client_sha256, payload_sha256, prev_chain_sha256
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const SELECT_COLS = `id, entry_type, ref_client_sha256, format_anchor, scroll_siglum, cave_or_site, medium,
  script_lang, epigraphic_status, unix_timestamp, iso_timestamp, content_nfc, media_asset_sha256,
  client_sha256, payload_sha256, prev_chain_sha256`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Unauthenticated liveness probe only. Reveals nothing about data.
    if (request.method === "GET" && url.pathname === "/health") return json({ status: "online" });

    if (!env.LEDGER_HMAC_SECRET) return json({ error: "server misconfigured" }, 500);

    // Body size guard before reading.
    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > MAX_BODY_BYTES) return json({ error: "body too large" }, 413);
    const body = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
    if (body.length > MAX_BODY_BYTES) return json({ error: "body too large" }, 413);

    // 1. Authentication: HMAC over timestamp + method + path/query + body hash.
    const auth = await verifySignature(
      [env.LEDGER_HMAC_SECRET, env.LEDGER_HMAC_SECRET_NEXT ?? ""],
      request.headers.get("X-Ledger-Timestamp"),
      request.headers.get("X-Ledger-Signature"),
      request.method,
      url.pathname + url.search,
      body,
      Math.floor(Date.now() / 1000),
    );
    if (!auth.ok) return json({ error: "unauthorized", reason: auth.reason }, 401);

    // 2. Format gate (version marker, not auth).
    const gate = validateAnchorFrame(request.headers.get("X-Sovereign-Anchor"));
    if (!gate.valid) return json({ error: "bad format anchor", reason: gate.reason }, 400);

    if (request.method === "POST" && url.pathname === "/ingest") return ingest(env, body);
    if (request.method === "GET" && url.pathname === "/ledger") return ledger(env, url);
    if (request.method === "GET" && url.pathname === "/head") return head(env);
    if (request.method === "GET" && url.pathname === "/verify") return verify(env, url);
    return json({ error: "not found" }, 404);
  },
};

async function tail(env: Env): Promise<{ id: number; payload_sha256: string; iso_timestamp: string } | null> {
  return env.DB.prepare(
    "SELECT id, payload_sha256, iso_timestamp FROM artifact_scroll_ledger ORDER BY id DESC LIMIT 1",
  ).first();
}

async function head(env: Env): Promise<Response> {
  const t = await tail(env);
  return json({
    status: "ok",
    anchor: FORMAT_ANCHOR,
    head_id: t?.id ?? 0,
    head_sha256: t?.payload_sha256 ?? GENESIS_HASH,
    head_iso_timestamp: t?.iso_timestamp ?? null,
  });
}

async function ledger(env: Env, url: URL): Promise<Response> {
  const siglum = url.searchParams.get("siglum");
  const after = Math.max(0, Number(url.searchParams.get("after_id") ?? "0") || 0);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50));
  const stmt = siglum
    ? env.DB.prepare(
        `SELECT ${SELECT_COLS} FROM artifact_scroll_ledger WHERE scroll_siglum = ? AND id > ? ORDER BY id ASC LIMIT ?`,
      ).bind(siglum, after, limit)
    : env.DB.prepare(
        `SELECT ${SELECT_COLS} FROM artifact_scroll_ledger WHERE id > ? ORDER BY id ASC LIMIT ?`,
      ).bind(after, limit);
  const { results } = await stmt.all<LedgerRow>();
  return json({ status: "ok", count: results.length, records: results });
}

async function verify(env: Env, url: URL): Promise<Response> {
  const after = Math.max(0, Number(url.searchParams.get("after_id") ?? "0") || 0);
  const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") ?? "500") || 500));

  let expectedPrev = GENESIS_HASH;
  if (after > 0) {
    const p = await env.DB.prepare("SELECT payload_sha256 FROM artifact_scroll_ledger WHERE id = ?")
      .bind(after)
      .first<{ payload_sha256: string }>();
    if (!p) return json({ error: "after_id not found" }, 404);
    expectedPrev = p.payload_sha256;
  }

  const { results } = await env.DB.prepare(
    `SELECT ${SELECT_COLS} FROM artifact_scroll_ledger WHERE id > ? ORDER BY id ASC LIMIT ?`,
  )
    .bind(after, limit)
    .all<LedgerRow>();

  const r = await verifyRows(results, expectedPrev);
  const lastId = results.length ? results[results.length - 1]!.id : after;
  return json({ ...r, next_after_id: lastId, done: results.length < limit }, r.ok ? 200 : 409);
}

async function ingest(env: Env, body: string): Promise<Response> {
  let parsed: { records?: unknown };
  try {
    parsed = JSON.parse(body);
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const raw = parsed.records;
  if (!Array.isArray(raw) || raw.length === 0) return json({ error: "records[] required" }, 400);
  if (raw.length > MAX_BATCH) return json({ error: `max ${MAX_BATCH} records per request` }, 400);

  // Validate + fingerprint every record before touching the database.
  const items: Array<{ rec: CleanRecord; clientSha: string }> = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.length; i++) {
    const v = validateRecord(raw[i]);
    if (!v.ok) return json({ error: `record ${i}: ${v.error}` }, 422);
    const clientSha = await clientHash(v.value);
    const supplied = (raw[i] as Record<string, unknown>).client_sha256;
    if (supplied !== clientSha) return json({ error: `record ${i}: client_sha256 mismatch`, expected: clientSha }, 422);
    if (seen.has(clientSha)) return json({ error: `record ${i}: duplicate within batch` }, 422);
    seen.add(clientSha);
    items.push({ rec: v.value, clientSha });
  }

  // A correction must reference a record that already exists, or one earlier in this same batch.
  const refs = [...new Set(items.map((x) => x.rec.ref_client_sha256).filter((x): x is string => x !== null))];
  if (refs.length > 0) {
    const marks = refs.map(() => "?").join(",");
    const { results } = await env.DB.prepare(
      `SELECT client_sha256 FROM artifact_scroll_ledger WHERE client_sha256 IN (${marks})`,
    )
      .bind(...refs)
      .all<{ client_sha256: string }>();
    const known = new Set(results.map((r) => r.client_sha256));
    for (let i = 0; i < items.length; i++) {
      const ref = items[i]!.rec.ref_client_sha256;
      if (ref !== null && !known.has(ref)) {
        const earlier = items.slice(0, i).some((x) => x.clientSha === ref);
        if (!earlier) return json({ error: `record ${i}: ref_client_sha256 not found` }, 422);
      }
    }
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const t = await tail(env);
    let prev = t?.payload_sha256 ?? GENESIS_HASH;
    const unixTs = Math.floor(Date.now() / 1000);
    const isoTs = isoFromUnix(unixTs);

    const statements: D1PreparedStatement[] = [];
    const sealed: Array<{ client_sha256: string; payload_sha256: string; iso_timestamp: string }> = [];
    for (const { rec, clientSha } of items) {
      const payloadSha = await payloadHash(rec, clientSha, prev, unixTs);
      statements.push(
        env.DB.prepare(INSERT_SQL).bind(
          rec.entry_type,
          rec.ref_client_sha256,
          FORMAT_ANCHOR,
          rec.scroll_siglum,
          rec.cave_or_site,
          rec.medium,
          rec.script_lang,
          rec.epigraphic_status,
          unixTs,
          isoTs,
          rec.content_nfc,
          rec.media_asset_sha256,
          clientSha,
          payloadSha,
          prev,
        ),
      );
      sealed.push({ client_sha256: clientSha, payload_sha256: payloadSha, iso_timestamp: isoTs });
      prev = payloadSha;
    }

    try {
      await env.DB.batch(statements); // atomic: all rows commit or none do
      return json({ status: "committed", count: sealed.length, head_sha256: prev, records: sealed });
    } catch (err) {
      const msg = String((err as Error)?.message ?? err);
      if (msg.includes("client_sha256")) return json({ error: "duplicate record (already ingested)" }, 409);
      if (msg.includes("prev_chain_sha256") || msg.includes("payload_sha256")) continue; // another writer won; re-read tail, retry
      return json({ error: "write failed" }, 500);
    }
  }
  return json({ error: "chain contention, retry" }, 503);
}

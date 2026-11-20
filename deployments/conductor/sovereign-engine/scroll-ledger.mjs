import { anchorHex, authorized, digest } from "./worker.mjs";

const prefix = "/api/artifact-scroll";
const genesis = "0".repeat(64);
const hashPattern = /^[0-9a-f]{64}$/;
const media = new Set(["parchment", "papyrus", "copper", "stone"]);
const languages = new Set(["Hebrew", "Aramaic", "Greek", "Paleo-Hebrew"]);
const statuses = new Set(["extant_verified", "reconstructed"]);
const headers = { "cache-control": "no-store", "x-content-type-options": "nosniff" };
const json = (value, status = 200) => Response.json(value, { status, headers });

function textField(value, maximum) {
  if (typeof value !== "string" || value.length > maximum * 2 || !value.isWellFormed()) throw new TypeError("Invalid text");
  const normalized = value.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "").normalize("NFC");
  if (!normalized || new TextEncoder().encode(normalized).length > maximum) throw new TypeError("Invalid text length");
  return normalized;
}

export async function sealInput(value, now) {
  if (!value || typeof value !== "object" || !media.has(value.medium) || !languages.has(value.script_lang)
      || !statuses.has(value.epigraphic_status)) throw new TypeError("Invalid artifact metadata");
  const stamp = value.unix_timestamp ?? now;
  if (!Number.isSafeInteger(stamp) || stamp < 0 || stamp > 253402300799) throw new TypeError("Invalid UTC timestamp");
  const mediaHash = value.media_asset_sha256 ?? null;
  if (mediaHash !== null && (typeof mediaHash !== "string" || !hashPattern.test(mediaHash))) throw new TypeError("Invalid media hash");
  const record = {
    anchor: anchorHex,
    lang: value.script_lang,
    media_hash: mediaHash,
    medium: value.medium,
    siglum: textField(value.scroll_siglum, 96),
    site: textField(value.cave_or_site, 256),
    status: value.epigraphic_status,
    text: textField(value.raw_text, 8192),
    ts_unix: stamp,
  };
  return { record, fingerprint: await digest(JSON.stringify(record)) };
}

const selectTail = "SELECT payload_sha256 FROM artifact_scroll_ledger ORDER BY id DESC LIMIT 1";
const selectFingerprint = "SELECT scroll_siglum, payload_sha256, iso_timestamp, fingerprint_sha256 FROM artifact_scroll_ledger WHERE fingerprint_sha256=?";
const insert = `INSERT INTO artifact_scroll_ledger (
  anchor_hex, scroll_siglum, cave_or_site, medium, script_lang, epigraphic_status, unix_timestamp,
  iso_timestamp, content_nfc, payload_sha256, prev_chain_sha256, media_asset_sha256, fingerprint_sha256
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

async function append(db, inputs) {
  const unique = [...new Map(inputs.map(input => [input.fingerprint, input])).values()];
  for (let attempt = 0; attempt < 3; attempt++) {
    const [tail, ...previous] = await db.batch([
      db.prepare(selectTail), ...unique.map(({ fingerprint }) => db.prepare(selectFingerprint).bind(fingerprint)),
    ]);
    let head = tail.results[0]?.payload_sha256 ?? genesis;
    const receipts = new Map();
    const inserts = [];
    for (const [index, { record, fingerprint }] of unique.entries()) {
      const prior = previous[index].results[0];
      if (prior) {
        receipts.set(fingerprint, prior);
        continue;
      }
      const { anchor, lang, media_hash, medium, siglum, site, status, text, ts_unix } = record;
      const payload = { anchor, lang, media_hash, medium, prev_hash: head, siglum, site, status, text, ts_unix };
      const hash = await digest(JSON.stringify(payload));
      const iso = new Date(ts_unix * 1000).toISOString().replace(".000Z", "Z");
      inserts.push(db.prepare(insert).bind(anchor, siglum, site, medium, lang, status, ts_unix, iso, text, hash, head, media_hash, fingerprint));
      receipts.set(fingerprint, { scroll_siglum: siglum, payload_sha256: hash, iso_timestamp: iso, fingerprint_sha256: fingerprint });
      head = hash;
    }
    try {
      if (inserts.length) await db.batch(inserts);
      return { count: inputs.length, inserted: inserts.length, head_sha256: head, records: inputs.map(({ fingerprint }) => receipts.get(fingerprint)) };
    } catch (error) {
      if (!String(error).includes("artifact_scroll_stale_head")) throw error;
    }
  }
  return null;
}

export async function serveScrollLedger(request, env, path, limitedBody) {
  if (!["/health", "/ingest", "/ledger"].some(route => path === prefix + route)) return undefined;
  const provided = request.headers.get("X-Sovereign-Anchor")?.replace(/[ \t]/g, "").toUpperCase();
  if (provided !== anchorHex) return json({ status: "1-1=0_PURGE", error: "invalid_anchor_frame" }, 403);
  const db = env.ENGINE_DB_PRIMARY;
  try {
    if (request.method === "GET" && path === prefix + "/health") {
      await db.prepare(selectTail).first();
      return json({ status: "1+1=2_ONLINE", anchor: anchorHex, ready: true, release: env.RELEASE_SHA ?? "local", intake: Boolean(env.SCROLL_LEDGER_TOKEN?.length >= 32) });
    }
    if (!await authorized(request, env.SCROLL_LEDGER_TOKEN)) return json({ error: "unauthorized" }, 401);
    if (request.method === "POST" && path === prefix + "/ingest") {
      let inputs;
      try {
        const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(await limitedBody(request, 196608)));
        if (!Array.isArray(data?.records) || !data.records.length || data.records.length > 20) throw new TypeError("Batch must contain 1–20 records");
        const now = Math.floor(Date.now() / 1000);
        inputs = await Promise.all(data.records.map(row => sealInput(row, now)));
      } catch (error) {
        return json({ status: "1-1=0_PURGE", error: error instanceof RangeError ? "body_too_large" : "invalid_artifact_batch" }, error instanceof RangeError ? 413 : 400);
      }
      const result = await append(db, inputs);
      return result
        ? json({ status: "1+1=2_COMMITTED", anchor: anchorHex, ...result })
        : json({ error: "ledger_busy" }, 503);
    }
    if (request.method === "GET" && path === prefix + "/ledger") {
      const query = new URL(request.url).searchParams;
      const after = Number(query.get("after") ?? 0);
      const siglum = query.get("siglum")?.normalize("NFC");
      if (!Number.isSafeInteger(after) || after < 0 || (siglum !== undefined && siglum.length > 96)) return json({ error: "invalid_query" }, 400);
      const statement = siglum
        ? db.prepare("SELECT * FROM artifact_scroll_ledger WHERE scroll_siglum=? AND id>? ORDER BY id LIMIT 50").bind(siglum, after)
        : db.prepare("SELECT * FROM artifact_scroll_ledger WHERE id>? ORDER BY id LIMIT 50").bind(after);
      const { results } = await statement.all();
      return json({ status: "1+1=2_ONLINE", count: results.length, next_after: results.at(-1)?.id ?? after, records: results });
    }
    return json({ error: "method_not_allowed" }, 405);
  } catch (error) {
    if (String(error).includes("artifact_scroll_daily_budget")) return json({ error: "daily_write_budget" }, 429);
    return json({ error: "ledger_unavailable" }, 503);
  }
}

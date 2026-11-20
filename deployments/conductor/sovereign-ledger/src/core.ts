// Pure logic. No Cloudflare types, so it runs under Node for tests and under Workers in prod.
// The Python engine (python/ledger.py) implements the identical scheme; test/vectors.json
// proves byte-for-byte parity.

export const FORMAT_ANCHOR = "AA55FF01312B313D327E312D313D300400F0";
export const GENESIS_HASH = "0".repeat(64);

export const MAX_SKEW_SECONDS = 300;
export const MAX_BATCH = 20; // conservative for Workers Free subrequest limits; raise after testing on Paid
export const MAX_TEXT_BYTES = 100_000;
export const MAX_BODY_BYTES = 2_000_000;

export const STATUSES = ["extant_verified", "reconstructed"] as const;
export const MEDIA = ["parchment", "papyrus", "copper", "stone", "other"] as const;
export const LANGS = ["Hebrew", "Aramaic", "Greek", "Paleo-Hebrew", "other"] as const;
export const ENTRY_TYPES = ["record", "correction"] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export interface CleanRecord {
  entry_type: EntryType;
  ref_client_sha256: string | null;
  scroll_siglum: string;
  cave_or_site: string;
  medium: (typeof MEDIA)[number];
  script_lang: (typeof LANGS)[number];
  epigraphic_status: (typeof STATUSES)[number];
  content_nfc: string;
  media_asset_sha256: string | null;
}

export interface LedgerRow extends CleanRecord {
  id: number;
  format_anchor: string;
  unix_timestamp: number;
  iso_timestamp: string;
  client_sha256: string;
  payload_sha256: string;
  prev_chain_sha256: string;
}

// ---------- canonical JSON (sorted keys, no whitespace, raw UTF-8) ----------

export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isSafeInteger(value)) throw new Error("canonicalJson: only safe integers allowed");
      return String(value);
    case "string":
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k])).join(",") + "}";
    }
    default:
      throw new Error("canonicalJson: unsupported type " + typeof value);
  }
}

// ---------- hashing ----------

const enc = new TextEncoder();

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export async function sha256Hex(input: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(input))));
}

function contentFields(r: CleanRecord) {
  return {
    anchor: FORMAT_ANCHOR,
    entry_type: r.entry_type,
    lang: r.script_lang,
    media_hash: r.media_asset_sha256,
    medium: r.medium,
    ref: r.ref_client_sha256,
    siglum: r.scroll_siglum,
    site: r.cave_or_site,
    status: r.epigraphic_status,
    text: r.content_nfc,
  };
}

/** Content fingerprint: independent of chain position and time. Computed by client AND server. */
export function clientHash(r: CleanRecord): Promise<string> {
  return sha256Hex(canonicalJson(contentFields(r)));
}

/** Chain hash: binds content fingerprint, previous hash, and the time-scroll stamp. */
export function payloadHash(r: CleanRecord, clientSha: string, prev: string, unixTs: number): Promise<string> {
  return sha256Hex(
    canonicalJson({ ...contentFields(r), client_hash: clientSha, prev_hash: prev, ts_unix: unixTs }),
  );
}

export function isoFromUnix(unixTs: number): string {
  return new Date(unixTs * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
}

// ---------- validation ----------

const HEX64 = /^[0-9a-f]{64}$/;
const utf8Len = (s: string) => enc.encode(s).length;

export type Validation = { ok: true; value: CleanRecord } | { ok: false; error: string };

export function validateRecord(input: unknown): Validation {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "record must be an object" };
  }
  const r = input as Record<string, unknown>;

  const str = (k: string, max: number): string | null => {
    const v = r[k];
    if (typeof v !== "string") return null;
    const t = v.trim().normalize("NFC");
    return t.length >= 1 && t.length <= max ? t : null;
  };

  const entry_type = (r.entry_type ?? "record") as string;
  if (!(ENTRY_TYPES as readonly string[]).includes(entry_type)) return { ok: false, error: "invalid entry_type" };

  const scroll_siglum = str("scroll_siglum", 64);
  if (!scroll_siglum) return { ok: false, error: "scroll_siglum required (1-64 chars)" };
  const cave_or_site = str("cave_or_site", 128);
  if (!cave_or_site) return { ok: false, error: "cave_or_site required (1-128 chars)" };

  const medium = r.medium as string;
  if (!(MEDIA as readonly string[]).includes(medium)) return { ok: false, error: "invalid medium" };
  const script_lang = r.script_lang as string;
  if (!(LANGS as readonly string[]).includes(script_lang)) return { ok: false, error: "invalid script_lang" };
  const epigraphic_status = r.epigraphic_status as string;
  if (!(STATUSES as readonly string[]).includes(epigraphic_status)) {
    return { ok: false, error: "invalid epigraphic_status" };
  }

  if (typeof r.raw_text !== "string") return { ok: false, error: "raw_text required" };
  const content_nfc = r.raw_text.trim().normalize("NFC");
  if (content_nfc.length === 0) return { ok: false, error: "raw_text must not be empty" };
  if (utf8Len(content_nfc) > MAX_TEXT_BYTES) return { ok: false, error: `raw_text exceeds ${MAX_TEXT_BYTES} bytes` };

  const mediaRaw = r.media_asset_sha256 ?? null;
  if (mediaRaw !== null && (typeof mediaRaw !== "string" || !HEX64.test(mediaRaw))) {
    return { ok: false, error: "media_asset_sha256 must be 64 lowercase hex chars" };
  }

  const refRaw = r.ref_client_sha256 ?? null;
  if (refRaw !== null && (typeof refRaw !== "string" || !HEX64.test(refRaw))) {
    return { ok: false, error: "ref_client_sha256 must be 64 lowercase hex chars" };
  }
  if (entry_type === "record" && refRaw !== null) return { ok: false, error: "record must not carry ref_client_sha256" };
  if (entry_type === "correction" && refRaw === null) return { ok: false, error: "correction requires ref_client_sha256" };

  return {
    ok: true,
    value: {
      entry_type: entry_type as EntryType,
      ref_client_sha256: refRaw as string | null,
      scroll_siglum,
      cave_or_site,
      medium: medium as CleanRecord["medium"],
      script_lang: script_lang as CleanRecord["script_lang"],
      epigraphic_status: epigraphic_status as CleanRecord["epigraphic_status"],
      content_nfc,
      media_asset_sha256: mediaRaw as string | null,
    },
  };
}

// ---------- format gate (NOT authentication) ----------

/** Structural check of the 18-byte format frame. A version/format marker only; HMAC is the auth. */
export function validateAnchorFrame(hex: string | null): { valid: boolean; reason: string } {
  if (!hex) return { valid: false, reason: "missing anchor" };
  const clean = hex.replace(/\s+/g, "").toUpperCase();
  if (!/^[0-9A-F]{36}$/.test(clean)) return { valid: false, reason: "anchor must be 18 bytes (36 hex chars)" };
  const b = fromHex(clean)!;
  if (b[0] !== 0xaa || b[1] !== 0x55 || b[2] !== 0xff || b[3] !== 0x01) return { valid: false, reason: "bad SOF" };
  if (b[9] !== 0x7e || b[16] !== 0x00 || b[17] !== 0xf0) return { valid: false, reason: "bad spine/EOF" };
  const expected = [0x00, 0x06, 0x00, 0x00, 0x02];
  let seal = 0;
  for (let i = 0; i < 5; i++) {
    const x = b[4 + i]! ^ b[10 + i]!;
    if (x !== expected[i]) return { valid: false, reason: `rail mismatch at byte ${i}` };
    seal ^= x;
  }
  if (b[15] !== seal || seal !== 0x04) return { valid: false, reason: "seal mismatch" };
  if (clean !== FORMAT_ANCHOR) return { valid: false, reason: "unknown anchor version" };
  return { valid: true, reason: "ok" };
}

// ---------- request signing (HMAC-SHA256) ----------

export async function bodySha256(body: string): Promise<string> {
  return sha256Hex(body);
}

export function signingString(ts: string, method: string, pathAndQuery: string, bodyHash: string): string {
  return `${ts}\n${method.toUpperCase()}\n${pathAndQuery}\n${bodyHash}`;
}

async function hmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export async function signRequest(
  secret: string,
  ts: string,
  method: string,
  pathAndQuery: string,
  body: string,
): Promise<string> {
  const key = await hmacKey(secret, "sign");
  const msg = signingString(ts, method, pathAndQuery, await bodySha256(body));
  return toHex(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg))));
}

/** Verifies against every provided secret (current + next) so secrets can be rotated without downtime. */
export async function verifySignature(
  secrets: string[],
  ts: string | null,
  sigHex: string | null,
  method: string,
  pathAndQuery: string,
  body: string,
  nowSec: number,
): Promise<{ ok: boolean; reason: string }> {
  if (!ts || !sigHex) return { ok: false, reason: "missing signature headers" };
  if (!/^\d{1,12}$/.test(ts)) return { ok: false, reason: "bad timestamp" };
  if (Math.abs(nowSec - Number(ts)) > MAX_SKEW_SECONDS) return { ok: false, reason: "timestamp outside allowed window" };
  const sig = fromHex(sigHex);
  if (!sig || sig.length !== 32) return { ok: false, reason: "bad signature encoding" };
  const msg = enc.encode(signingString(ts, method, pathAndQuery, await bodySha256(body)));
  for (const secret of secrets.filter((s) => s.length > 0)) {
    // crypto.subtle.verify is constant-time
    if (await crypto.subtle.verify("HMAC", await hmacKey(secret, "verify"), sig.slice().buffer as ArrayBuffer, msg)) return { ok: true, reason: "ok" };
  }
  return { ok: false, reason: "signature mismatch" };
}

// ---------- chain verification ----------

export interface VerifyResult {
  ok: boolean;
  checked: number;
  last_hash: string;
  broken_at_id?: number;
  reason?: string;
}

export async function verifyRows(rows: LedgerRow[], expectedPrev: string): Promise<VerifyResult> {
  let prev = expectedPrev;
  let checked = 0;
  for (const row of rows) {
    const fail = (reason: string): VerifyResult => ({ ok: false, checked, last_hash: prev, broken_at_id: row.id, reason });
    if (row.format_anchor !== FORMAT_ANCHOR) return fail("anchor mismatch");
    if (row.prev_chain_sha256 !== prev) return fail("prev hash link broken");
    if ((await clientHash(row)) !== row.client_sha256) return fail("content fingerprint mismatch");
    if ((await payloadHash(row, row.client_sha256, row.prev_chain_sha256, row.unix_timestamp)) !== row.payload_sha256) {
      return fail("payload hash mismatch");
    }
    if (isoFromUnix(row.unix_timestamp) !== row.iso_timestamp) return fail("timestamp mismatch");
    prev = row.payload_sha256;
    checked++;
  }
  return { ok: true, checked, last_hash: prev };
}

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FORMAT_ANCHOR,
  GENESIS_HASH,
  MAX_SKEW_SECONDS,
  canonicalJson,
  clientHash,
  isoFromUnix,
  payloadHash,
  signRequest,
  validateAnchorFrame,
  validateRecord,
  verifyRows,
  verifySignature,
  type LedgerRow,
} from "../src/core.ts";

const vectors = JSON.parse(readFileSync(new URL("./vectors.json", import.meta.url), "utf-8"));

test("anchor frame validates and matches constant", () => {
  assert.equal(vectors.anchor, FORMAT_ANCHOR);
  assert.deepEqual(validateAnchorFrame(FORMAT_ANCHOR), { valid: true, reason: "ok" });
});

test("anchor frame rejects tampering", () => {
  assert.equal(validateAnchorFrame(null).valid, false);
  assert.equal(validateAnchorFrame("AA55").valid, false);
  // flip one rail byte
  const bad = FORMAT_ANCHOR.slice(0, 8) + "32" + FORMAT_ANCHOR.slice(10);
  assert.equal(validateAnchorFrame(bad).valid, false);
});

test("canonicalJson sorts keys, no whitespace, rejects floats", () => {
  assert.equal(canonicalJson({ b: 1, a: [true, null, "x"] }), '{"a":[true,null,"x"],"b":1}');
  assert.throws(() => canonicalJson({ a: 1.5 }));
});

for (const [i, c] of vectors.cases.entries()) {
  test(`parity with Python reference, case ${i}`, async () => {
    const v = validateRecord(c.input);
    assert.ok(v.ok, v.ok ? "" : v.error);
    assert.equal(v.value.content_nfc, c.content_nfc);
    assert.equal(canonicalJson({
      anchor: FORMAT_ANCHOR, entry_type: v.value.entry_type, lang: v.value.script_lang,
      media_hash: v.value.media_asset_sha256, medium: v.value.medium, ref: v.value.ref_client_sha256,
      siglum: v.value.scroll_siglum, site: v.value.cave_or_site, status: v.value.epigraphic_status,
      text: v.value.content_nfc,
    }), c.canonical_content);
    assert.equal(await clientHash(v.value), c.client_sha256);
    assert.equal(await payloadHash(v.value, c.client_sha256, c.prev, c.ts), c.payload_sha256);
  });
}

test("HMAC signatures match Python and verify", async () => {
  for (const h of vectors.hmac) {
    const sig = await signRequest(h.secret, h.ts, h.method, h.path, h.body);
    assert.equal(sig, h.signature);
    const now = Number(h.ts);
    assert.deepEqual(await verifySignature([h.secret], h.ts, sig, h.method, h.path, h.body, now), { ok: true, reason: "ok" });
  }
});

test("HMAC rejects wrong secret, altered body, altered path, stale timestamp; accepts rotated secret", async () => {
  const h = vectors.hmac[1];
  const now = Number(h.ts);
  const sig = h.signature;
  assert.equal((await verifySignature(["wrong"], h.ts, sig, h.method, h.path, h.body, now)).ok, false);
  assert.equal((await verifySignature([h.secret], h.ts, sig, h.method, h.path, h.body + " ", now)).ok, false);
  assert.equal((await verifySignature([h.secret], h.ts, sig, h.method, "/other", h.body, now)).ok, false);
  assert.equal((await verifySignature([h.secret], h.ts, sig, h.method, h.path, h.body, now + MAX_SKEW_SECONDS + 1)).ok, false);
  assert.equal((await verifySignature([h.secret], null, sig, h.method, h.path, h.body, now)).ok, false);
  assert.equal((await verifySignature(["old-or-empty", h.secret], h.ts, sig, h.method, h.path, h.body, now)).ok, true);
});

test("validation rejects bad input", () => {
  const good = vectors.cases[0].input;
  assert.equal(validateRecord({ ...good, medium: "wood" }).ok, false);
  assert.equal(validateRecord({ ...good, epigraphic_status: "guess" }).ok, false);
  assert.equal(validateRecord({ ...good, raw_text: "   " }).ok, false);
  assert.equal(validateRecord({ ...good, media_asset_sha256: "xyz" }).ok, false);
  assert.equal(validateRecord({ ...good, entry_type: "correction" }).ok, false); // needs ref
  assert.equal(validateRecord({ ...good, ref_client_sha256: "a".repeat(64) }).ok, false); // record must not have ref
  assert.equal(validateRecord(null).ok, false);
});

async function buildChain(): Promise<LedgerRow[]> {
  const rows: LedgerRow[] = [];
  let prev = GENESIS_HASH;
  for (const [i, c] of vectors.cases.entries()) {
    const v = validateRecord(c.input);
    if (!v.ok) throw new Error(v.error);
    const clientSha = await clientHash(v.value);
    const ts = 1767225600 + i;
    const payloadSha = await payloadHash(v.value, clientSha, prev, ts);
    rows.push({ ...v.value, id: i + 1, format_anchor: FORMAT_ANCHOR, unix_timestamp: ts,
      iso_timestamp: isoFromUnix(ts), client_sha256: clientSha, payload_sha256: payloadSha, prev_chain_sha256: prev });
    prev = payloadSha;
  }
  return rows;
}

test("verifyRows accepts an intact chain", async () => {
  const rows = await buildChain();
  const r = await verifyRows(rows, GENESIS_HASH);
  assert.equal(r.ok, true);
  assert.equal(r.checked, rows.length);
});

test("verifyRows detects content tampering, link breaks, and timestamp edits", async () => {
  let rows = await buildChain();
  rows[1] = { ...rows[1]!, content_nfc: "forged" };
  const a = await verifyRows(rows, GENESIS_HASH);
  assert.equal(a.ok, false);
  assert.equal(a.broken_at_id, 2);

  rows = await buildChain();
  rows[2] = { ...rows[2]!, prev_chain_sha256: "f".repeat(64) };
  assert.equal((await verifyRows(rows, GENESIS_HASH)).broken_at_id, 3);

  rows = await buildChain();
  rows[0] = { ...rows[0]!, unix_timestamp: rows[0]!.unix_timestamp + 1, iso_timestamp: isoFromUnix(rows[0]!.unix_timestamp + 1) };
  assert.equal((await verifyRows(rows, GENESIS_HASH)).broken_at_id, 1);

  rows = await buildChain();
  rows.splice(1, 1); // delete a middle record
  assert.equal((await verifyRows(rows, GENESIS_HASH)).ok, false);
});

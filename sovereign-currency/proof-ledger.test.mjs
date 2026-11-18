import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "./dist.mjs";
import { expectedHash, genesisHeader, genesisNonce, verifyHeader } from "./proof.mjs";

const call = (path, init, env) => worker.fetch(new Request("https://test.invalid" + path, init), env);
const compact = (header, bits) => header.slice(0, 144) + bits + header.slice(152);
const schema = await readFile(new URL("proof-ledger.sql", import.meta.url), "utf8");

test("verifies the 80-byte historical header, exact hash, nonce and target", async () => {
  const result = await verifyHeader(genesisHeader.toUpperCase(), expectedHash.toUpperCase());
  assert.equal(result.ok, true);
  assert.equal(result.nonce, genesisNonce);
  assert.equal(result.bits, "1d00ffff");
  assert.equal(result.hash, expectedHash);
  assert.equal(result.target, "00000000ffff" + "0".repeat(52));
  const replay = await (await call("/api/genesis")).json();
  assert.deepEqual(replay.forward, { tested: 5, candidates: 1 });
  assert.deepEqual(replay.reverse, [{ nonce: genesisNonce, hash: expectedHash, accepted: true }]);
});

test("rejects malformed inputs, compact target boundaries and a changed nonce", async () => {
  assert.equal((await verifyHeader("00")).error, "header_must_be_80_hex_bytes");
  assert.equal((await verifyHeader(genesisHeader, null)).error, "claimed_hash_must_be_32_hex_bytes");
  assert.equal((await verifyHeader(genesisHeader, "0".repeat(64))).error, "claimed_hash_mismatch");
  for (const bits of ["00000000", "ffff801d", "ffff0021", "ffff001e", "01000001"]) {
    assert.equal((await verifyHeader(compact(genesisHeader, bits))).error, "invalid_compact_target");
  }
  assert.equal((await verifyHeader(genesisHeader.slice(0, -2) + "00")).error, "hash_above_target");
});

test("enforces HTTP methods and limits and accepts browser and JSON verification", async () => {
  const url = "/api/pow/verify";
  assert.equal((await call(url)).status, 405);
  assert.equal((await call(url, { method: "POST", body: "body" })).status, 415);
  const send = body => call(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
  assert.equal((await send(" ".repeat(2049))).status, 413);
  assert.equal((await send("[]")).status, 400);
  assert.equal((await send(JSON.stringify({ headerHex: genesisHeader, claimedHash: "0".repeat(64) }))).status, 422);
  assert.equal((await send(JSON.stringify({ headerHex: genesisHeader, claimedHash: expectedHash }))).status, 200);
  assert.equal((await call(url, { method: "POST", body: new URLSearchParams({ headerHex: genesisHeader }) })).status, 200);
});

test("stores one immutable receipt under concurrent replays and audits rows", async () => {
  const sql = new DatabaseSync(":memory:");
  sql.exec(schema);
  sql.exec(schema);
  const env = { SWITCHBOARD_DB: { prepare(query) {
    const statement = sql.prepare(query);
    return { bind(...args) {
      return {
        async run() { return statement.run(...args); },
        async first() { return statement.get(...args); },
        async all() { return { results: statement.all(...args) }; }
      };
    } };
  } } };
  const path = "/api/pow/ledger";
  const get = (suffix = "") => call(path + suffix, {}, env);
  const post = () => call(path, { method: "POST" }, env);
  assert.deepEqual((await (await get()).json()).entries, []);
  assert.equal((await call(path, { method: "POST", body: "{}" }, env)).status, 400);
  const [first, second] = await Promise.all([post(), post()].map(async response => (await response).json()));
  assert.deepEqual(first, second);
  assert.equal(first.proof.hash, expectedHash);
  assert.deepEqual((await (await get()).json()).entries, [first]);
  assert.deepEqual((await (await get("?after=1")).json()).entries, []);
  assert.equal((await get("?after=-1")).status, 400);
  assert.throws(() => sql.exec("UPDATE sovereign_header_receipts SET block_hash = block_hash"), /append-only/);
  assert.throws(() => sql.exec("DELETE FROM sovereign_header_receipts"), /append-only/);
  sql.exec("DROP TRIGGER sovereign_header_receipts_no_update");
  sql.exec("UPDATE sovereign_header_receipts SET receipt_id = '" + "0".repeat(64) + "'");
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal((await get()).status, 503);
  } finally {
    console.error = originalError;
    sql.close();
  }
});

test("publishes a verifiable agent ZIP and links it from both pages", async () => {
  const manifest = await (await call("/api/agent-downloads")).json();
  const download = await call(manifest.path);
  const bytes = Buffer.from(await download.arrayBuffer());
  assert.equal(download.headers.get("content-type"), "application/zip");
  assert.equal(bytes.byteLength, manifest.bytes);
  assert.equal(bytes.subarray(0, 4).toString("hex"), "504b0304");
  assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.sha256);
  assert.equal(await (await call(manifest.path, { method: "HEAD" })).text(), "");
  assert.match(await (await call("/")).text(), /href="\/verifier"/);
  assert.match(await (await call("/verifier")).text(), /href="\/downloads\/tabor-sovereign-agent.zip"/);
});

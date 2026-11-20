import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { biofilm, demo, refine } from "../src/engine.mjs";
import { recordClaim, schema, signedMessage, verifyClaim } from "../src/ledger.mjs";
import { genesisHash, genesisHeader, genesisNonce, miningDemo, nonceSequence, targetFromBits, verifyHeader } from "../src/mining.mjs";
import worker from "../src/worker.mjs";

test("eight arms measure gzip and independently match forward and reverse cleanup digests", async () => {
  const report = await refine(demo);
  assert.equal(report.activeArms, 8);
  assert.equal(report.retired, 160);
  assert.equal(report.discardedTraffic, 1);
  assert.equal(report.forwardDigest, report.reverseDigest);
  assert.ok(report.gzipBytes < report.serializedBytesAfter);
  assert.notEqual(report.receiptHash, report.forwardDigest);
  const shuffled = await refine({ ...demo, packets: demo.packets.toReversed() });
  assert.equal(shuffled.receiptHash, report.receiptHash);
});

test("traffic counts and reverse nonce records contribute zero cleanup credit", async () => {
  const report = await refine({ ...demo, packets: demo.packets.slice(-2) });
  assert.equal(report.discardedTraffic, 1);
  assert.equal(report.retired, 0);
  assert.equal(report.candidateCleanUnits, 0);
});

test("biofilm carries excess units and conserves the 50/25/15/10 split", () => {
  assert.equal(biofilm(999).bundles, 0);
  assert.deepEqual(biofilm(2050), {
    cleanUnits: 2050, threshold: 1000, bundles: 2, unitsCarried: 50,
    allocation: { coreReserve: 100, jetSiphonExpansion: 50, nodeArmOperators: 30, ecosystemLiquidity: 20 }
  });
});

test("verified ledger admits a signed measured result once per receipt and source window", async t => {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec(schema);
  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      return { bind: (...args) => ({
        run: () => ({ meta: { changes: Number(statement.run(...args).changes) } }),
        first: () => statement.get(...args)
      }) };
    }
  };
  const { privateKey, publicKey } = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  const verifier = Buffer.from(await crypto.subtle.exportKey("raw", publicKey)).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  const claim = { workspace: "specimen", window: "first", receiptHash: "d".repeat(64), bytesReclaimed: 1024000, expiresAt: now + 60 };
  claim.signature = Buffer.from(await crypto.subtle.sign("Ed25519", privateKey, signedMessage("staging", claim))).toString("hex");
  assert.equal(await verifyClaim("staging", verifier, claim, now), true);
  assert.equal(await verifyClaim("release", verifier, claim, now), false);
  assert.equal(await verifyClaim("staging", verifier, { ...claim, bytesReclaimed: 2048000 }, now), false);
  const env = { GOLDEN_GOOSE_ENV: "staging", GOLDEN_GOOSE_DB: db, GOLDEN_GOOSE_VERIFIER: verifier };
  const request = () => new Request("https://example.test/api/attest", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(claim)
  });
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 201);
  assert.equal((await response.json()).bundles, 1);
  assert.equal((await worker.fetch(request(), env)).status, 409);
  assert.equal((await recordClaim(db, { ...claim, receiptHash: "e".repeat(64) })).inserted, false);
});

test("all nine mining methods preserve their nonce routes and replay the known Bitcoin genesis proof", async () => {
  assert.deepEqual(nonceSequence("this-side", "forward", 4, 3), [4, 5, 6]);
  assert.deepEqual(nonceSequence("this-side", "backward", 4, 3), [6, 5, 4]);
  assert.deepEqual(nonceSequence("this-side", "inverted", 4, 3), [4294967291, 4294967290, 4294967289]);
  assert.deepEqual(nonceSequence("other-side", "forward", 4, 3), [4294967289, 4294967290, 4294967291]);
  assert.deepEqual(nonceSequence("other-side", "inverted", 4, 3), [6, 5, 4]);
  assert.throws(() => nonceSequence("this-side", "forward", 0xffffffff, 2), /Invalid/);
  assert.throws(() => targetFromBits(0x1d80ffff), /Invalid/);
  assert.throws(() => targetFromBits(0xff00ffff), /Invalid/);
  const full = await miningDemo();
  assert.equal(full.uniqueNonces, 16);
  assert.equal(new Set(full.methods.map(method => method.side + "/" + method.direction)).size, 9);
  assert.equal(full.methods.filter(method => method.independentSerializationCheck).length, 3);
  for (const method of full.methods) {
    const expected = method.nonces.includes(genesisNonce) ? [{ nonce: genesisNonce, hash: genesisHash }] : [];
    assert.deepEqual(method.hits, expected);
  }
  assert.equal((await verifyHeader(genesisHeader)).meetsHeaderTarget, true);
});

test("public Worker serves the complete matrix and does not accept unsigned intake", async () => {
  const base = "https://example.test";
  const response = await worker.fetch(new Request(base + "/api/mining/methods"), {});
  assert.equal((await response.json()).methods.length, 9);
  const html = await (await worker.fetch(new Request(base), {})).text();
  for (const marker of ["this-side-forward", "as-mirror-backward", "other-side-inverted"]) assert.ok(html.includes(marker));
  const closed = await worker.fetch(new Request(base + "/api/attest", { method: "POST" }), {});
  assert.equal(closed.status, 503);
});

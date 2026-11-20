import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { archive, gate, links, records, trace } from "../src/canon.mjs";
import { genesis, verifyGenesis } from "../src/proof.mjs";
import worker from "../src/worker.mjs";

test("every independent project remains distinct and each connection works in both directions", () => {
  assert.equal(new Set(records.map(item => item.id)).size, records.length);
  assert.equal(records.filter(item => item.kind === "Academy pillar").length, 4);
  for (const [a, b, forward, reverse] of links) {
    assert.deepEqual(trace(a, b), [{ from: a, relation: forward, to: b }]);
    assert.deepEqual(trace(b, a), [{ from: b, relation: reverse, to: a }]);
  }
  const path = trace("golden-goose", "tabor-academy");
  const reverse = trace("tabor-academy", "golden-goose");
  assert.ok(path.some(gap => gap.to === "bitcoin-genesis"));
  assert.deepEqual(reverse.map(gap => gap.from), path.toReversed().map(gap => gap.to));
  assert.deepEqual(trace("golden-goose", "golden-goose"), []);
  assert.equal(trace("golden-goose", "unknown"), null);
});

test("the Edubba-to-Buddha interpretation keeps its direction and citations", () => {
  const record = records.find(item => item.id === "edubba-buddha");
  assert.equal(record.title, "Edubba → Buddha");
  assert.deepEqual(record.sources, ["edubba", "buddha"]);
  assert.match(record.authorInterpretation, /Edubba came first/);
  assert.match(record.historicalStatus, /remains unverified/);
});

test("the Bitcoin lesson independently recalculates the known SHA-256d proof", async () => {
  assert.equal((await verifyGenesis()).hash, genesis.hash);
  const different = await verifyGenesis(genesis.header.slice(0, -2) + "00");
  assert.equal(different.matchesGoldenGooseEvidence, false);
  assert.equal(different.meetsTarget, false);
  const response = await worker.fetch(new Request("https://example.test/api/proof"));
  assert.equal((await response.json()).gate, "RETAIN_1");
  assert.equal(gate({ protectsInnocence: true, reproducible: true }), "PURGE_0");
});

test("the Worker exposes archive verification without returning the document", async () => {
  const request = () => new Request("https://example.test/api/archive");
  const base = await worker.fetch(request());
  assert.equal((await base.json()).verifiedInEnvironment, null);
  const response = await worker.fetch(request(), { BLUEPRINT_ARCHIVE: { get: async key => {
    assert.equal(key, "sha256-" + archive.sha256);
    return new Uint8Array(archive.bytes).buffer;
  } } });
  assert.equal(response.status, 503);
  const report = await response.json();
  assert.deepEqual(report, { ...archive, verifiedInEnvironment: false });
});

test("the original Academy schema runs and emits its retain and purge values", t => {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec(readFileSync(new URL("../schema/academy.sql", import.meta.url), "utf8"));
  db.prepare("INSERT INTO library_records VALUES (?,?,?,?,?,?,?,?)").run(
    archive.sha256, "UNASSIGNED", 1, archive.title, "Known result", "Primary source", "exact fixture", "2026-11-19"
  );
  const check = db.prepare("INSERT INTO verification_ledger(record_id, protects_innocence, is_replicable) VALUES (?,?,?)");
  check.run(archive.sha256, 1, 0);
  check.run(archive.sha256, 1, 1);
  assert.deepEqual(db.prepare("SELECT gate_status FROM verification_ledger ORDER BY check_id").all().map(row => row.gate_status), ["PURGE_0", "RETAIN_1"]);
  assert.equal(db.prepare("SELECT verbatim_body FROM library_records").get().verbatim_body, "exact fixture");
});

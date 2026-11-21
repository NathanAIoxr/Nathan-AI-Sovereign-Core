import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { answerKeys, canonicalAnswers, merkleRoot, rowHash, verifyRows } from "../shared/merkle.js";
import { checkDraft, twoItemPair } from "../worker/gatekeeper.js";

const digest = value => createHash("sha256").update(value, "utf8").digest("hex");
const one = Object.fromEntries(answerKeys.map((key, index) => [key, "layer " + index]));
const draft = { tier:"Tier 1: Kids", domain:"Mechanics", item_a_label:"Door", item_b_label:"Gate",
  item_c_label:null, clue_prompt:"Find the joint that turns.", ...one };

test("answer hashing is canonical across field order, Unicode and line endings", async () => {
  const first = { ...one, core_parts:" cafe\u0301\r\n hinge " };
  const second = Object.fromEntries(Object.entries({ ...one, core_parts:"café\n hinge" }).reverse());
  assert.equal(await rowHash(first), await rowHash(second));
  assert.equal(await rowHash(first), digest(canonicalAnswers(second)));
  assert.equal(await rowHash({ ...first, item_a_label:"another name" }), await rowHash(first));
  await assert.rejects(() => rowHash({ ...first, operations:" " }), /empty/);
});

test("the Merkle root is independent of row order and sensitive to answer edits", async () => {
  const hashes = await Promise.all([one,{...one,core_parts:"hinge"},{...one,operations:"turn"}].map(rowHash));
  const sorted = [...hashes].sort();
  const join = (a,b) => digest("TaborAcademy:node:v1:" + a + b);
  assert.equal(await merkleRoot(hashes), join(join(sorted[0],sorted[1]),join(sorted[2],sorted[2])));
  assert.equal(await merkleRoot(hashes), await merkleRoot([...hashes].reverse()));
  assert.notEqual(await merkleRoot(hashes), await merkleRoot(hashes.slice(0,2)));
});

test("verification rejects altered and duplicated answer records", async () => {
  const hash = await rowHash(one);
  assert.equal(await verifyRows([{id:1,...one,row_sha256:hash}]),hash);
  await assert.rejects(() => verifyRows([{id:1,...one,operations:"changed",row_sha256:hash}]),/Invalid/);
  await assert.rejects(() => verifyRows([{id:1,...one,row_sha256:hash},{id:2,...one,row_sha256:hash}]),/duplicate/);
});

test("drafts require exact columns, a valid tier and specific answer text", () => {
  assert.equal(checkDraft(draft).item_c_label,twoItemPair);
  assert.throws(() => checkDraft({...draft, surprise:"extra"}),/exactly/);
  assert.throws(() => checkDraft({...draft, operations:"It might be a lever."}),/clarification/);
  assert.throws(() => checkDraft({...draft, operations:""}),/Invalid/);
  assert.throws(() => checkDraft({...draft, tier:"unknown"}),/tier/);
});

test("verified snapshots detect answer changes and changes to card labels", async () => {
  const { makeSnapshot, checkSnapshot } = await import("../shared/snapshot.js");
  const row = { id:1, ...draft, row_sha256:await rowHash(draft), version:1, state:1, r2_diagram_key:"N/A — No Diagram" };
  const proof = await makeSnapshot([row]);
  assert.deepEqual(await checkSnapshot({rows:[row],proof}),[row]);
  await assert.rejects(() => checkSnapshot({rows:[{...row,item_a_label:"Changed"}],proof}),/mismatch/);
  await assert.rejects(() => checkSnapshot({rows:[{...row,operations:"Changed"}],proof}),/Invalid/);
  await assert.rejects(() => checkSnapshot({rows:[{...row,state:0}],proof}),/Invalid/);
});

test("D1-compatible SQLite state commands are transactional, selective and retry safe", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const { readFileSync } = await import("node:fs");
  const { recordStateCommand, stateCommandKey } = await import("../worker/state.js");
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  db.exec("CREATE TABLE blueprint_lifecycle(lesson_id INTEGER PRIMARY KEY,state TEXT,origin TEXT,verified_at INTEGER); CREATE TABLE blueprint_integrity(lesson_id INTEGER PRIMARY KEY,version INTEGER,state INTEGER); INSERT INTO blueprint_integrity VALUES(1,1,1);");
  db.exec(readFileSync(new URL("../migrations/0008_phase7_write_commands.sql",import.meta.url),"utf8"));
  const adapter = {
    prepare(sql) {
      return { bind(...params) { return () => ({results:db.prepare(sql).all(...params)}); } };
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const results = statements.map(statement => statement());
        db.exec("COMMIT");
        return results;
      } catch(error) { db.exec("ROLLBACK"); throw error; }
    },
  };
  const run = async (version,state) => recordStateCommand(adapter,{id:1,version,state,key:await stateCommandKey(1,version,state)});
  assert.equal(await run(1,-1),null);
  const quarantine = await run(1,0);
  assert.equal(quarantine.version,2);
  assert.equal(db.prepare("SELECT state FROM blueprint_lifecycle").get().state,"quarantined");
  assert.deepEqual(await run(1,0),quarantine);
  assert.equal(await run(1,1),null);
  const [a,b] = await Promise.all([run(2,-1),run(2,1)]);
  assert.equal(Number(Boolean(a))+Number(Boolean(b)),1);
  assert.equal(db.prepare("SELECT count(*) AS n FROM blueprint_integrity_commands").get().n,2);
  assert.equal(db.prepare("SELECT version FROM blueprint_integrity").get().version,3);
  db.close();
});

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

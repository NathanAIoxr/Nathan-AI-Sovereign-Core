import test from "node:test";
import assert from "node:assert/strict";
import { NODES, EDGES, OWNER } from "./registry.mjs";
import { auditGraph } from "./graph-boundary-audit.mjs";
test("existing public graph has valid edges and creator attribution", () => {
  const result = auditGraph(NODES, EDGES, OWNER);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.equal(result.modifiesCanon, false);
  assert.equal(result.publishesPrivateAssets, false);
});
test("dangling and unlabeled edges are rejected", () => {
  assert.equal(auditGraph(NODES, [...EDGES, {from:"missing",to:"santa",relation:"test",assertion:"creative_crosslink"}], OWNER).ok,false);
  assert.equal(auditGraph(NODES, [{from:"santa",to:"reaper",relation:"",assertion:"creative_crosslink"}], OWNER).ok,false);
});
test("creative comparisons cannot silently become scriptural facts", () => {
  assert.equal(auditGraph(NODES, [{from:"isaiah",to:"yin-yang",relation:"equivalent",assertion:"historical_fact"}], OWNER).ok,false);
});
test("creator ownership and literal spelling variants are protected", () => {
  assert.equal(auditGraph(NODES.filter(n=>n.id!=="nathan"), EDGES, OWNER).ok,false);
  assert.equal(auditGraph(NODES.filter(n=>n.name!=="SANTA SUPMALS"), EDGES, OWNER).ok,false);
});
test("private field names are rejected from public export", () => {
  assert.equal(auditGraph([...NODES,{id:"leak",name:"Test",kind:"persona",secret_token:"never"}], EDGES, OWNER).ok,false);
});

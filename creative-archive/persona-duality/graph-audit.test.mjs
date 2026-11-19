import test from "node:test";
import assert from "node:assert/strict";
import {NODES, EDGES} from "./registry.mjs";
import {auditGraph} from "./graph-audit.mjs";
test("current persona graph has valid labeled edges and distinct identities", () => {
  const result = auditGraph(NODES, EDGES);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
  assert.notEqual(NODES.find(n=>n.id==="supmalg"), NODES.find(n=>n.id==="supmals"));
});
test("reject dangling edges, unlabelled interpretations, and identity assertions", () => {
  const broken = [{from:"isaiah",to:"missing",relation:"same_as",assertion:"historical_fact"}];
  const result = auditGraph(NODES,broken);
  assert.equal(result.ok,false);
  assert.ok(result.errors.some(e=>e.startsWith("dangling_edge")));
  assert.ok(result.errors.some(e=>e.startsWith("unlabeled_interpretation")));
  assert.ok(result.errors.some(e=>e.startsWith("identity_or_fact_claim")));
});
test("reject duplicate node IDs and self identity edges",()=>{
 const nodes=[...NODES,NODES[0]];
 const edges=[{from:"nathan",to:"nathan",relation:"created_persona",assertion:"creative_crosslink"}];
 const result=auditGraph(nodes,edges);
 assert.ok(result.errors.some(e=>e.startsWith("duplicate_node")));
 assert.ok(result.errors.some(e=>e.startsWith("self_identity")));
});

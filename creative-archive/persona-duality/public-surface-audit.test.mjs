import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";
import {NODES,EDGES,TASKS,INTEGRATIONS} from "./registry.mjs";
import {auditPublicSurface} from "./public-surface-audit.mjs";
const copy=x=>structuredClone(x);
test("current graph and rendered directory are safe for public text-first display",async()=>{
 const page=await worker.fetch(new Request("https://example.test/"));
 const html=await page.text();
 const audit=auditPublicSurface({html});
 assert.deepEqual(audit.errors,[]);
 assert.equal(audit.nodes,NODES.length);
 assert.equal(audit.edges,EDGES.length);
 assert.match(html,/Tabor Persona Atlas/);
});
test("no unauthorized image or collection surfaces",()=>{
 for(const html of ['<img src="/faces.png">','<iframe src="/embed">','<form action="/save">']){
  assert.equal(auditPublicSurface({html}).ok,false);
 }
});
test("privacy fields and unsafe network references fail closed",()=>{
 const nodes=copy(NODES);nodes[0].secret="do not publish";
 assert.equal(auditPublicSurface({nodes}).ok,false);
 const bad=copy(INTEGRATIONS);bad[0].value="https://example.com/api";
 assert.equal(auditPublicSurface({integrations:bad}).ok,false);
 const mutated=copy(INTEGRATIONS);mutated[0].mode="write";
 assert.equal(auditPublicSurface({integrations:mutated}).ok,false);
});
test("edges, identities and review-only semantics are enforced",()=>{
 const edges=copy(EDGES);edges[0].to="missing";
 assert.equal(auditPublicSurface({edges}).ok,false);
 const nodes=copy(NODES);nodes[0].id=nodes[1].id;
 assert.equal(auditPublicSurface({nodes}).ok,false);
 const tasks=copy(TASKS);tasks[0].dispatch=true;
 assert.equal(auditPublicSurface({tasks}).ok,false);
 const claimed=copy(EDGES);claimed[0].assertion="historical_fact";
 assert.equal(auditPublicSurface({edges:claimed}).ok,false);
});

"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const graph=require("./records.json");
test("FOREVER GUARDIAN source labels and typed links",()=>{
  assert.equal(graph.schema,"nathan-ai.forever-guardian.graph.v1");
  assert.equal(graph.records.length,27);
  assert.equal(graph.relations.length,26);
  const ids=new Set(graph.records.map(r=>r.id));
  assert.equal(ids.size,graph.records.length);
  for(const r of graph.relations){
    assert.ok(ids.has(r.from),"missing from: "+r.from);
    assert.ok(ids.has(r.to),"missing to: "+r.to);
  }
  for(const r of graph.records){
    assert.ok(graph.source_kinds.includes(r.type),"untyped: "+r.id);
    assert.ok(r.status,"missing status: "+r.id);
    if(r.type==="HISTORICAL_PRIMARY_SOURCE")assert.ok(/^https:\/\//.test(r.source),"missing public source: "+r.id);
  }
});
test("verbatim creator expressions and distinct fictional frames",()=>{
  const get=id=>graph.records.find(r=>r.id===id).text;
  assert.equal(get("AUTHOR-GUARDIAN"),'the current "sentinals" sit outside the firmament and watch - they will be disposed of by Nathan AI - the FOREVER GUARDIAN with Nathan Tabor -');
  assert.equal(get("AUTHOR-CONSCIOUNESS"),"consciouness");
  assert.ok(get("AUTHOR-ARITHMETIC-INVERT").includes("destory/burn"));
  assert.ok(get("AUTHOR-ARITHMETIC-BUILD").includes("CREATIVITY"));
  assert.notEqual(get("MODEL-SENTINALS"),get("AUTHOR-WEAPON-XXX"));
});
test("no deployed guardian or self-directed retaliation is claimed",()=>{
  assert.equal(graph.per_node_policy.real_world_access,false);
  assert.equal(graph.per_node_policy.retaliation,false);
  assert.equal(graph.per_node_policy.automated_guilt_finding,false);
  assert.equal(graph.per_node_policy.materialization,"lazy template, no mass allocation");
  assert.equal(graph.data_quality.physical_watchers,"NOT VERIFIED");
});

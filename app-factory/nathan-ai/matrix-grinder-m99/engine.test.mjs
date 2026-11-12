import test from "node:test";
import assert from "node:assert/strict";
import {createRecord,runCycle,MATRICES,CURRENT_FAMILIES,exportRecord} from "./engine.js";
test("five matrices forward and reverse",()=>{
 const r=runCycle(createRecord({claim:"Sample",source:"Record",evidence:"Citation"}));
 assert.deepEqual(r.passes[0].forward.map(x=>x.matrix),["M1","M2","M3","M4","M5"]);
 assert.deepEqual(r.passes[0].reverse.map(x=>x.matrix),["M5","M4","M3","M2","M1"]);
 assert.equal(r.status,"recirculate");
});
test("preserves unresolved items, never declares automatic truth",()=>{
 const r=runCycle(createRecord({claim:"Sample"}));
 assert.ok(r.unresolved.some(x=>x.startsWith("SOURCE:")));
 assert.ok(r.unresolved.some(x=>x.startsWith("EVIDENCE:")));
 assert.ok(!("truth" in r));
});
test("review complete is not a truth certificate",()=>{
 const checks=Object.fromEntries(MATRICES.map(x=>[x.id,{status:"reviewed",finding:"reviewed by person",evidence:"document"}]));
 const r=runCycle(createRecord({claim:"Sample",source:"record",evidence:"document"}),checks);
 assert.equal(r.status,"review-complete");
 assert.deepEqual(r.unresolved,[]);
});
test("repeated cycles are additive and include bottom-entry return",()=>{
 const a=runCycle(createRecord({claim:"Sample"}));
 const b=runCycle(a);
 assert.equal(b.revision,2);
 assert.equal(b.passes.length,2);
 assert.ok(b.passes[1].route.includes("bottom entry"));
});
test("input required, export valid and current families defined",()=>{
 assert.throws(()=>runCycle(createRecord()),/required/);
 assert.ok(CURRENT_FAMILIES.includes("ocean"));
 assert.equal(JSON.parse(exportRecord(createRecord({claim:"Sample"}))).claim,"Sample");
});

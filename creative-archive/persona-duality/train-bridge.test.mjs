import test from "node:test";
import assert from "node:assert/strict";
import {TASKS,INTEGRATIONS} from "./registry.mjs";
import {CONTRACT,buildTrainReviewInput,buildReviewManifest} from "./train-bridge.mjs";
test("Train integration remains source-linked and non-dispatching",()=>{
 assert.equal(CONTRACT.train_source,"app-factory/nathan-ai/operations/train-runtime/worker.mjs");
 assert.equal(CONTRACT.auto_dispatch,false);
 assert.equal(CONTRACT.no_remote_writes,true);
 assert.ok(INTEGRATIONS.some(x=>x.value==="app-factory/nathan-ai/operations/train-runtime"));
});
test("RAM-compatible input retains the exact authored backlog titles and lanes",()=>{
 const payload=buildTrainReviewInput();
 assert.equal(payload.tasks.length,TASKS.length);
 assert.deepEqual(payload.tasks,TASKS.map(t=>({title:t.title,lane:t.lane})));
 assert.ok(payload.tasks.length<=24);
});
test("OCTOPUS lane owner and CONVOY batch limits",()=>{
 const m=buildReviewManifest();
 assert.equal(m.execution_status,"not_executed");
 assert.equal(m.external_calls,0);
 assert.equal(m.external_writes,0);
 assert.equal(m.task_count,TASKS.length);
 assert.ok(m.tasks.every(t=>t.dispatch===false&&t.suggested_agent));
 assert.ok(m.batches.every(b=>b.source_ids.length<=4&&b.dispatch===false));
 assert.deepEqual(m.batches.flatMap(b=>b.source_ids),TASKS.map(t=>t.id));
});
test("selection is stable and rejects unknown/duplicate IDs",()=>{
 const subset=buildReviewManifest(["PD-004","PD-001"]);
 assert.deepEqual(subset.tasks.map(t=>t.source_id),["PD-004","PD-001"]);
 assert.deepEqual(subset.train_request_preview.tasks.map(t=>t.title),[TASKS[3].title,TASKS[0].title]);
 assert.throws(()=>buildTrainReviewInput(["PD-001","PD-001"]),/duplicate/);
 assert.throws(()=>buildTrainReviewInput(["PD-999"]),/unknown/);
 assert.throws(()=>buildTrainReviewInput(Array(25).fill("PD-001")),/invalid selection/);
});

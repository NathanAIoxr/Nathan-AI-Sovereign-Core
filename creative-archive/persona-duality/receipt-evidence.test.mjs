import test from "node:test";
import assert from "node:assert/strict";
import {classifyReceipt} from "./receipt-evidence.mjs";
const now=Date.parse("2026-11-20T00:30:00Z");
const good={service:"tabor-persona-duality",operation:"review_queue_rotation",result:"queued_for_review_not_executed",external_dispatch:false,mutations_to_other_services:0,scheduled_at:"2026-11-20T00:15:00Z",task_ids:["PD-003","PD-004"]};
test("valid receipt is only a review queue, never completed work",()=>assert.deepEqual(classifyReceipt(good,{now}),{status:"review_queued",development_completed:false,scheduled_at:good.scheduled_at,task_ids:good.task_ids}));
test("missing, malformed, or claimed execution receipts fail closed",()=>{
 assert.equal(classifyReceipt(null,{now}).status,"missing");
 assert.equal(classifyReceipt({...good,external_dispatch:true},{now}).status,"invalid");
 assert.equal(classifyReceipt({...good,result:"completed"},{now}).status,"invalid");
 assert.equal(classifyReceipt({...good,task_ids:["PD-999"]},{now}).status,"invalid");
});
test("stale and future timestamps cannot be reported as current",()=>{
 assert.equal(classifyReceipt(good,{now:now+7200000}).status,"stale");
 assert.equal(classifyReceipt({...good,scheduled_at:"2026-11-21T00:15:00Z"},{now}).status,"future_timestamp");
});
test("empty, repeated, or oversized review batches fail closed",()=>{
 for(const task_ids of [[],["PD-003","PD-003"],["PD-001","PD-002","PD-003","PD-004"]])
  assert.equal(classifyReceipt({...good,task_ids},{now}).status,"invalid");
});
test("invalid timestamps and age bounds fail closed",()=>{
 assert.equal(classifyReceipt({...good,scheduled_at:null},{now}).status,"invalid");
 assert.equal(classifyReceipt(good,{now:NaN}).status,"invalid");
 assert.equal(classifyReceipt(good,{now,maxAgeMs:-1}).status,"invalid");
});

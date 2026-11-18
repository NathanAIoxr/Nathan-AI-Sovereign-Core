import assert from "node:assert/strict";
import {writeFile} from "node:fs/promises";
import {api,submit,origin} from "./client.mjs";
const file=process.argv[2];
if(!file)throw Error("Usage: node tools/verify-live.mjs receipt.json");
const marks=[];
const status=await (await api("/status",{auth:false})).json();
const accepted=async(label,work,verify)=>{
  const result=await work();
  verify(result);
  marks.push({label,passed:true,decision:result.receipt?.decision??null,requestId:result.receipt?.requestId??null});
};
const rejected=async(label,work,expected)=>{
  try {await work();throw Error("Expected HTTP "+expected);}
  catch(e) {
    assert.equal(e.status,expected);
    marks.push({label,passed:true,status:expected,decision:e.body.receipt.decision,requestId:e.body.receipt.requestId});
  }
};
await rejected("Missing caller identity",()=>api("/jobs",{auth:false}),401);
const payload={kind:"embedding",texts:["Public operational fixture"],benchmark:true,budgetMicro:100,delaySeconds:90,deadlineSeconds:180,retentionSeconds:60};
const key="ops-"+crypto.randomUUID();
let id;
await accepted("Deferred admission",()=>submit(payload,key),r=>{
  assert.equal(r.receipt.decision,"deferred");
  assert.equal(r.job.state,"queued");
  id=r.job.id;
});
await accepted("Duplicate delivery preserves job identity",()=>submit(payload,key),r=>{
  assert.equal(r.duplicate,true);assert.equal(r.job.id,id);
});
await rejected("Conflicting idempotency key",()=>submit({...payload,texts:["alternate"]},key),409);
await rejected("Budget below requirement",()=>submit({...payload,budgetMicro:1}),402);
await accepted("Owner cancellation",async()=>await (await api("/jobs/"+id,{method:"DELETE"})).json(),r=>{
  assert.equal(r.receipt.decision,"cleared");assert.equal(r.job.state,"cancelled");
});
await rejected("Cancelled output unavailable",()=>api("/jobs/"+id+"/artifact"),409);
await writeFile(file,JSON.stringify({revision:status.revision,endpoint:origin,time:new Date().toISOString(),job:id,checks:marks},null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({file,checks:marks.length,passed:true}));

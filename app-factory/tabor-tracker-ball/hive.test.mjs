import assert from "node:assert/strict";
import test from "node:test";
import {archiveJobs,claimNext,domains,findCartridges,foundation,leaseLength,makeBatch,maxAttempts,newBridge,
  patternFor,pressSymbol,runJob,scoreArcade,settle,voices} from "./public/hive-core.mjs";

test("all original cartridges are indexed and every domain has matching experiences",()=>{
  assert.equal(findCartridges(null,"").length,101);
  assert.equal(domains.length,9);
  assert.equal(foundation.length,12);
  for(const domain of domains) {
    assert.ok(findCartridges(domain,"").length>=domain.modules.length);
    const featured=findCartridges(domain,"").slice(0,domain.modules.length).map(item=>item.id);
    assert.deepEqual(featured.sort((a,b)=>a-b),[...domain.modules].sort((a,b)=>a-b));
  }
  assert.deepEqual(findCartridges(null,"magnetic pole").map(item=>item.id),[63]);
});

test("the three voices earn distinct bridge rewards and arcade feedback is idempotent",()=>{
  for(const voice of Object.keys(voices)) {
    const state=newBridge();
    for(const symbol of patternFor(voice,0)) pressSymbol(state,voice,symbol);
    assert.equal(state.round,1);
    for(const [key,points] of Object.entries(voices[voice].reward)) assert.equal(state[key],points+(key==="charge"?2:0));
    assert.match(scoreArcade(state,100,true),/Shield earned/);
    assert.equal(state.score,100+voices[voice].reward.attack*20+voices[voice].reward.buff*25);
    const snapshot={...state};
    assert.equal(scoreArcade(state,100,true),"");
    assert.deepEqual(state,snapshot);
  }
  const state=newBridge();
  state.shield=1;
  pressSymbol(state,"nathan","◆");
  assert.equal(state.shield,0);
  assert.equal(state.charge,2);
});

test("workers claim unique jobs, reject late receipts and stop retrying at the limit",()=>{
  const jobs=makeBatch(100,"local");
  const a=claimNext(jobs,100,"first").job;
  assert.notEqual(claimNext(jobs,100,"second").job.key,a.key);
  assert.equal(settle(a,"second",101,{ok:true}),false);
  assert.equal(settle(a,"first",100+leaseLength,{ok:true}),false);
  assert.equal(claimNext([a],100+leaseLength,"retry").job.attempts,2);
  assert.equal(settle(a,"retry",101+leaseLength,{ok:false,error:"sample"}),true);
  assert.equal(claimNext([a],102+leaseLength,"early"),null);
  assert.equal(claimNext([a],a.availableAt,"third").job.attempts,maxAttempts);
  assert.equal(settle(a,"third",a.startedAt+1,{ok:false,error:"sample"}),true);
  assert.equal(a.status,"failed");
  assert.equal(claimNext([a],1e6,"extra"),null);
});

test("every local worker check derives a valid result and unknown actions are rejected",()=>{
  for(const job of archiveJobs) assert.ok(runJob(job.kind).count>0);
  assert.equal(runJob("search").index.Q.length,7);
  assert.throws(()=>runJob("unknown"),/Unsupported job/);
});

import test from "node:test";
import assert from "node:assert/strict";
import worker,{runProof,digest} from "./worker.mjs";

test("all 64 slots produce distinct replayable development proofs",async()=>{
  const hashes=new Set();
  for(let slot=1;slot<=64;slot++){
    const row={slot,coordinate:(slot-1).toString(2).padStart(6,"0"),ticker:null,name:null,source_status:"source_unverified"};
    const proof=await runProof(row);
    assert.equal(proof.scope,"development");
    assert.match(proof.hash,/^0[0-9a-f]{63}$/);
    assert.equal(await digest(row,proof.nonce),proof.hash);
    hashes.add(proof.hash);
  }
  assert.equal(hashes.size,64);
});
test("write endpoint requires a configured authorization secret",async()=>{
  const denied=await worker.fetch(new Request("https://localhost/internal/mine?slot=1",{method:"POST"}),{});
  assert.equal(denied.status,404);
});

test("blueprint retains supplied wording and adds a separate technical note",async()=>{
  const raw=await (await worker.fetch(new Request("https://localhost/blueprint.txt"),{})).text();
  assert.match(raw,/complete 64-bit state matrix/);
  assert.match(raw,/Cryptozoologists\tPattern Discovery/);
  const html=await (await worker.fetch(new Request("https://localhost/blueprint"),{})).text();
  assert.match(html,/Previous scene/);
  assert.match(html,/Technical note/);
  assert.match(html,/Six bits encode the 64 position addresses/);
  assert.match(html,/Mining &amp; Cryptography/);
});

test("scheduled audit verifies every receipt and records the successful run",async()=>{
  const results=[];
  for(let slot=1;slot<=64;slot++){
    const row={slot,coordinate:(slot-1).toString(2).padStart(6,"0"),ticker:null,name:null,source_status:"source_unverified"};
    results.push({slot,receipt:JSON.stringify(await runProof(row))});
  }
  let time=null;
  const DB={prepare(sql){return {all:async()=>({results}),bind(_key,at){return {first:async()=>time,run:async()=>{time=at;}};}};}};
  const scheduledTime=Date.parse("2026-11-19T05:17:00Z");
  await worker.scheduled({scheduledTime},{DB});
  const r=await worker.fetch(new Request("https://localhost/api/verification"),{DB});
  assert.equal(r.status,200);
  const audit=await r.json();
  assert.equal(audit.verified,64);
  assert.equal(audit.lastSuccessfulSchedule,new Date(scheduledTime).toISOString());
  results[0].receipt="{}";
  assert.equal((await worker.fetch(new Request("https://localhost/api/verification"),{DB})).status,503);
  await assert.rejects(worker.scheduled({scheduledTime:scheduledTime+3600000},{DB}),/audit failed/);
});

test("compute route keeps controller availability separate from proof results",async()=>{
  const DB={prepare(){return {all:async()=>({results:[]})};}};
  const env={DB,DATABASE_COMPUTE:{fetch:async()=>Response.json({status:"ok",databases:55,placementsPerDatabase:4})}};
  const req=()=>new Request("https://localhost/api/compute");
  const r=await worker.fetch(req(),env);
  assert.equal(r.status,503);
  const result=await r.json();
  assert.equal(result.controller.databases,55);
  assert.equal(result.developmentProofs.verified,0);
  const absent=await (await worker.fetch(req(),{DB})).json();
  assert.equal(absent.controller,null);
});

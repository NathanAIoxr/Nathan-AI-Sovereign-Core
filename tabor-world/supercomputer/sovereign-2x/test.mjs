import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {test} from "node:test";
import {blueprint,canonical,decodeEcc,dot,encodeEcc,fieldCount,gate,route,run,validateFrame} from "./src/core.mjs";
import worker,{audit} from "./src/index.js";
import {dashboard} from "./src/site.mjs";

test("Slayer reason codes and literal arithmetic are deterministic",()=>{
  assert.deepEqual(blueprint.axioms,["1+1=2","1-1=0"]);
  assert.deepEqual(gate([
    {op:"1+1=2",signal_value:1},{op:"1-1=0",signal_value:1},{op:"1+1=2",signal_value:1,payload:"1 +1\t= 10"},
    {op:"1+1=2",signal_value:1,noise:true},{op:"1+1=2",signal_value:1,noise:"false"},
  ]).rejected,["clear","forbidden","marked","malformed"]);
});

test("SECDED corrects all single-bit faults and detects all two-bit faults in a reference word",()=>{
  const value=0xfebca984, word=encodeEcc(value);
  assert.deepEqual(decodeEcc(word),{status:"clean",value});
  for(let i=0n;i<39n;i++) {
    assert.deepEqual(decodeEcc(word^(1n<<i)),{status:"corrected",value});
    for(let j=i+1n;j<39n;j++) assert.deepEqual(decodeEcc(word^(1n<<i)^(1n<<j)),{status:"uncorrectable",value:null});
  }
});

test("the 320 slots route reversibly, including the boundaries of the sparse address space",()=>{
  const a=new Set();
  for(const seed of Array.from({length:320},(_,i)=>i).concat([731999999,732000000,4294967295])) {
    const m=route(seed);
    assert.equal(m.forward.length,34);
    assert.deepEqual(m.reverse,[...m.forward].reverse());
    assert.equal(m.row*32+m.column,m.slot);
    assert.ok(m.logicalId<732000000);
    a.add(m.slot);
  }
  assert.equal(a.size,320);
});

test("a successful 78-field receipt independently replays and detects tampering",async()=>{
  const report=await run({seed:73});
  const row={source:report.frame.Identity.source,created_ms:report.frame.Identity.createdMs,
    receipt:canonical(report.frame),digest:report.digest};
  assert.equal(fieldCount,78);
  assert.equal(Object.keys(report.frame).length,8);
  assert.equal(report.frame.Execution.operations,4096);
  assert.equal(report.frame.Execution.checksum,524311609);
  assert.equal((await audit(row)).verified,true);
  report.frame.Execution.checksum++;
  assert.equal((await audit({...row,receipt:canonical(report.frame)})).verified,false);
  delete report.frame.Noise.gateMode;
  assert.throws(()=>validateFrame(report.frame),/field count/i);
});

test("two bit faults quarantine the requested workload before it executes",async()=>{
  const report=await run({faults:2});
  assert.equal(report.frame.Identity.mode,"quarantined");
  assert.equal(report.frame.Execution.operations,0);
  assert.equal(report.frame.Mirror.sleyerActive,false);
  assert.equal(report.frame.Integrity.uncorrectable,true);
});

test("the Python and JavaScript kernels return the same exact result for edge and default seeds",()=>{
  for(const [seed,terms] of [[73,2048],[0,64],[4294967295,32768]]) {
    const output=execFileSync("python3",["nathan_ai_supercomputer.py","run","--seed",seed,"--terms",terms]);
    const report=JSON.parse(output);
    assert.equal(report.checksum,dot(seed,terms));
    assert.equal(report.verified,true);
    assert.ok(report.elapsed_ns>0);
  }
});

test("dashboard and public API expose the deployed capabilities",async()=>{
  const req=path=>new Request("https://example.test"+path);
  assert.match(dashboard("https://example.test"),/320-slot Global Grid/);
  assert.equal((await worker.fetch(req("/api/compute/probe?terms=1"),{})).status,400);
  const manifest=await (await worker.fetch(req("/api/compute/manifest"),{})).json();
  assert.equal(manifest.frame_fields,78);
  assert.equal(manifest.targets[0].exact_2x,4.3968);
  const legacy=await (await worker.fetch(req("/api/architecture"),{})).json();
  assert.ok(legacy.modules.includes("Operation Octopus"));
});

test("Cron writes a deterministic D1 key so repeated delivery remains idempotent",async()=>{
  const writes=[];
  const env={COMPUTE:{prepare(sql){
    assert.match(sql,/ON CONFLICT DO NOTHING/);
    return {bind(...args){return {async run(){writes.push(args);}}}};
  }}};
  const work=[],ctx={waitUntil(promise){work.push(promise);}};
  const event={scheduledTime:1800000};
  await worker.scheduled(event,env,ctx);
  await worker.scheduled(event,env,ctx);
  await Promise.all(work);
  assert.deepEqual(writes.map(args=>args[0]),["cron-2","cron-2"]);
  assert.equal(writes[0][2],"cloudflare-cron");
});

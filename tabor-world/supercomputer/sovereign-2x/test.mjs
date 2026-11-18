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

test("versioned launch receipt resolves through the public audit route",async()=>{
  const report=await run();
  const env={COMPUTE:{prepare(){
    return {bind(id){
      assert.equal(id,"launch-2.1.0");
      return {async first(){return {run_id:id,receipt:canonical(report.frame),digest:report.digest,
        source:report.frame.Identity.source,created_ms:report.frame.Identity.createdMs};}};
    }};
  }}};
  const response=await worker.fetch(new Request("https://example.test/api/compute/receipts/launch-2.1.0/audit"),env);
  assert.equal(response.status,200);
  assert.equal((await response.json()).verified,true);
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

test("jump-ahead partitions the same vector over every shard count",async()=>{
  const {jump,partition,replay}=await import("./src/mesh-kernel.mjs");
  for(const seed of [0,73,4294967295]) {
    let current=seed;
    for(let i=0;i<300;i++) {
      assert.equal(jump(seed,i),current);
      current=(Math.imul(current,1664525)+1013904223)>>>0;
    }
    for(const count of [1,2,3,4]) {
      const plan=partition(seed,1027,count);
      assert.equal(plan.reduce((total,p)=>total+p.count,0),1027);
      assert.equal(plan.reduce((total,p)=>total+replay(p.start,p.count),0),dot(seed,1027));
    }
  }
});

test("parallel execution seals a portable receipt and refuses substituted or duplicate shards",async()=>{
  const {default:executor}=await import("./src/mesh-executor.mjs");
  const {auditMesh,distributed}=await import("./src/mesh.mjs");
  let running=0,peak=0;
  const binding={async fetch(url,init) {
    running++;
    peak=Math.max(peak,running);
    const response=await executor.fetch(new Request(url,init));
    running--;
    return response;
  }};
  const proof=await distributed(binding);
  assert.equal(peak,4);
  assert.equal(proof.receipt.operations,32768);
  assert.equal(proof.receipt.checksum,4326710662);
  assert.equal((await auditMesh(proof.receipt,proof.sha256)).verified,true);
  const output=execFileSync("python3",["-c","from nathan_ai_supercomputer import verify_cluster; import json,sys; print(json.dumps(verify_cluster(json.load(sys.stdin))))"],{input:JSON.stringify(proof)});
  assert.equal(JSON.parse(output).verified,true);
  const bad={async fetch(url,init) {
    const body=await (await binding.fetch(url,init)).json();
    return Response.json({...body,checksum:body.checksum+1});
  }};
  const replayed={async fetch(url,init) {
    const body=await (await binding.fetch(url,init)).json();
    return Response.json({...body,invocation:"6ffc2047-4041-4bde-a5c6-f6bce81053f1"});
  }};
  await assert.rejects(distributed(bad),/Shard replay failed/);
  await assert.rejects(distributed(replayed),/Shard replay failed/);
  assert.equal((await executor.fetch(new Request("https://example.test/execute",{method:"POST"}))).status,404);
});

test("cluster Cron stores one replayable receipt per bucket",async()=>{
  const {default:executor}=await import("./src/mesh-executor.mjs");
  const {meshCron}=await import("./src/mesh.mjs");
  const rows=new Map();
  const env={MESH_EXECUTOR:{fetch:(url,init)=>executor.fetch(new Request(url,init))},COMPUTE:{prepare(){
    return {bind(id,created_ms,receipt,digest){
      return {async first(){return rows.get(id)??null;},async run(){rows.set(id,{id,created_ms,receipt,digest});}};
    }};
  }}};
  await meshCron(env,900000);
  await meshCron(env,900100);
  assert.equal(rows.size,1);
  const response=await worker.fetch(new Request("https://example.test/api/cluster/receipts/mesh-1/audit"),env);
  assert.equal((await response.json()).verified,true);
});

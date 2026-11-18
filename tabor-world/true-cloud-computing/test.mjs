import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {test} from "node:test";
import worker from "./src/index.js";
import bridge from "../../sovereign-ai-unit/cloud-bridge/bridge.mjs";
import {actAddress,canonical,sha256} from "./src/proofs.mjs";
import {admit,projects} from "./src/compute-gate.mjs";
import {benchmark,checksum,runOne} from "./src/compute-engine.mjs";
import {runNext,runScheduled,submit} from "./src/jobs.mjs";

function environment() {
  const db=new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("schema.sql",import.meta.url),"utf8"));
  for(const name of ["tabor_compute_fleet","tabor_restoration_inventory","tabor_agent_assignments",
    "tabor_coin_federation","tabor_compute_heartbeats","nathan_supercomputer_telemetry_log"]) {
    db.exec("CREATE TABLE "+name+" (id INTEGER PRIMARY KEY);");
  }
  const wrap=(sql,args=[])=>{
    const statement=db.prepare(sql);
    function execute() {
      if(statement.columns().length) return {results:statement.all(...args)};
      return {meta:{changes:statement.run(...args).changes}};
    }
    return {bind(...args){return wrap(sql,args);},execute,
      async all(){return execute();},async run(){return execute();},async first(){return statement.get(...args)??null;}};
  };
  return {sqlite:db,DB:{prepare:wrap,async batch(statements){
    db.exec("BEGIN");
    try {
      const result=statements.map(x=>x.execute());
      db.exec("COMMIT");
      return result;
    } catch(error){db.exec("ROLLBACK");throw error;}
  }}};
}
const req=(path,init)=>new Request("https://example.test"+path,init);

test("ACT address is stable under whitespace and Unicode compatibility normalization",async()=>{
  const a=await actAddress("Pie Pi Phi");
  assert.deepEqual(await actAddress(" Ｐie   Pi  Phi "),a);
  assert.notEqual((await actAddress("Pie Pi Phi 2")).address,a.address);
  assert.equal(a.address,"act-v1-421fcd0006e01483a9a5d540");
  assert.ok(a.pie_sector>=0&&a.pie_sector<12);
  assert.equal(a.phi,(1+Math.sqrt(5))/2);
  await assert.rejects(()=>actAddress(""),RangeError);
});

test("Cron queues three fixed jobs exactly once and persists replayable digests",async()=>{
  const env=environment();
  const timestamp=Date.parse("2026-11-18T00:00:00Z");
  await runScheduled(env.DB,timestamp);
  await runScheduled(env.DB,timestamp);
  const list=await (await worker.fetch(req("/api/jobs"),env)).json();
  assert.equal(list.jobs.length,3);
  assert.ok(list.jobs.every(job=>job.status==="completed"&&job.sha256));
  const id=list.jobs.find(job=>job.kind==="genesis-selftest").id;
  const url="/api/jobs/"+encodeURIComponent(id);
  const body=await (await worker.fetch(req(url),env)).json();
  assert.equal(body.receipt.result.pass,true);
  assert.equal((await (await worker.fetch(req(url+"/audit"),env)).json()).verified,true);
  env.sqlite.prepare("UPDATE true_cloud_receipts SET body='{}' WHERE job_id=?").run(id);
  assert.equal((await (await worker.fetch(req(url+"/audit"),env)).json()).verified,false);
});

test("expired jobs are recovered and concurrent runners complete a job once",async()=>{
  const env=environment();
  await submit(env.DB,"recovery","telemetry-check");
  env.sqlite.prepare("UPDATE true_cloud_jobs SET status='running' WHERE id=?").run("recovery");
  env.sqlite.prepare("INSERT INTO true_cloud_job_claims VALUES(?,?,?,?)").run("recovery","expired",Date.now()-1,1);
  const r=await Promise.all([runNext(env.DB),runNext(env.DB)]);
  assert.equal(r.find(x=>x.id==="recovery").status,"completed");
  assert.equal(r.filter(x=>x.state==="idle").length,1);
  const proof=env.sqlite.prepare("SELECT body,sha256 FROM true_cloud_receipts WHERE job_id=?").get("recovery");
  assert.equal(await sha256(proof.body),proof.sha256);
  assert.equal(JSON.parse(proof.body).attempt,2);
});

test("job submission requires owner authentication and binds an idempotency key",async()=>{
  const env={...environment(),TRUE_CLOUD_TOKEN:"example-key"};
  const call=(kind,token)=>worker.fetch(req("/api/jobs",{method:"POST",
    headers:{"idempotency-key":"one",authorization:token? "Bearer "+token:""},
    body:JSON.stringify({kind})}),env);
  assert.equal((await call("telemetry-check")).status,401);
  const a=await (await call("telemetry-check","example-key")).json();
  assert.equal((await (await call("telemetry-check","example-key")).json()).id,a.id);
  assert.equal((await call("inventory-audit","example-key")).status,409);
  assert.equal((await call("arbitrary-command","example-key")).status,400);
});

test("federation fetches only its fixed health endpoints and publishes only reachability",async()=>{
  const services={
    WORLD_HUB:{async fetch(url){assert.equal(url,"https://hub.internal/health");return Response.json({internal:"not forwarded"});}},
    SOVEREIGN_COMPUTE:{async fetch(){return new Response(null,{status:503});}},
  };
  const response=await worker.fetch(req("/api/federation"),services);
  const body=await response.json();
  assert.deepEqual(body.services.map(x=>x.reachable),[true,false,false]);
  assert.equal(JSON.stringify(body).includes("not forwarded"),false);
});

test("the stack supplies the four elements, four layers, and both deployment patterns",async()=>{
  const index=await worker.fetch(req("/"),{});
  assert.match(await index.text(),/href="\/technology"/);
  const page=await worker.fetch(req("/technology"),{});
  assert.match(await page.text(),/Gate and half-adder truth table/);
  const response=await (await worker.fetch(req("/api/technology"),{})).json();
  assert.equal(response.elements.length,4);
  assert.deepEqual(response.layers.map(layer=>layer.id),["io","compute","memory","control"]);
  assert.equal(response.topologies.length,2);
});

test("the live trace computes each truth-table row and checks D1 without writing",async()=>{
  const patterns=[[0,0,0,0,0],[0,1,0,1,1],[1,0,0,1,1],[1,1,1,1,0]];
  let reads=0;
  const env={DB:{prepare(sql){
    assert.equal(sql,"SELECT 1 AS ready");
    reads++;
    return {async first(){return {ready:1};}};
  }}};
  for(const [a,b,and,or,xor] of patterns) {
    const request=req("/api/technology/trace?a="+a+"&b="+b);
    Object.defineProperty(request,"cf",{value:{colo:"DFW"}});
    const response=await worker.fetch(request,env);
    assert.equal(response.status,200);
    const body=await response.json();
    assert.deepEqual(body.gates,{a,b,and,or,xor,not_a:1-a,not_b:1-b,sum:xor,carry:and});
    assert.equal(body.layers.memory.read_verified,true);
    assert.equal(body.layers.control.ingress_colo,"DFW");
  }
  for(const query of ["a=1&b=2","a=1","a=1&a=0&b=1"]) {
    const response=await worker.fetch(req("/api/technology/trace?"+query),env);
    assert.equal(response.status,400);
  }
  assert.equal(reads,4);
});

function backend(responseChange=(frame)=>frame,delay=null) {
  return {async fetch(url){
    if(delay)await delay;
    const query=new URL(url).searchParams, seed=Number(query.get("seed")),terms=Number(query.get("terms"));
    const kernel="fp64-dot-lcg32-v1",value=checksum(seed,terms);
    const frame={Identity:{kernel},Execution:{seed,terms,operations:2*terms,checksum:value,checksumScale:1048576,
      timed:false,elapsedNs:0},Integrity:{eccStatus:"clean"},
      Mirror:{resultHash:await sha256(canonical({kernel,seed,terms,checksum:value}))}};
    const body=responseChange(frame);
    return Response.json({frame:body,digest:await sha256(canonical(body))});
  }};
}
const pie="pie-pi-phi",superc="supercalifragilisticexpialidocious";
const tokens={[pie]:"test-pie-secret-example-001",[superc]:"test-super-secret-example-002"};
const owner=(path,namespace,options={})=>req("/api/compute/"+path,{...options,headers:{
  authorization:"Bearer "+tokens[namespace],"x-tenant":namespace,...options.headers}});
const submission=(namespace,key,seed=73,terms=256)=>owner("jobs",namespace,{method:"POST",
  headers:{"idempotency-key":key},body:JSON.stringify({seed,terms})});
function fabricEnv(change) {
  return {...environment(),SOVEREIGN_COMPUTE:backend(change),FABRIC_PIE_PI_PHI_TOKEN:tokens[pie],
    FABRIC_SUPERCALIFRAGILISTICEXPIALIDOCIOUS_TOKEN:tokens[superc]};
}

test("namespace jobs enforce access, conflicts, and the same key in separate projects",async()=>{
  const env=fabricEnv();
  assert.equal((await worker.fetch(req("/api/compute/jobs"),env)).status,401);
  const mismatch=owner("jobs",pie,{headers:{authorization:"Bearer "+tokens[superc]}});
  assert.equal((await worker.fetch(mismatch,env)).status,401);
  const a=await worker.fetch(submission(pie,"repeat"),env);
  assert.equal(a.status,202);
  const job=await a.json();
  const same=await worker.fetch(submission(pie,"repeat"),env);
  assert.equal((await same.json()).id,job.id);
  assert.equal((await worker.fetch(submission(pie,"repeat",84),env)).status,409);
  const b=await (await worker.fetch(submission(superc,"repeat"),env)).json();
  assert.notEqual(job.id,b.id);
  assert.equal((await worker.fetch(owner("jobs/"+job.id,superc),env)).status,404);
  assert.equal((await worker.fetch(owner("jobs/"+job.id+"/cancel",superc,{method:"POST"}),env)).status,404);
});

test("daily D1 quota is atomic for simultaneous admissions at its boundary",async()=>{
  const env=fabricEnv(),now=Date.now(),days=new Date(now).toISOString().slice(0,10);
  env.sqlite.prepare(`INSERT INTO true_cloud_compute_jobs
    (id,namespace,retry_key,request_sha,seed,terms,operation_budget,budget_day,state,created_ms,updated_ms,next_ms)
    VALUES('fixture',?,'prior','fixture',0,64,?,?,'completed',?,?,?)`)
    .run(pie,projects[pie].daily_operations-128,days,now,now,now);
  const two=await Promise.all([admit(env.DB,pie,{key:"left",seed:73,terms:64},now),admit(env.DB,pie,{key:"right",seed:73,terms:64},now)]);
  assert.deepEqual(two.map(x=>x.status).sort(),[202,429]);
  assert.equal((await admit(env.DB,superc,{key:"left",seed:73,terms:64},now)).status,202);
});

test("Box 1 replays a backend checksum and seals one verifiable receipt",async()=>{
  const env=fabricEnv(),wait=[];
  const queued=await worker.fetch(submission(pie,"run"),env,{waitUntil(promise){wait.push(promise);}});
  const {id}=await queued.json();
  await Promise.all(wait);
  const verified=await (await worker.fetch(owner("jobs/"+id+"/receipt",pie),env)).json();
  assert.equal(verified.verified,true);
  assert.equal(verified.receipt.result.checksum,69937094);
  assert.equal(verified.receipt.result.measured_flops,null);
  const status=await (await worker.fetch(owner("jobs/"+id,pie),env)).json();
  assert.deepEqual(status.events.map(x=>x.state),["queued","running","verified","completed"]);
  assert.equal(await runOne(env,id),null);
});

test("cancelled leases cannot seal pending results",async()=>{
  const env=fabricEnv();
  let unblock,begin;
  const delay=new Promise(resolve=>{unblock=resolve;});
  const started=new Promise(resolve=>{begin=resolve;});
  env.SOVEREIGN_COMPUTE={fetch(url){begin();return backend(undefined,delay).fetch(url);}};
  const response=await worker.fetch(submission(pie,"cancel"),env);
  const {id}=await response.json();
  const running=runOne(env,id);
  await started;
  const cancellation=await worker.fetch(owner("jobs/"+id+"/cancel",pie,{method:"POST"}),env);
  assert.equal((await cancellation.json()).state,"cancelled");
  unblock();
  assert.equal(await running,null);
  assert.equal((await worker.fetch(owner("jobs/"+id+"/receipt",pie),env)).status,404);
});

test("a backend receipt cannot substitute a different checksum and scheduled benchmarks deduplicate",async()=>{
  const env=fabricEnv(frame=>({...frame,Execution:{...frame.Execution,checksum:frame.Execution.checksum+1}}));
  const {id}=await (await worker.fetch(submission(pie,"tamper"),env)).json();
  assert.equal((await runOne(env,id)).state,"failed");
  assert.equal((await worker.fetch(owner("jobs/"+id+"/receipt",pie),env)).status,404);
  const clean=fabricEnv(),time=Date.parse("2026-11-18T00:00:00Z");
  await benchmark(clean,time);
  await benchmark(clean,time);
  const result=await (await worker.fetch(req("/api/compute/benchmarks"),clean)).json();
  assert.equal(result.receipts.length,1);
  assert.equal(result.receipts[0].verified,true);
  assert.equal(result.receipts[0].receipt.result.checksum,524311609);
});


test("the deployment bridge preserves the Sovereign job platform and serves the FP64 path",async()=>{
  const env={COMPUTE_PLATFORM:{async fetch(url){
    assert.ok(url.endsWith("/platform/status"));
    return Response.json({status:"ready"});
  }}};
  assert.equal((await (await bridge.fetch(req("/compute-platform/status"),env)).json()).status,"ready");
  const manifest=await (await bridge.fetch(req("/api/compute/manifest"),env)).json();
  assert.equal(manifest.workload.kind,"fp64-dot-lcg32-v1");
  assert.equal((await bridge.fetch(req("/technology"),env)).status,200);
});

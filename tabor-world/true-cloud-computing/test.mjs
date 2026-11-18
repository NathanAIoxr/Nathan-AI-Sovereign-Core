import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import {test} from "node:test";
import worker from "./src/index.js";
import {actAddress,sha256} from "./src/proofs.mjs";
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

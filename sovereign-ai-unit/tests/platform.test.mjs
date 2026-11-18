import {test} from "node:test";
import assert from "node:assert/strict";
import gate from "../box-0-zero/worker.mjs";
import bridge from "../cloud-bridge/bridge.mjs";
import box1 from "../box-1-one/worker.mjs";
import { validateJob,sha256, MODEL } from "../protocol.mjs";
import { admit,claim,cancel,reap,commitSlice,failSlice,drain,LEASE_MS } from "../box-1-one/queue.mjs";
import { backends,execute } from "../box-1-one/backends.mjs";
import { database,vectors,validAi,person,body,environment,request } from "./fixture.mjs";

test("legacy public /health and /compute contract stays present",async()=>{
  const x=await environment();
  const health=await gate.fetch(request("https://gate/health"),x.publicEnv);
  assert.equal((await health.json()).authentication_configured,false);
  const response=await gate.fetch(request("https://gate/compute",{method:"POST"}),x.publicEnv);
  assert.deepEqual(await response.json(),{box:0,equation:"1 - 1 = 0",error:"Authentication is not configured."});
  assert.equal((await box1.fetch(request("https://public.example/platform/status"),x.privateEnv)).status,404);
});

test("auth, quota, idempotent delivery, artifact hash and tenant isolation",async()=>{
  const x=await environment();
  const send=(path,method="GET",data,token=x.token,project=x.project,key="admission")=>gate.fetch(request("https://gate/platform"+path,{
    method,headers:{authorization:"Bearer "+token,"x-sovereign-project":project,"content-type":"application/json","idempotency-key":key,
      "x-platform-daily-micro":"1000000000"},body:data&&JSON.stringify(data)
  }),x.publicEnv);
  assert.equal((await send("/jobs","GET",null,"bad-token")).status,401);
  assert.equal((await send("/jobs","POST",{...body,budgetMicro:10})).status,402);
  const a=await send("/jobs","POST",body);
  assert.equal(a.status,202);
  const job=(await a.json()).job;
  assert.equal((await send("/jobs","POST",body)).status,200);
  assert.equal((await send("/jobs","POST",{...body,texts:["other"]})).status,409);
  assert.equal((await send("/jobs/"+job.id,"GET",null,x.token2,x.other)).status,404);
  await drain(x.privateEnv);
  const result=await send("/jobs/"+job.id+"/artifact");
  assert.equal(result.status,200);
  const raw=await result.text();
  assert.equal(JSON.parse(raw).length,5);
  assert.equal(result.headers.get("x-artifact-sha256"),await sha256(raw));
  assert.deepEqual((await (await send("/jobs/"+job.id)).json()).job.phases,["Fe","Fi","Fo","Fum"]);
});

test("atomically caps reservations across admissions and enforces budget",async()=>{
  const db=database(),env={AI:validAi},now=Date.now(),job=validateJob(body);
  const quota={...person,dailyMicro:180,maxActive:1};
  const x=await Promise.allSettled([
    admit(db,quota,"same",job,env,now),admit(db,quota,"same",job,env,now),
    admit(db,quota,"different",job,env,now)
  ]);
  assert.equal(x.filter(r=>r.status==="fulfilled").length,2);
  assert.equal(x.filter(r=>r.value?.duplicate).length,1);
  assert.equal(x.find(r=>r.status==="rejected").reason.status,429);
});

test("retains checkpoint across worker loss, rejects the stale lease, and expires payloads",async()=>{
  const db=database(),env={AI:validAi,BOX_1_LEDGER:db},now=Date.now();
  const job=validateJob({...body,retentionSeconds:60});
  const {row}=await admit(db,person,"recover",job,env,now);
  const first=await claim(db,env,now+1);
  await commitSlice(db,first,{data:vectors(["a","b","c","d"]),completed:4,ms:7,quality:"shape"}, "r1",now+11);
  const lost=await claim(db,env,now+12);
  assert.equal(lost.row.progress,4);
  await reap(db,now+LEASE_MS+13);
  const resumed=await claim(db,env,now+LEASE_MS+14);
  assert.equal(resumed.row.progress,4);
  assert.notEqual(lost.row.lease_token,resumed.row.lease_token);
  const slice={data:vectors(["e"]),completed:1,ms:3,quality:"shape"};
  assert.equal(await commitSlice(db,lost,slice,"r1",now+LEASE_MS+15),null);
  const final=await commitSlice(db,resumed,slice,"r1",now+LEASE_MS+16);
  assert.equal(final.state,"succeeded");
  assert.equal(JSON.parse(final.output).length,5);
  assert.equal(final.spent_micro,72);
  await reap(db,final.finished+60001);
  const retained=db.sqlite.prepare("SELECT * FROM platform_jobs WHERE id=?").get(row.id);
  assert.equal(retained.state,"cleared");
  assert.equal(retained.output,null);
  assert.equal(retained.payload,null);
  assert.equal(retained.output_sha256,final.output_sha256);
});

test("fences cancelled in-flight work and holds its slot until attempt finishes or lease expires",async()=>{
  const db=database(),env={AI:validAi},now=Date.now(),job=validateJob(body);
  for(const key of ["a","b","c"]) await admit(db,person,key,job,env,now);
  const a=await claim(db,env,now+1);
  assert.ok(await claim(db,env,now+2));
  await cancel(db,person.project,a.row.id,now+3);
  assert.equal(await claim(db,env,now+4),null);
  assert.equal(await commitSlice(db,a,{data:vectors(["a"]),completed:1,ms:1,quality:"shape"},"r1",now+5),null);
  await reap(db,now+LEASE_MS+10);
  assert.ok(await claim(db,env,now+LEASE_MS+11));
});

test("routes authorized GPU adapters around full and unavailable pools",async()=>{
  const db=database(),now=Date.now();
  const pool=(id,binding,priceMicro)=>({id,binding,ownership:"owned",region:"us-east",deviceCount:1,slots:1,memoryMiB:24000,
    deviceType:"Test GPU",precision:"FP16",interconnectGbps:25,priceMicro,kinds:["embedding"],models:[MODEL],recipes:[]});
  const target={fetch:async (_,{body})=>Response.json({vectors:vectors(JSON.parse(body).texts)})};
  const env={GPU_BACKENDS_JSON:JSON.stringify([pool("one","GPU_POOL_A",2),pool("two","GPU_POOL_B",3)]),GPU_POOL_A:target,GPU_POOL_B:target};
  assert.equal(backends(env).filter(x=>x.runtime==="authorized-service").length,2);
  const j=validateJob({kind:"embedding",texts:["x"],budgetMicro:100,region:"us-east"});
  await admit(db,person,"first",j,env,now);
  await admit(db,person,"second",j,env,now);
  const a=await claim(db,env,now+1), b=await claim(db,env,now+2);
  assert.deepEqual([a.pool.id,b.pool.id],["one","two"]);
  await failSlice(db,a.row,now+3);
  await commitSlice(db,b,await execute(b.pool,b.job,b.row,env),"r1",now+4);
  const fallback=await claim(db,env,now+1004);
  assert.equal(fallback.pool.id,"two");
});

test("True Cloud bridge forwards identity and persists legacy route binding",async()=>{
  const x=await environment();
  const env={COMPUTE_PLATFORM:{fetch:(url,opts)=>gate.fetch(request(url,opts),x.publicEnv)}};
  const publicStatus=await bridge.fetch(request("https://true-cloud/compute-platform/status"),env);
  assert.equal(publicStatus.status,200);
  const response=await bridge.fetch(request("https://true-cloud/compute-platform/jobs",{
    method:"POST",headers:{authorization:"Bearer "+x.token,"x-sovereign-project":x.project,"content-type":"application/json","idempotency-key":"bridge"},
    body:JSON.stringify(body)
  }),env);
  assert.equal((await response.json()).job.project,x.project);
});

test("project-scoped storage and attested training restart from a finished checkpoint",async()=>{
  const storage=new Map();
  const {upload}=await import("../box-1-one/objects.mjs");
  const {relay}=await import("../gpu/relay.mjs");
  const env={BOX_1_LEDGER:database(),ARTIFACTS:{
    put:async(k,v)=>storage.set(k,v),get:async k=>storage.has(k)?{size:storage.get(k).length,arrayBuffer:async()=>storage.get(k)}:null
  }};
  const hash="b".repeat(64),evalHash="e".repeat(64);
  const scope=(id,key)=>({id,binding:key,ownership:"cluster",region:"us-east",deviceCount:4,slots:1,memoryMiB:24000,
    deviceType:"Test GPU",precision:"BF16",interconnectGbps:200,priceMicro:10,kinds:["training"],models:[],recipes:["supervised"]});
  let calls=0;
  env.GPU_POOL_A={fetch:async (url,opts)=>relay(request(url,opts),{POOL_ENDPOINT:"https://owned.example/v1/slice",POOL_BEARER:"test-secret"},
    async (target,forward)=>{
      assert.equal(target,"https://owned.example/v1/slice");
      assert.match(forward.headers["idempotency-key"],/-(0|1)$/);
      const incoming=request(target,forward);
      const parsed=calls===0?await incoming.formData():null;
      const work=parsed?JSON.parse(parsed.get("job")):await incoming.json();
      if(work.offset===0) assert.equal(await parsed.get("dataset").text(),"training fixture");
      else assert.equal(work.checkpoint.checkpointSha256,hash);
      calls++;
      return Response.json({checkpointSha256:hash,artifactSha256:hash,heldOutQuality:work.offset===0?.65:.90,evaluationSha256:evalHash});
    })};
  env.GPU_BACKENDS_JSON=JSON.stringify([scope("training-east","GPU_POOL_A")]);
  const object=await upload(env,request("https://box-one",{method:"POST",body:"training fixture"}),person.project);
  const job=validateJob({kind:"training",objectId:object.id,objectSha256:object.sha256,budgetMicro:300,deadlineSeconds:600,
    targetQuality:.85,recipe:"supervised",modelSha256:hash,evaluationSha256:evalHash,stages:2});
  await assert.rejects(admit(env.BOX_1_LEDGER,{...person,project:"other"},"object-grab",job,env),{status:404});
  const accepted=await admit(env.BOX_1_LEDGER,person,"train",job,env);
  await drain(env,1);
  assert.equal(env.BOX_1_LEDGER.sqlite.prepare("SELECT progress FROM platform_jobs WHERE id=?").get(accepted.row.id).progress,1);
  await drain(env,1);
  const final=env.BOX_1_LEDGER.sqlite.prepare("SELECT state,output FROM platform_jobs WHERE id=?").get(accepted.row.id);
  assert.equal(final.state,"succeeded");
  assert.equal(JSON.parse(final.output).heldOutQuality,.90);
  assert.equal(calls,2);
});

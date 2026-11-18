import {canonical,sha} from "./core.mjs";
import {kernel,maxShards,maxTerms,partition,replay} from "./mesh-kernel.mjs";

const interval=900000;
const defaultSeed=73;
const defaultTerms=maxTerms;
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const targets=[
  {binding:"TRUE_CLOUD",name:"True Cloud Computing",url:"https://tabor-true-cloud-computing.nathantaboract.workers.dev/",path:"/health"},
  {binding:"SOVEREIGN_UNIT",name:"Sovereign AI Unit",url:"https://sovereign-ai-unit.nathantaboract.workers.dev/platform",path:"/health"},
  {binding:"WORLD_HUB",name:"Tabor World Hub",url:"https://tabor-world-hub.nathantaboract.workers.dev/",path:"/health"},
  {binding:"FLEET",name:"Physical Compute Fleet Registry",path:"/health"},
];

const verifyPart=(actual,expected,runId)=>actual?.run_id===runId&&actual.kernel===kernel&&
  actual.executor==="nathan-sovereign-fp64-executor"&&typeof actual.invocation==="string"&&uuid.test(actual.invocation)&&
  Object.keys(expected).every(key=>actual[key]===expected[key])&&actual.operations===2*expected.count&&
  actual.checksum===replay(expected.start,expected.count);

export async function distributed(executor,{seed=defaultSeed,terms=defaultTerms,shards=maxShards,source="public-probe",scheduled_ms=null}={}) {
  const plan=partition(seed,terms,shards);
  if(!executor)throw Error("Executor binding unavailable.");
  const runId=crypto.randomUUID(),started=Date.now();
  const result=await Promise.all(plan.map(async part=>{
    const response=await executor.fetch("https://executor.internal/execute",{method:"POST",
      headers:{"content-type":"application/json"},body:JSON.stringify({...part,run_id:runId}),
      signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw Error("Shard execution failed.");
    return await response.json();
  }));
  if(new Set(result.map(item=>item?.invocation)).size!==plan.length||
     !result.every((item,i)=>verifyPart(item,plan[i],runId)))throw Error("Shard replay failed.");
  const checksum=result.reduce((sum,item)=>sum+item.checksum,0);
  if(checksum!==replay(seed,terms))throw Error("Reduction replay failed.");
  const duration=Date.now()-started;
  const receipt={schema:"nathan-fp64-mesh-v1",run_id:runId,created_ms:started,source,scheduled_ms,kernel,seed,terms,
    operations:2*terms,checksum,checksum_scale:1048576,shard_count:shards,
    elapsed_ms:duration>0?duration:null,timing_scope:"coordinator fan-out, execution, and verification",
    shards:result};
  return {receipt,sha256:await sha(canonical(receipt)),verified:true};
}

export async function auditMesh(receipt,digest) {
  const checks={record_hash:await sha(canonical(receipt))===digest,shard_replay:false,combined_replay:false};
  try{
    const plan=partition(receipt.seed,receipt.terms,receipt.shard_count);
    checks.shard_replay=receipt.schema==="nathan-fp64-mesh-v1"&&receipt.kernel===kernel&&uuid.test(receipt.run_id)&&
      Array.isArray(receipt.shards)&&receipt.shards.length===plan.length&&
      new Set(receipt.shards.map(item=>item?.invocation)).size===plan.length&&
      receipt.shards.every((item,i)=>verifyPart(item,plan[i],receipt.run_id));
    checks.combined_replay=checks.shard_replay&&receipt.operations===receipt.terms*2&&receipt.checksum_scale===1048576&&
      receipt.shards.reduce((sum,part)=>sum+part.checksum,0)===receipt.checksum&&receipt.checksum===replay(receipt.seed,receipt.terms);
  }catch {}
  return {verified:Object.values(checks).every(Boolean),checks};
}

export async function meshCron(env,time) {
  const key="mesh-"+Math.floor(time/interval);
  const prior=await env.COMPUTE.prepare("SELECT id FROM sovereign_mesh_runs WHERE id=?").bind(key).first();
  if(prior)return;
  const {receipt,sha256}=await distributed(env.MESH_EXECUTOR,{source:"cloudflare-cron",scheduled_ms:time});
  await env.COMPUTE.prepare("INSERT OR IGNORE INTO sovereign_mesh_runs(id,created_ms,receipt,digest) VALUES(?,?,?,?)")
    .bind(key,receipt.created_ms,canonical(receipt),sha256).run();
}

export async function services(env) {
  const checks=targets.map(async ({binding,name,url,path})=>{
    let status=null;
    try{
      const response=await env[binding]?.fetch("https://attached.internal"+path,{signal:AbortSignal.timeout(3500)});
      status=response?.status??null;
      if(response?.body)await response.body.cancel();
    }catch {}
    return {name,url,status,reachable:status>=200&&status<300};
  });
  const count=env.REGISTRY.prepare("SELECT COUNT(*) AS total FROM tabor_compute_fleet").first().catch(()=>null);
  const [reports,registered]=await Promise.all([Promise.all(checks),count]);
  return {services:reports,registered_physical_nodes:registered?.total??null,
    executor:{name:"Nathan FP64 Executor",binding:"MESH_EXECUTOR",private:true,limit_per_job:maxShards},
    logical_grid:{slots:320,addresses:732000000},receipt_interval_minutes:15};
}

export async function meshApi(request,env,url,json) {
  if(request.method!=="GET")return json({error:"GET required"},405);
  const path=url.pathname.slice("/api/cluster/".length);
  if(path==="services")return json(await services(env));
  if(path==="run"){
    const uint=(key,fallback)=>{
      const values=url.searchParams.getAll(key);
      if(!values.length)return fallback;
      if(values.length!==1||!/^\d{1,10}$/.test(values[0]))throw RangeError("Use a single unsigned integer for "+key+".");
      return Number(values[0]);
    };
    return json(await distributed(env.MESH_EXECUTOR,{seed:uint("seed",defaultSeed),terms:uint("terms",defaultTerms),shards:uint("shards",maxShards)}));
  }
  if(path==="receipts"){
    const {results}=await env.COMPUTE.prepare("SELECT id,created_ms,receipt,digest FROM sovereign_mesh_runs ORDER BY created_ms DESC LIMIT 16").all();
    return json({receipts:results.map(row=>{
      const {operations,checksum,shard_count,elapsed_ms,source}=JSON.parse(row.receipt);
      return {id:row.id,created_ms:row.created_ms,sha256:row.digest,operations,checksum,shard_count,elapsed_ms,source};
    })});
  }
  const match=/^receipts\/(mesh-\d+|launch-2\.2\.0)(\/audit)?$/.exec(path);
  if(!match)return json({error:"Unknown compute cluster endpoint"},404);
  const row=await env.COMPUTE.prepare("SELECT receipt,digest FROM sovereign_mesh_runs WHERE id=?").bind(match[1]).first();
  if(!row)return json({error:"Receipt not found"},404);
  const receipt=JSON.parse(row.receipt);
  return json(match[2]?await auditMesh(receipt,row.digest):{id:match[1],receipt,sha256:row.digest});
}

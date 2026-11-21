// Sovereign Box 1: durable D1 jobs, Queues dispatch and Workers AI inference.
const out=(x,s=200)=>Response.json(x,{status:s,headers:{"cache-control":"no-store"}});
const sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
const stamp=()=>Date.now();
const validProject=x=>typeof x==="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(x);
const record=async(env,id,stage,action,detail)=>env.LEDGER.prepare("INSERT INTO nathan_job_events(job_id,stage,action,at,detail) VALUES(?,?,?,?,?)").bind(id,stage,action,stamp(),JSON.stringify(detail)).run();
async function processJob(env,id){
 const job=await env.LEDGER.prepare("SELECT * FROM nathan_jobs WHERE id=?").bind(id).first();
 if(!job||job.status==="cancelled"||job.status==="completed")return;
 // Lease claim prevents duplicate deliveries from executing concurrently.
 const now=stamp(), lease=now+120000;
 const claimed=await env.LEDGER.prepare("UPDATE nathan_jobs SET status='reserved',stage='Fi',attempt=attempt+1,lease_until=?,updated_at=? WHERE id=? AND status IN ('queued','reserved') AND (lease_until IS NULL OR lease_until<?) AND attempt<3").bind(lease,now,id,now).run();
 if(!claimed.meta?.changes)return;
 let reserved=false;
 try{
  const backend=await env.LEDGER.prepare("SELECT * FROM nathan_backends WHERE id='workers-ai-default' AND enabled=1").first();
  if(!backend||!env.AI)throw new Error("backend_unavailable");
  const acquired=await env.LEDGER.prepare("UPDATE nathan_backends SET reserved=reserved+1,updated_at=? WHERE id=? AND enabled=1 AND reserved<max_concurrent").bind(stamp(),backend.id).run();
  if(!acquired.meta?.changes)throw new Error("capacity_full");
  reserved=true;
  await env.LEDGER.prepare("UPDATE nathan_jobs SET status='running',stage='Fo',backend_id=?,updated_at=? WHERE id=? AND status='reserved'").bind(backend.id,stamp(),id).run();
  await record(env,id,"Fi","capacity_reserved",{backend:backend.id});
  const start=stamp();
  const ai=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{messages:[{role:"user",content:job.input_text}],max_tokens:512});
  const answer=String(ai?.response??"");
  if(!answer.trim())throw new Error("empty_output");
  const resultHash=await sha(answer);
  const artifactKey="jobs/"+job.project_id+"/"+id+"/result.txt";
  // Recheck cancellation before committing. Cancellation during AI call is cooperative.
  const current=await env.LEDGER.prepare("SELECT status FROM nathan_jobs WHERE id=?").bind(id).first();
  if(current?.status==="cancelled"){await record(env,id,"Fo","cancelled_before_commit",{});return}
  if(env.ARTIFACTS)await env.ARTIFACTS.put(artifactKey,answer,{httpMetadata:{contentType:"text/plain"}});
  const saved=await env.LEDGER.prepare("UPDATE nathan_jobs SET status='completed',stage='Fum',result_hash=?,artifact_key=?,updated_at=?,lease_until=NULL WHERE id=? AND status='running'").bind(resultHash,env.ARTIFACTS?artifactKey:null,stamp(),id).run();
  if(saved.meta?.changes){
   await env.LEDGER.prepare("INSERT INTO sovereign_ledger(input_hash,output_payload,created_at) VALUES(?,?,?)").bind(job.input_hash,answer,stamp()).run();
   await record(env,id,"Fum","completed",{resultHash,durationMs:stamp()-start,backend:backend.id,cost:"unmeasured"});
  }
 }catch(e){
  const reason=String(e?.message||"execution_failed").slice(0,100);
  const current=await env.LEDGER.prepare("SELECT status,attempt FROM nathan_jobs WHERE id=?").bind(id).first();
  if(current&&current.status!=="cancelled"){
   const retry=reason==="capacity_full"||reason==="backend_unavailable";
   await env.LEDGER.prepare("UPDATE nathan_jobs SET status=?,stage=?,error_code=?,lease_until=NULL,updated_at=? WHERE id=? AND status!='cancelled'").bind(retry&&current.attempt<3?"queued":"failed",retry?"Fi":"Fo",reason,stamp(),id).run();
   await record(env,id,"Fo","execution_error",{reason,retry});
   if(retry&&current.attempt<3&&env.JOBS)await env.JOBS.send({jobId:id},{delaySeconds:30});
  }
 }finally{if(reserved)await env.LEDGER.prepare("UPDATE nathan_backends SET reserved=MAX(0,reserved-1),updated_at=? WHERE id='workers-ai-default'").bind(stamp()).run()}
}
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url),path=url.pathname;
  if(request.method==="GET"&&path==="/health")return out({box:1,axiom:"1+1=2",ready:true});
  if(!env.BOX_INTERNAL_KEY||request.headers.get("x-box-gate")!==env.BOX_INTERNAL_KEY)return out({status:"rejected",reason:"forbidden"},403);
  if(!env.LEDGER)return out({status:"deferred",reason:"ledger_binding_unavailable"},503);
  if(path==="/compute"&&request.method==="POST"){
   const data=await request.json().catch(()=>null);
   if(typeof data?.input!=="string"||!data.input.trim()||data.input.length>4096)return out({error:"invalid_input"},400);
   if(!env.AI)return out({error:"ai_binding_unavailable"},503);
   const digest=await sha(data.input),cache=env.CACHE?await env.CACHE.get("result:"+digest):null;
   if(cache)return out({box:1,axiom:"1+1=2",cached:true,input_hash:digest,result:cache});
   const ai=await env.AI.run("@cf/meta/llama-3.1-8b-instruct",{messages:[{role:"user",content:data.input}]});
   const answer=String(ai?.response??"");
   await env.LEDGER.prepare("INSERT INTO sovereign_ledger(input_hash,output_payload,created_at) VALUES(?,?,?)").bind(digest,answer,stamp()).run();
   if(env.CACHE)await env.CACHE.put("result:"+digest,answer,{expirationTtl:3600});
   return out({box:1,axiom:"1+1=2",cached:false,input_hash:digest,result:answer});
  }
  if(path==="/v1/capacity"&&request.method==="GET"){
   const rows=await env.LEDGER.prepare("SELECT id,kind,region,accelerator,device_count,memory_mb,precision,runtimes,interconnect,max_concurrent,reserved,cost_usd_per_hour,enabled FROM nathan_backends").all();
   return out({backends:rows.results});
  }
  if(path==="/v1/jobs"&&request.method==="POST"){
   const project=request.headers.get("x-project-id")||"default",key=request.headers.get("idempotency-key");
   if(!validProject(project)||!key||key.length>128)return out({status:"rejected",reason:"project_or_idempotency_invalid"},400);
   const data=await request.json().catch(()=>null),input=data?.input;
   if(typeof input!=="string"||!input.trim()||input.length>4096||data?.workload&&data.workload!=="inference")return out({status:"rejected",reason:"invalid_workload"},400);
   const maxCost=Number(data?.max_cost_usd);
   if(!Number.isFinite(maxCost)||maxCost<0)return out({status:"rejected",reason:"budget_invalid"},400);
   const digest=await sha(input),existing=await env.LEDGER.prepare("SELECT id,input_hash,status FROM nathan_jobs WHERE project_id=? AND idempotency_key=?").bind(project,key).first();
   if(existing)return existing.input_hash===digest?out({status:existing.status,job_id:existing.id,duplicate:true,receipt:existing.id},200):out({status:"rejected",reason:"idempotency_conflict"},409);
   if(!env.JOBS||!env.ARTIFACTS)return out({status:"deferred",reason:"queue_or_artifact_storage_unavailable"},503);
   const estimatedCost=Number(env.ESTIMATED_JOB_COST_USD);
   if(!Number.isFinite(estimatedCost)||estimatedCost<=0)return out({status:"deferred",reason:"budget_estimate_unavailable"},503);
   if(maxCost<estimatedCost)return out({status:"rejected",reason:"budget_exhausted",required_usd:estimatedCost},402);
   const id=crypto.randomUUID(),now=stamp();
   await env.LEDGER.prepare("INSERT INTO nathan_jobs(id,project_id,idempotency_key,input_hash,input_text,workload,status,stage,max_cost_usd,estimated_cost_usd,created_at,updated_at) VALUES(?,?,?,?,?,'inference','queued','Fe',?,?,?,?)").bind(id,project,key,digest,input,maxCost,estimatedCost,now,now).run();
   await record(env,id,"Fe","accepted",{maxCost});
   try{await env.JOBS.send({jobId:id})}catch{
    await env.LEDGER.prepare("UPDATE nathan_jobs SET status='failed',error_code='queue_delivery_failed',updated_at=? WHERE id=?").bind(stamp(),id).run();
    return out({status:"deferred",reason:"queue_delivery_failed",job_id:id,receipt:id},503);
   }
   return out({status:"accepted",job_id:id,receipt:id},202);
  }
  if(path==="/v1/jobs"&&request.method==="GET"){
   const project=request.headers.get("x-project-id")||"default";
   if(!validProject(project))return out({error:"invalid_project"},400);
   const jobs=await env.LEDGER.prepare("SELECT id,project_id,status,stage,backend_id,created_at,updated_at,measured_cost_usd FROM nathan_jobs WHERE project_id=? ORDER BY created_at DESC LIMIT 50").bind(project).all();
   return out({jobs:jobs.results});
  }
  const match=path.match(/^\/v1\/jobs\/([a-zA-Z0-9-]+)(?:\/(cancel|artifact))?$/);
  if(match){
   const [,id,action]=match,project=request.headers.get("x-project-id")||"default";
   if(!validProject(project))return out({error:"invalid_project"},400);
   const job=await env.LEDGER.prepare("SELECT * FROM nathan_jobs WHERE id=? AND project_id=?").bind(id,project).first();
   if(!job)return out({error:"not_found"},404);
   if(action==="cancel"&&request.method==="POST"){
    const result=await env.LEDGER.prepare("UPDATE nathan_jobs SET status='cancelled',stage='CLEAR',cancelled_at=?,updated_at=? WHERE id=? AND project_id=? AND status IN ('queued','reserved','running')").bind(stamp(),stamp(),id,project).run();
    if(result.meta?.changes)await record(env,id,"CLEAR","cancelled",{});
    return out({job_id:id,status:result.meta?.changes?"cancelled":job.status,receipt:id});
   }
   if(action==="artifact"&&request.method==="GET"){
    if(job.status!=="completed")return out({error:"not_completed",status:job.status},409);
    if(!job.artifact_key||!env.ARTIFACTS)return out({error:"artifact_storage_unavailable"},503);
    const artifact=await env.ARTIFACTS.get(job.artifact_key);
    return artifact?new Response(artifact.body,{headers:{"content-type":"text/plain","x-content-sha256":job.result_hash,"cache-control":"no-store"}}):out({error:"artifact_missing"},404);
   }
   if(!action&&request.method==="GET"){
    const events=await env.LEDGER.prepare("SELECT stage,action,at,detail FROM nathan_job_events WHERE job_id=? ORDER BY id").bind(id).all();
    return out({job:{...job,input_text:undefined},events:events.results,receipt:id});
   }
  }
  return out({error:"not_found"},404);
 },
 async queue(batch,env){
  for(const msg of batch.messages){try{if(typeof msg.body?.jobId==="string")await processJob(env,msg.body.jobId);msg.ack()}catch{msg.retry()}}
 }
};

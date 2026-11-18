import architecture from "../architecture.json" with {type:"json"};
import { actAddress,sha256 } from "./proofs.mjs";
import { jobKinds,runNext,runScheduled,submit,summarySql } from "./jobs.mjs";
import { page,script } from "./site.mjs";

const shared={"cache-control":"no-store","x-content-type-options":"nosniff"};
const json=(value,status=200)=>Response.json(value,{status,headers:{...shared,"access-control-allow-origin":"*"}});
const knownServices=[
  {key:"WORLD_HUB",name:"Tabor World Hub",host:"https://hub.internal",path:"/health",url:"https://tabor-world-hub.nathantaboract.workers.dev/"},
  {key:"SOVEREIGN_COMPUTE",name:"Nathan AI 2X+ Sovereign Supercomputer",host:"https://compute.internal",path:"/health",url:"https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/"},
  {key:"COMPUTE_FLEET",name:"Compute Fleet Registry",host:"https://fleet.internal",path:"/health"},
];

async function federation(request,env) {
  const services=await Promise.all(knownServices.map(async ({key,name,host,path,url})=>{
    let status=null;
    try {
      const response=await env[key]?.fetch(host+path,{signal:AbortSignal.timeout(3500)});
      status=response?.status??null;
      if(response?.body) await response.body.cancel();
    } catch {}
    return {key,name,url,status,reachable:status>=200&&status<300};
  }));
  return json({edge:{provider:"Cloudflare",colo:request.cf?.colo??null},services});
}

async function authorized(request,env) {
  const bearer=request.headers.get("authorization")||"";
  if (!env.TRUE_CLOUD_TOKEN||bearer.length>300||!bearer.startsWith("Bearer ")) return false;
  const [left,right]=await Promise.all([sha256(bearer.slice(7)),sha256(env.TRUE_CLOUD_TOKEN)]);
  let diff=0;
  for(let i=0;i<left.length;i++) diff|=left.charCodeAt(i)^right.charCodeAt(i);
  return diff===0;
}

const jobsSql=`SELECT j.id,j.kind,j.status,j.created_at,j.started_at,j.completed_at,j.result_json,r.sha256
  FROM true_cloud_jobs j LEFT JOIN true_cloud_receipts r ON r.job_id=j.id`;

async function receipts(request,url,env) {
  if (url.pathname==="/api/jobs"&&request.method==="GET") {
    const {results}=await env.DB.prepare(jobsSql+" ORDER BY j.created_at DESC,j.id DESC LIMIT 30").all();
    return json({jobs:results.map(({result_json,...row})=>({...row,
      result_json:row.status==="failed"?'{"error":"Job failed"}':result_json}))});
  }
  if (url.pathname==="/api/jobs"&&request.method==="POST") {
    if(!await authorized(request,env))return json({error:"Unauthorized"},401);
    const reader=request.body?.getReader();
    let text="",bytes=0;
    const decoder=new TextDecoder();
    if(!reader)return json({error:"JSON body required"},400);
    for(;;) {
      const {done,value}=await reader.read();
      if(done)break;
      bytes+=value.byteLength;
      if(bytes>1024) { await reader.cancel();return json({error:"Request exceeds 1 KB"},413); }
      text+=decoder.decode(value,{stream:true});
    }
    let body;
    try{body=JSON.parse(text+decoder.decode());}catch{return json({error:"Invalid JSON"},400);}
    if(!jobKinds.includes(body?.kind))return json({error:"Unsupported job kind"},400);
    const key=request.headers.get("idempotency-key");
    if(key!==null&&!/^[a-z0-9_-]{1,80}$/i.test(key))return json({error:"Invalid idempotency key"},400);
    const id=key===null?crypto.randomUUID():"request-"+await sha256(key);
    const job=await submit(env.DB,id,body.kind);
    return job.kind!==body.kind?json({error:"Idempotency key is assigned to a different kind"},409):json(job,201);
  }
  if(request.method==="GET"){
    const match=/^\/api\/jobs\/([a-zA-Z0-9_.:%-]{1,120})(\/audit)?$/.exec(url.pathname);
    if(match){
      const id=decodeURIComponent(match[1]);
      const receipt=await env.DB.prepare("SELECT body,sha256 FROM true_cloud_receipts WHERE job_id=?").bind(id).first();
      if(!receipt)return json({error:"Verified receipt unavailable"},404);
      return json(match[2]?{id,sha256:receipt.sha256,verified:await sha256(receipt.body)===receipt.sha256}:
        {receipt:JSON.parse(receipt.body),sha256:receipt.sha256});
    }
  }
  return json({error:"Not found"},404);
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url),path=url.pathname;
    if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"*",
      "access-control-allow-headers":"authorization,content-type,idempotency-key","access-control-allow-methods":"GET,POST,OPTIONS"}});
    try {
      if(request.method==="GET"){
        if(path==="/")return new Response(page,{headers:{...shared,"content-type":"text/html;charset=utf-8","referrer-policy":"no-referrer",
          "content-security-policy":"default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}});
        if(path==="/dashboard.js")return new Response(script,{headers:{...shared,"content-type":"text/javascript;charset=utf-8"}});
        if(path==="/health")return json({name:architecture.project,version:architecture.version,hub:"TABOR WORLD HUB",state:"edge-online",job_kinds:jobKinds});
        if(path==="/api/architecture")return json(architecture);
        if(path==="/api/federation")return federation(request,env);
        if(path==="/api/act/address")return json(await actAddress(url.searchParams.get("label")));
        if(path==="/api/status"){
          const counts=await env.DB.prepare(summarySql).first();
          return json({platform:"TRUE CLOUD COMPUTING",hub:"TABOR WORLD HUB",counts,capabilities:{
            edge:true,d1:true,scheduled_execution:true,external_compute_provisioned:false,registered_nodes:counts.registered_compute_nodes}});
        }
      }
      if(path==="/api/jobs"||path.startsWith("/api/jobs/"))return await receipts(request,url,env);
      if(request.method==="POST"&&path==="/api/run-next"){
        return await authorized(request,env)?json(await runNext(env.DB)):json({error:"Unauthorized"},401);
      }
      return json({error:"Not found"},404);
    }catch(error){
      if(error instanceof RangeError||error instanceof URIError)return json({error:error.message},400);
      console.error("true cloud route",path,error.name);
      return json({error:"Service temporarily unavailable"},503);
    }
  },
  scheduled(event,env,ctx) { ctx.waitUntil(runScheduled(env.DB,event.scheduledTime)); }
};

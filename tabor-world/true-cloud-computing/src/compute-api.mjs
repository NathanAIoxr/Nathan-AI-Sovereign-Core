import {authenticate,admit,cancel,fabricContract,parameters,validId} from "./compute-gate.mjs";
import {execute,runOne} from "./compute-engine.mjs";
import {canonical,sha256} from "./proofs.mjs";

const prefix="/api/compute/";
const selectJobs=`SELECT id,namespace,seed,terms,operation_budget,state,attempts,created_ms,updated_ms,error_code
  FROM true_cloud_compute_jobs WHERE namespace=?`;
const json=(body,status=200)=>Response.json(body,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
export async function computeApi(request,env,ctx) {
  const path=new URL(request.url).pathname.slice(prefix.length);
  if(request.method==="GET"&&path==="manifest")return json(fabricContract);
  if(request.method==="GET"&&path==="benchmarks") {
    const {results}=await env.DB.prepare("SELECT id,body,sha256 FROM true_cloud_compute_benchmarks ORDER BY scheduled_ms DESC LIMIT 12").all();
    const receipts=await Promise.all(results.map(async row=>({receipt:JSON.parse(row.body),sha256:row.sha256,verified:await sha256(row.body)===row.sha256})));
    return json({receipts});
  }
  if(request.method==="GET"&&path==="benchmark/probe") {
    const result=await execute(env.SOVEREIGN_COMPUTE,73,2048);
    const receipt={kind:"on-demand",time_ms:Date.now(),result};
    return json({receipt,sha256:await sha256(canonical(receipt)),verified:true});
  }
  if(path!=="jobs"&&!path.startsWith("jobs/"))return json({reason:"route_not_found"},404);
  const namespace=await authenticate(request,env);
  if(!namespace)return json({admission:"rejected",reason:"unauthorized"},401);
  if(path==="jobs"&&request.method==="POST") {
    const outcome=await admit(env.DB,namespace,await parameters(request));
    if(outcome.body.state==="queued"&&ctx) ctx.waitUntil(runOne(env,outcome.body.id).catch(()=>{}));
    return json(outcome.body,outcome.status);
  }
  if(path==="jobs"&&request.method==="GET") {
    const {results}=await env.DB.prepare(selectJobs+" ORDER BY created_ms DESC,id DESC LIMIT 30").bind(namespace).all();
    return json({jobs:results});
  }
  const [collection,id,resource,extra]=path.split("/");
  if(collection!=="jobs"||!id||!validId(id)||extra!==undefined)return json({reason:"not_found"},404);
  const job=await env.DB.prepare(selectJobs+" AND id=?").bind(namespace,id).first();
  if(!job)return json({reason:"not_found"},404);
  if(request.method==="POST"&&resource==="cancel") {
    const row=await cancel(env.DB,namespace,id);
    return row?json(row):json({reason:"job_already_terminal"},409);
  }
  if(request.method!=="GET")return json({reason:"method_not_allowed"},405);
  if(resource===undefined) {
    const {results}=await env.DB.prepare("SELECT state,created_ms,receipt_sha FROM true_cloud_compute_events WHERE job_id=? ORDER BY seq").bind(id).all();
    return json({job,events:results});
  }
  if(resource==="receipt") {
    const row=await env.DB.prepare("SELECT receipt,receipt_sha FROM true_cloud_compute_events WHERE job_id=? AND state='verified' ORDER BY seq DESC LIMIT 1").bind(id).first();
    if(!row)return json({reason:"receipt_pending",state:job.state},404);
    return json({receipt:JSON.parse(row.receipt),sha256:row.receipt_sha,verified:await sha256(row.receipt)===row.receipt_sha});
  }
  return json({reason:"route_not_found"},404);
}

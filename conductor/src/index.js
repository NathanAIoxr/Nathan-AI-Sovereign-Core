const json=(x,status=200)=>Response.json(x,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const allowed=new Set(['validate','deploy-existing','audit']);
const projectPattern=/^[a-z0-9][a-z0-9-]{1,62}$/;
function secure(a,b){if(!a||!b)return false;const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);if(x.length!==y.length)return false;let d=0;for(let i=0;i<x.length;i++)d|=x[i]^y[i];return d===0;}
export default {
 async fetch(req,env){
  const url=new URL(req.url);
  if(req.method==='GET'&&url.pathname==='/health')return json({service:'sovereign-conductor',mode:'approval-gated',ready:!!env.DISPATCH_TOKEN&&!!env.GITHUB_TOKEN});
  if(!secure(req.headers.get('authorization')?.replace(/^Bearer /,''),env.DISPATCH_TOKEN))return json({error:'unauthorized'},401);
  if(req.method==='GET'&&url.pathname.startsWith('/status/')){
   const id=url.pathname.slice(8);if(!/^[a-f0-9-]{36}$/.test(id))return json({error:'invalid id'},400);
   const item=await env.REGISTRY.prepare('SELECT job_id,project_id,job_kind,status,approved,created_at,finished_at,receipt_json FROM sovereign_dispatch_v1 WHERE job_id=?').bind(id).first();
   return item?json(item):json({error:'not found'},404);
  }
  if(req.method!=='POST'||url.pathname!=='/dispatch')return json({error:'not found'},404);
  if(Number(req.headers.get('content-length')||0)>8192)return json({error:'payload too large'},413);
  let body;try{body=await req.json()}catch{return json({error:'invalid json'},400)}
  const {project_id,action,request_id}=body||{};
  if(!projectPattern.test(project_id||'')||!allowed.has(action)||typeof request_id!=='string'||request_id.length>120)return json({error:'invalid request'},400);
  const project=await env.REGISTRY.prepare('SELECT project_id FROM zones_registry WHERE project_id=?').bind(project_id).first();
  if(!project)return json({error:'unknown project'},404);
  const id=crypto.randomUUID();
  await env.REGISTRY.prepare('INSERT INTO sovereign_dispatch_v1(job_id,project_id,job_kind,payload_json,status,approved) VALUES(?,?,?,?,?,0)').bind(id,project_id,action,JSON.stringify({request_id}), 'queued').run();
  // Deliberately no automatic deployment: review/approval is required.
  return json({job_id:id,status:'queued',approval_required:true},202);
 }
};

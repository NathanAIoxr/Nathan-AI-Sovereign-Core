/** Nathan AI Supercomputer: deterministic scheduling and benchmark control plane.
 * 1+1=2: combine unique capabilities; 1-1=0: remove duplicate tasks, not original evidence.
 */
const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const axioms=Object.freeze({build:"1+1=2",clear:"1-1=0",integrate:"1×1=1",verify:"1÷1=1"});
const pipeline=["sensor","filter","process","log","act-and-index","dispatch","sync","escalate"];
export function normalizeTasks(tasks){
 const seen=new Set(),out=[];
 for(const task of tasks){if(!task||typeof task.id!=="string"||!task.id.trim())continue;
  const id=task.id.trim();if(seen.has(id))continue;seen.add(id);
  out.push({id,priority:Math.max(0,Math.min(100,Number(task.priority)||0)),family:String(task.family||"general").slice(0,64),stage:String(task.stage||"sensor").slice(0,32)});
 }
 return out.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
}
export function dispatchPlan(tasks,slots=4){
 const count=Math.max(1,Math.min(128,Math.floor(Number(slots)||4)));
 const unique=normalizeTasks(tasks),lanes=Array.from({length:count},(_,i)=>({lane:i,tasks:[]}));
 unique.forEach((task,i)=>lanes[i%count].tasks.push(task));
 return {axioms,input:tasks.length,unique:unique.length,duplicatesRemoved:tasks.length-unique.length,lanes,metric:"logical scheduling only; no measured speedup"};
}
export default {async fetch(req,env){
 const url=new URL(req.url);
 if(req.method==="GET"&&url.pathname==="/health")return json({service:"NATHAN AI Supercomputer Control Plane",online:true,computeHardwareProvisioned:false});
 if(req.method==="GET"&&url.pathname==="/api/architecture")return json({axioms,pipeline,planes:["NATHAN OS","ABM Master Brain","4T Clover","78-Field Matrix","Tabor World Hub","Mining Command Center","Worker Federation"],goal:{throughputMultiplier:2,verified:false},notice:"Cloudflare orchestrates workloads; it is not a physical exascale computer."});
 if(req.method==="GET"&&url.pathname==="/api/registry"){
  const result=await env.REGISTRY.prepare("SELECT id,name,kind,status FROM supercomputer_registry ORDER BY name LIMIT 200").all();
  return json({count:result.results.length,systems:result.results});
 }
 if(req.method==="POST"&&url.pathname==="/api/plan"){
  const size=Number(req.headers.get("content-length")||0);if(size>32768)return json({error:"payload too large"},413);
  let body;try{body=await req.json()}catch{return json({error:"invalid JSON"},400)}
  if(!Array.isArray(body.tasks)||body.tasks.length>256)return json({error:"tasks array required, max 256"},400);
  return json(dispatchPlan(body.tasks,body.slots));
 }
 if(req.method==="GET"&&url.pathname==="/")return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NATHAN AI Supercomputer</title><style>body{font:16px system-ui;background:#0b1525;color:#ecf5ff;max-width:860px;margin:7vh auto;padding:24px}a{color:#87e4d2}section{background:#172b41;padding:24px;border-radius:16px}h1{font-size:clamp(2rem,6vw,4rem)}</style><h1>NATHAN AI SUPERCOMPUTER</h1><section><h2>1+1=2 · 1−1=0</h2><p>Deterministic task planning, deduplication and distributed worker architecture.</p><p>2× throughput is a benchmark target, not an unverified performance claim.</p><a href="/api/architecture">Architecture</a> · <a href="/api/registry">Systems registry</a> · <a href="/health">Health</a></section></html>',{headers:{"content-type":"text/html; charset=utf-8"}});
 return json({error:"not found"},404);
}};

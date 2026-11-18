import {binary,lockMoves,lockState,pack,protocolClient} from "./protocol.mjs";
import {githubUrl,readSnapshot,refresh,roster,sha,summarize} from "./registry.mjs";
import {page,script} from "./site.mjs";

const common={"cache-control":"no-store","x-content-type-options":"nosniff"};
const dataHeaders={...common,"access-control-allow-origin":"*"};
const json=(body,status=200)=>Response.json(body,{status,headers:dataHeaders});
const connections=[
  ["TRUE_CLOUD","True Cloud Computing","https://tabor-true-cloud-computing.nathantaboract.workers.dev/"],
  ["SOVEREIGN_COMPUTE","Nathan AI 2X+ Sovereign Supercomputer","https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/"],
  ["WORLD_HUB","Tabor World Hub","https://tabor-world-hub.nathantaboract.workers.dev/"],
];

async function links(env){
  return Promise.all(connections.map(async ([binding,name,url])=>{
    let status=null;
    try{
      const response=await env[binding]?.fetch("https://family.internal/health",{signal:AbortSignal.timeout(3500)});
      status=response?.status??null;
      if(response?.body)await response.body.cancel();
    }catch{}
    return {name,url,status,reachable:status>=200&&status<300};
  }));
}

function numberParam(url,key,fallback,min,max) {
  const values=url.searchParams.getAll(key);
  if(!values.length)return fallback;
  if(values.length!==1||!/^\d{1,7}$/.test(values[0]))throw RangeError("Invalid "+key+".");
  const value=Number(values[0]);
  if(value<min||value>max)throw RangeError("Invalid "+key+".");
  return value;
}

export default {
  async fetch(request,env) {
    if(request.method!=="GET")return json({error:"GET required"},405);
    const url=new URL(request.url),path=url.pathname;
    if(path==="/")return new Response(page,{headers:{...common,"content-type":"text/html; charset=utf-8",
      "referrer-policy":"no-referrer",
      "content-security-policy":"default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}});
    if(path==="/app.js")return new Response(script,{headers:{...common,"content-type":"text/javascript; charset=utf-8"}});
    if(path==="/protocol.mjs")return new Response(protocolClient(),{headers:{...common,"content-type":"text/javascript; charset=utf-8"}});
    if(path==="/api/lock") {
      const value=url.searchParams.get("moves")??"";
      if(value.length>140)return json({error:"Sequence too long."},400);
      const moves=value?value.split(","):[];
      if(moves.some(move=>!["insert","right","left"].includes(move)))return json({error:"Unknown move."},400);
      return json({sequence:lockMoves,binary,...lockState(moves)});
    }
    if(path==="/api/connections")return json({github:githubUrl,services:await links(env)});
    if(!["/health","/api/status","/api/roster","/api/federation.bin","/api/snapshot.json","/api/audit"].includes(path)){
      return json({error:"Not found"},404);
    }
    try{
      const row=await readSnapshot(env.REGISTRY);
      if(!row)return json({error:"First roster sync pending"},503);
      const {snapshot,digest}=row;
      const summary=summarize(snapshot);
      if(path==="/health")return json({service:"Tabor Family Federation",ready:true,last_sync_ms:summary.observed_ms});
      if(path==="/api/status")return json({...summary,sha256:digest});
      if(path==="/api/audit")return json({sha256:digest,verified:await sha(JSON.stringify(snapshot))===digest,
        counted_assignments:summary.assignment_count,formula:summary.meeting?"3 × source records":"0"});
      if(path==="/api/snapshot.json")return json(snapshot);
      if(path==="/api/federation.bin")return new Response(pack(summary,digest),{headers:{...dataHeaders,
        "content-type":"application/octet-stream","content-disposition":'attachment; filename="tabor-federation.bin"'}});
      const raw=url.searchParams.getAll("family");
      if(raw.length>1||(raw.length===1&&!["github","cloudflare"].includes(raw[0])))throw RangeError("Invalid family.");
      return json({...roster(snapshot,raw[0],numberParam(url,"offset",0,0,10000),numberParam(url,"limit",24,1,100)),sha256:digest});
    }catch(error){
      if(error instanceof RangeError)return json({error:error.message},400);
      console.error("federation route",path,error.name);
      return json({error:"Roster temporarily unavailable"},503);
    }
  },
  scheduled(event,env,ctx) {ctx.waitUntil(refresh(env.REGISTRY,fetch,event.scheduledTime));},
};


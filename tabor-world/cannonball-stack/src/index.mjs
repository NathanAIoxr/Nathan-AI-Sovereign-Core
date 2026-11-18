import catalog from "./catalog.json" with {type:"json"};
import {identities,rhythm,score} from "./core.mjs";
import {generation} from "./power.mjs";
import {page,script} from "./site.mjs";
import {clientWords} from "./words.mjs";

const common={"x-content-type-options":"nosniff","cache-control":"no-store"};
const json=(value,status=200)=>Response.json(value,{status,headers:{...common,"access-control-allow-origin":"*"}});
const links=[
  ["SUPERCOMPUTER","Sovereign Supercomputer","https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/cluster"],
  ["TRUE_CLOUD","True Cloud Computing","https://tabor-true-cloud-computing.nathantaboract.workers.dev/"],
  ["FEDERATION","Tabor Family Federation","https://tabor-family-federation.nathantaboract.workers.dev/"],
];
async function attached(env){
  return Promise.all(links.map(async ([binding,name,url])=>{
    let status=null;
    try {
      const response=await env[binding].fetch("https://stack.internal/health",{signal:AbortSignal.timeout(3500)});
      status=response.status;
      if(response.body)await response.body.cancel();
    }catch {}
    return {name,url,status,reachable:status>=200&&status<300};
  }));
}

export default {async fetch(request,env) {
  const url=new URL(request.url),path=url.pathname;
  if(request.method!=="GET")return json({error:"GET required"},405);
  if(path==="/")return new Response(page,{headers:{...common,"content-type":"text/html; charset=utf-8",
    "content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});
  if(path==="/app.js"||path==="/words.js")return new Response(path==="/app.js"?script:clientWords,{
    headers:{...common,"content-type":"text/javascript; charset=utf-8"}});
  try{
    if(path==="/health")return json({service:"My stack of cannon balls",version:"1.0.0"});
    if(path==="/api/catalog")return json(catalog);
    if(path==="/api/connections")return json({services:await attached(env)});
    if(path==="/api/power")return json(await generation());
    if(path==="/api/score")return json(score());
    if(path==="/api/rhythm"){
      const tick=url.searchParams.get("tick")??"0";
      if(!/^-?\d{1,15}$/.test(tick)||url.searchParams.getAll("tick").length>1)throw RangeError("Enter one whole-number tick.");
      return json(rhythm(Number(tick)));
    }
    if(path==="/api/will-wheel-way"){
      return json({identities:identities.map(term=>[term,term]),connections:identities.flatMap(from=>identities.filter(to=>to!==from).map(to=>[from,to]))});
    }
    return json({error:"Not found"},404);
  }catch(error){
    if(error instanceof RangeError)return json({error:error.message},400);
    console.error("Cannonball module unavailable",path,error.name);
    return json({error:"Source temporarily unavailable"},503);
  }
}};

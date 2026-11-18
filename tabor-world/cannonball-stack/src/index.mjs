import catalog from "./catalog.json" with {type:"json"};
import {identities,rhythm,score} from "./core.mjs";
import {generation} from "./power.mjs";
import {page,script} from "./site.mjs";
import {clientWords} from "./words.mjs";
import {gameEngine} from "./game-engine.mjs";
import {gameClient} from "./game-client.mjs";
import {factory,factoryInfo,factoryClient,libraryIndex} from "./factory.mjs";
import {gamePage,factoryPage,screenStyle,workspacePage} from "./screens.mjs";
import {installer,manifest,offline} from "./install.mjs";
import {icons} from "./icons.mjs";

const common={"x-content-type-options":"nosniff","cache-control":"no-store"};
const json=(value,status=200)=>Response.json(value,{status,headers:{...common,"access-control-allow-origin":"*"}});
const html = value => new Response(value,{headers:{...common,"content-type":"text/html; charset=utf-8",
  "content-security-policy":"default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; worker-src 'self'; img-src 'self'; manifest-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
const asset = (value,type) => new Response(value,{headers:{...common,"content-type":type}});
const assets = {
  "/app.js":script,
  "/words.js":clientWords,
  "/slayers-sleyers/app.js":gameClient,
  "/slayers-sleyers/engine.js":gameEngine,
  "/factory/app.js":factoryClient,
  "/install.js":installer,
  "/sw.js":offline,
};
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
  if(path==="/")return html(page);
  if(path==="/slayers-sleyers" || path==="/factory"){
    return new Response(null,{status:308,headers:{location:path+"/"+url.search}});
  }
  if(path==="/slayers-sleyers/")return html(gamePage);
  if(path==="/factory/")return html(factoryPage);
  const project = factory.find(entry=>entry.path===path || entry.blueprintRoute===path);
  if(project)return html(workspacePage(project));
  if(Object.hasOwn(assets,path))return asset(assets[path],"text/javascript; charset=utf-8");
  if(path==="/tabor.css")return asset(screenStyle,"text/css; charset=utf-8");
  if(path==="/manifest.webmanifest")return asset(JSON.stringify(manifest),"application/manifest+json");
  const icon = /^\/icon-(192|512)\.png$/.exec(path);
  if(icon)return asset(Uint8Array.from(atob(icons[icon[1]]),char=>char.charCodeAt(0)),"image/png");
  try{
    if(path==="/health")return json({service:"My stack of cannon balls",version:"2.0.0"});
    if(path==="/api/catalog")return json(catalog);
    if(path==="/api/factory")return json(factoryInfo);
    if(path==="/api/factory/library")return json(await libraryIndex(env.LIBRARY));
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

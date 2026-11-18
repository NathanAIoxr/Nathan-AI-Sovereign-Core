import current from "../fleet-release/one-entry.mjs";
export * from "../fleet-release/one-entry.mjs";

const services = new Set(["bitcoin","memory","wordplay","compute","languages","world","cloud","outside-box","github","moment","library"]);
const responseHeaders = {"cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
const respond = (body,status=200) => Response.json(body,{status,headers:responseHeaders});
const inFleet = (path) => path==="/fleet/platforms" || path.startsWith("/fleet/platforms/");
function platformId(name) {
  if (services.has(name)) return name;
  const match=/^language-shard-(\d{4})$/.exec(name);
  if (match && Number(match[1])>=1 && Number(match[1])<=989) return name;
  return null;
}
async function platformRoute(request,env) {
  if (request.method!=="GET") return respond({error:"GET required"},405);
  const url=new URL(request.url), path=url.pathname;
  if (path==="/fleet/platforms") {
    return respond({
      schema:"tabor.platform-bridge.v1",main:"ONE Sovereign Hub",
      topology:"1 main control hub + 1000 Cloudflare Workers for Platforms scripts",
      targetNamespace:"nathan-tabor-platforms",dispatchService:"nathan-tabor-hyper-federation",
      workerScripts:1000,platformServices:11,languageShards:989,
      federation:"tabor-supercomputer-federation",federationLogicalNodes:1000,
      resources:"Cloudflare-managed, shared CPU and memory; Durable Object SQLite and D1/R2 storage; no dedicated physical machines",
      mode:"bounded read-only on-demand dispatch",
      routes:{health:"/fleet/platforms/health",services:"/fleet/platforms/catalog",shards:"/fleet/platforms/shards?start=1",sample:"/fleet/platforms/p/language-shard-0001"}
    });
  }
  let target;
  if(path==="/fleet/platforms/health" && !url.search) target="/health";
  else if(path==="/fleet/platforms/catalog" && !url.search) target="/api/platforms";
  else if(path==="/fleet/platforms/shards") {
    const params=new URLSearchParams(url.search);
    const start=params.get("start")??"1";
    if([...params.keys()].some(k=>k!=="start")||!/^\d{1,3}$/.test(start)||Number(start)<1||Number(start)>989) return respond({error:"Invalid shard index"},400);
    target="/api/shards?start="+start;
  } else if(path==="/fleet/platforms/library" && !url.search) target="/library/api/summary";
  else {
    const match=/^\/fleet\/platforms\/p\/([a-z0-9-]+)\/?$/.exec(path);
    const id=match&&platformId(match[1]);
    if(!id || url.search) return respond({error:"Platform route not found"},404);
    target="/p/"+id+(services.has(id)?"/api/platform":"/");
  }
  try {
    const res=await env.PLATFORM_HUB.fetch(new Request("https://nathan-tabor-hyper-federation.internal"+target,{method:"GET",redirect:"manual",signal:AbortSignal.timeout(8000)}));
    const type=res.headers.get("content-type")??"";
    if(!type.startsWith("application/json")||res.status>=300&&res.status<400) {await res.body?.cancel();return respond({error:"Unexpected platform response"},502);}
    const headers=new Headers(responseHeaders);headers.set("content-type","application/json; charset=utf-8");headers.set("x-tabor-platform-source","nathan-tabor-hyper-federation");
    return new Response(res.body,{status:res.status,headers});
  } catch {
    return respond({error:"Platform bridge unavailable"},503);
  }
}
export default {...current,fetch(request,env,ctx) {
  const path=new URL(request.url).pathname;
  if(inFleet(path))return platformRoute(request,env);
  return current.fetch(request,env,ctx);
}};

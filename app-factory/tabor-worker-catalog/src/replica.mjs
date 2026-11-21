import { catalog, catalogBody, entryById, fleet, officialHost, prefix, proofHeaders, release, replicaKey, replicaPrefix, slotSet, sourceLabels } from "./registry.mjs";
import { css, detail, home, slotsPage } from "./ui.mjs";
import { executeUtility, utilityBody } from "./utilities.mjs";

const security={
  ...proofHeaders,
  "content-security-policy":"default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"
};
const mimeJSON="application/json; charset=utf-8";
const respond=(body,type,status=200,headers={})=>new Response(body,{status,headers:{...security,"content-type":type,"cache-control":"no-store",...headers}});
const json=(value,status=200,headers)=>respond(JSON.stringify(value),mimeJSON,status,headers);
const html=body=>respond(body,"text/html; charset=utf-8");
const notFound=()=>json({error:"Worker catalog route not found"},404);
const formatJSON={etag:'"sha256-'+release.sha256+'"',"cache-control":"public, max-age=300"};
const tools=new Set(catalog.entries.map(x=>x.localUtility).filter(Boolean));
const federationRoute=/^\/v1\/nodes\/(node-\d{3,4})\/worker-catalog(?:\.json)?$/;
const localReplicaRoute=/^\/worker-catalog\/nodes\/(node-\d{3,4})\/catalog\.json$/;

export function isCatalogRoute(path,federation=false){
  return path===prefix||path.startsWith(prefix+"/")||(federation&&federationRoute.test(path));
}

async function storedNode(env,id,head){
  if(!slotSet.has(id))return notFound();
  if(!env?.WORKER_CATALOG_REPLICAS) {
    return new Response(null,{status:307,headers:{Location:officialHost+prefix+"/nodes/"+id+"/catalog.json","cache-control":"no-store"}});
  }
  const bucket=env.WORKER_CATALOG_REPLICAS;
  const object=head?await bucket.head(replicaKey(id)):await bucket.get(replicaKey(id));
  if(!object||object.customMetadata?.sha256!==release.sha256||object.size!==release.bytes) {
    if(object?.body)await object.body.cancel();
    return json({error:"Replica unavailable",slot:id},503);
  }
  return respond(object.body??null,mimeJSON,200,{...formatJSON,"content-length":String(object.size),"x-federation-slot":id});
}

async function inventory(env){
  if(!env?.WORKER_CATALOG_REPLICAS)return json({inventory:officialHost+prefix+"/api/replicas"});
  let cursor;
  const copies=new Set();
  const bucket=env.WORKER_CATALOG_REPLICAS;
  do{
    const page=await bucket.list({prefix:replicaPrefix,cursor,limit:500});
    for(const object of page.objects){
      const id=object.key.slice(replicaPrefix.length,-5);
      if(object.key.endsWith(".json")&&object.size===release.bytes&&slotSet.has(id))copies.add(id);
    }
    cursor=page.truncated?page.cursor:undefined;
  }while(cursor);
  return json({cohort:fleet.cohort,registeredSlots:fleet.slots.length,storedCopies:copies.size,
    catalogEntries:catalog.entries.length,sha256:release.sha256,slotSource:fleet.source});
}

function list(url){
  const term=(url.searchParams.get("q")??"").trim().slice(0,100);
  const group=url.searchParams.get("category")??"";
  const state=url.searchParams.get("status")??"";
  const raw=url.searchParams.get("page")??"1";
  if((group&&!/^[1-9]$/.test(group))||(state&&!Object.hasOwn(sourceLabels,state))||!/^\d{1,3}$/.test(raw)||Number(raw)<1)return null;
  const q=term.toLowerCase();
  const rows=catalog.entries.filter(item=>(!group||Number(group)===item.category)&&(!state||state===item.source.status)&&
    (!q||`${String(item.id).padStart(3,"0")} ${item.name} ${item.description} ${item.submittedReference??""}`.toLowerCase().includes(q)));
  const page=Number(raw);
  return {term,group,state,page,last:Math.max(1,Math.ceil(rows.length/24)),items:rows.slice((page-1)*24,page*24)};
}

async function get(url,env,head,config){
  const path=url.pathname;
  const slot=(config.federation?federationRoute.exec(path):null)??localReplicaRoute.exec(path);
  if(slot)return storedNode(env,slot[1],head);
  if(path===prefix||path===prefix+"/"){
    const args=list(url);
    return args?html(home(args)):json({error:"Invalid catalog filter"},400);
  }
  if(path===prefix+"/catalog.json")return respond(head?null:catalogBody,mimeJSON,200,formatJSON);
  if(path===prefix+"/catalog.css")return respond(css,"text/css; charset=utf-8",200,{"cache-control":"public, max-age=300"});
  if(path===prefix+"/receipt")return json({...release,cohort:fleet.cohort,host:config.host??url.hostname});
  if(path===prefix+"/api/replicas")return inventory(env);
  if(path===prefix+"/api/nodes")return json(fleet);
  if(path===prefix+"/nodes"){
    const offset=url.searchParams.get("offset")??"0";
    return /^\d{1,4}$/.test(offset)&&Number(offset)<fleet.slots.length?html(slotsPage(Number(offset),60)):json({error:"Invalid slot offset"},400);
  }
  const record=new RegExp("^"+prefix+"/projects/(\\d{1,3})$").exec(path);
  if(record){
    const item=entryById.get(Number(record[1]));
    return item?html(detail(item)):notFound();
  }
  return notFound();
}

export async function catalogFetch(request,env,config={}){
  const url=new URL(request.url);
  const head=request.method==="HEAD";
  if(request.method==="POST"&&url.pathname.startsWith(prefix+"/tools/")){
    const name=url.pathname.slice((prefix+"/tools/").length);
    if(!tools.has(name))return notFound();
    try{
      const value=await executeUtility(name,await utilityBody(request));
      return json(value);
    }catch(error){
      const valid=error instanceof RangeError||error instanceof SyntaxError||error instanceof TypeError;
      return json({error:valid?error.message:"Utility unavailable"},valid?400:503);
    }
  }
  if(!["GET","HEAD"].includes(request.method))return json({error:"Method unavailable"},405,{allow:"GET, HEAD"});
  let response;
  try {response=await get(url,env,head,config);}
  catch {response=json({error:"Catalog storage unavailable"},503);}
  return head?new Response(null,response):response;
}

const navigation='<aside aria-label="Technology catalog"><p><a href="/worker-catalog/">Tabor Worker Catalog · 101 entries</a></p></aside>';

export function withWorkerCatalog(original,config={}){
  return {...original,async fetch(request,env,ctx){
    const url=new URL(request.url);
    const path=url.pathname;
    if(isCatalogRoute(path,config.federation))return catalogFetch(request,env,config);
    const response=await original.fetch(request,env,ctx);
    if(request.method!=="GET"||!response.ok)return response;
    if(config.nav?.includes(path)&&response.headers.get("content-type")?.startsWith("text/html")){
      let added=false;
      return new HTMLRewriter().on("body, main, header",{element(element){
        if(added)return;
        added=true;
        element.prepend(navigation,{html:true});
      }}).transform(response);
    }
    if(config.destinations===path&&response.headers.get("content-type")?.includes("application/json")){
      const data=await response.clone().json().catch(()=>null);
      if(Array.isArray(data)&&!data.some(item=>item?.id==="tabor-worker-catalog")){
        const headers=new Headers(response.headers);
        headers.delete("content-length");
        headers.delete("etag");
        return new Response(JSON.stringify([...data,{id:"tabor-worker-catalog",name:"Tabor Worker Catalog",kind:"101 software records",
          area:"Worlds",url:new URL(prefix+"/",url.origin).href,desc:"Browse the Library of Tabor technology catalog by collection and source evidence."}]),{status:response.status,headers});
      }
    }
    return response;
  }};
}

export default {fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==="/"&&["GET","HEAD"].includes(request.method))return new Response(null,{status:302,headers:{Location:prefix+"/"}});
  return catalogFetch(request,env,{host:"tabor-worker-catalog"});
}};

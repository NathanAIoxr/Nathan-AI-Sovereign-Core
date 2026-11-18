import {catalogText,catalogDigest} from "./bundle.mjs";
import {engines} from "./engines.mjs";
import {invokeRemote,remoteTools} from "./remote-tools.mjs";

const compiled = JSON.parse(catalogText);
const bytes = new TextEncoder().encode(catalogText).length;
const headers = {
  "cache-control":"no-store",
  "content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "referrer-policy":"no-referrer",
  "x-content-type-options":"nosniff",
};
const table="tabor_public_fleet_releases";
const schema=`CREATE TABLE IF NOT EXISTS ${table} (
  release TEXT PRIMARY KEY, sha256 TEXT NOT NULL, payload TEXT NOT NULL
) STRICT`;
const insert=`INSERT OR IGNORE INTO ${table}(release,sha256,payload) VALUES (?,?,?)`;
const read=`SELECT sha256,payload FROM ${table} WHERE release=?`;
const totals = Object.values(compiled.counts).reduce((sum,count)=>sum+count,0);

function output(request,value,status=200,extra={}) {
  return new Response(request.method==="HEAD"?null:JSON.stringify(value),{
    status,headers:{...headers,"content-type":"application/json; charset=utf-8",...extra},
  });
}
export const failure = (request, error, status) => output(request,{error},status);

async function verify(row) {
  if (row?.sha256!==catalogDigest || row.payload.length!==catalogText.length) throw new Error("replica missing or inconsistent");
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(row.payload));
  const hex=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  if (hex!==catalogDigest) throw new Error("replica digest mismatch");
  return row.payload;
}

export async function localReplica(sql) {
  sql.exec(schema);
  let row=sql.exec(read,compiled.release).toArray()[0];
  if (!row) {
    sql.exec(insert,compiled.release,catalogDigest,catalogText);
    row=sql.exec(read,compiled.release).toArray()[0];
  }
  return verify(row);
}

export async function oneReplica(db) {
  const results=await db.batch([
    db.prepare(schema),
    db.prepare(insert).bind(compiled.release,catalogDigest,catalogText),
    db.prepare(read).bind(compiled.release),
  ]);
  return verify(results[2].results[0]);
}

function receipt(id,storage,env) {
  return {
    schema:compiled.schema, release:compiled.release, node:id, storage, sha256:catalogDigest,
    bytes, entries:totals, collections:compiled.counts, verified:true,
    native_tools:engines.size, service_routes:[...remoteTools.values()].filter(tool=>env[tool.binding]).length,
  };
}

export async function requestJson(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase()!=="application/json") {
    return {error:"application_json_required",status:415};
  }
  const limit=48*1024;
  if (Number(request.headers.get("content-length"))>limit) return {error:"payload_too_large",status:413};
  if (!request.body) return {error:"json_object_required",status:400};
  const reader=request.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let size=0, text="";
  try {
    while (true) {
      const {value,done}=await reader.read();
      if (done) break;
      size+=value.byteLength;
      if (size>limit) return {error:"payload_too_large",status:413};
      text+=decoder.decode(value,{stream:true});
    }
    const payload=JSON.parse(text+decoder.decode());
    return payload && typeof payload==="object" && !Array.isArray(payload)
      ? {payload} : {error:"json_object_required",status:400};
  } catch {
    return {error:"invalid_json",status:400};
  } finally {
    await reader.cancel().catch(()=>{});
  }
}

function catalog(request,snapshot,url) {
  const filter=url.searchParams.get("collection")??"";
  const query=(url.searchParams.get("q")??"").trim().toLowerCase();
  const offset=url.searchParams.get("offset")??"0";
  if ((filter&&!snapshot.collections.some(c=>c.id===filter)) || query.length>120 || !/^\d{1,4}$/.test(offset) || Number(offset)>totals) {
    return failure(request,"invalid_catalog_filter",400);
  }
  const selected=snapshot.collections.filter(c=>!filter||c.id===filter);
  const matches=selected.flatMap(c=>c.entries.filter(e=>!query||[e.id,e.title,e.description,e.domain,e.category]
    .some(s=>String(s??"").toLowerCase().includes(query))).map(entry=>({...entry,collection:c.id})));
  const start=Number(offset);
  return output(request,{release:snapshot.release,collections:selected.map(c=>({id:c.id,title:c.title,source:c.source,count:c.entries.length})),
    total:matches.length,next:start+50<matches.length?start+50:null,entries:matches.slice(start,start+50)});
}

function capabilities(request,prefix,env) {
  const tools=[...engines,...[...remoteTools].filter(([,tool])=>env[tool.binding])].sort(([a],[b])=>a-b);
  return output(request,{release:compiled.release,tools:tools.map(([id,tool])=>({
    id,execution:engines.has(id)?"node":"service_binding",path:prefix+"/tools/"+id,method:tool.method,example:tool.example,
  }))});
}

function home(request,id,prefix) {
  return new Response(request.method==="HEAD"?null:`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tabor Fleet · ${id}</title><style>html{color-scheme:dark}body{margin:0;background:#101a17;color:#edf1e9;font:17px/1.55 system-ui}main{max-width:48rem;margin:auto;padding:2rem 1.25rem 4rem}h1{font:2.75rem Georgia,serif;margin:.5rem 0}a{color:#a7dec1}nav{display:flex;flex-wrap:wrap;gap:1rem}input,button{font:inherit;padding:.5rem;border-radius:.25rem;margin:.75rem .5rem .75rem 0;max-width:100%}</style>
<main><p>Library of Tabor · ${id}</p><h1>Fleet release</h1><p>${totals} records across six collections</p>
<nav><a href="${prefix}/receipt">Replica receipt</a><a href="${prefix}/capabilities">Callable tools</a><a href="${prefix}/package.json">Release JSON</a></nav>
<form action="${prefix}/catalog"><label>Find a record <input name="q" maxlength="120"></label><button>Search</button></form>
<ul>${compiled.collections.map(c=>`<li><a href="${prefix}/catalog?collection=${c.id}">${c.title}</a> · ${c.entries.length}</li>`).join("")}</ul>
</main></html>`,{headers:{...headers,"content-type":"text/html; charset=utf-8"}});
}

function forward(request, response, id) {
  const type=response.headers.get("content-type")?.split(";")[0];
  const allowed=["application/json","audio/wav","image/svg+xml","text/plain"];
  if ((response.status>=300&&response.status<400) || !allowed.includes(type) || (response.status>=400 && type==="text/plain")) {
    return failure(request,"unexpected_tool_response",502);
  }
  const disposition=response.headers.get("content-disposition");
  return new Response(response.body,{status:response.status, headers:{...headers,
    "content-type":response.headers.get("content-type"),
    ...(disposition&&type==="audio/wav"?{"content-disposition":disposition}:{}),
    "x-tabor-fleet-node":id,"x-tabor-fleet-release":compiled.release,
  }});
}

export const matchesSuffix = path => /^\/(?:receipt|catalog|package\.json|capabilities|tools\/[1-9]\d{0,2})?$/.test(path);

export async function fleetRoute(request,id,prefix,suffix,storage,getSnapshot,env={}) {
  const url=new URL(request.url);
  if (!matchesSuffix(suffix)) return failure(request,"fleet_route_not_found",404);
  const toolId=Number(/^\/tools\/([1-9]\d{0,2})$/.exec(suffix)?.[1]);
  const tool=engines.get(toolId)??remoteTools.get(toolId);
  const readOnly=!toolId;
  if (!readOnly&&!tool) return failure(request,"tool_not_available_in_release",404);
  const allowed=readOnly?["GET","HEAD"]:[tool.method];
  if (!allowed.includes(request.method)) return output(request,{error:"method_not_allowed"},405,{allow:allowed.join(", ")});
  if (url.search.length>8192 || (!readOnly && (tool.fixed || tool.method==="POST") && url.search)) {
    return failure(request,"invalid_tool_query",400);
  }
  let payload;
  if (request.method==="POST") {
    const parsed=await requestJson(request);
    if (parsed.error) return failure(request,parsed.error,parsed.status);
    payload=parsed.payload;
  }
  let snapshot;
  try { snapshot=await getSnapshot(); } catch { return failure(request,"fleet_replica_unavailable",503); }
  if (suffix==="/receipt") return output(request,receipt(id,storage,env));
  if (suffix==="/capabilities") return capabilities(request,prefix,env);
  if (suffix==="/catalog") return catalog(request,JSON.parse(snapshot),url);
  if (suffix==="/package.json") return new Response(request.method==="HEAD"?null:snapshot,{headers:{
    ...headers,"content-type":"application/json; charset=utf-8","x-tabor-package-sha256":catalogDigest,
  }});
  if (suffix==="/") return home(request,id,prefix);
  if (engines.has(toolId)) {
    try {
      const result=await tool.run(payload);
      return forward(request,result instanceof Response?result:Response.json(result),id);
    } catch (error) {
      return error instanceof RangeError
        ? output(request,{error:"invalid_tool_input",detail:error.message},400)
        : failure(request,"tool_execution_failed",502);
    }
  }
  try {
    if (!env[tool.binding]) return failure(request,"tool_binding_unavailable",503);
    const result=await invokeRemote(tool,url,payload,env);
    return forward(request,result,id);
  } catch { return failure(request,"upstream_tool_unavailable",502); }
}

export async function batchReceipts(request,nodeName,fetchReceipt,count) {
  const url=new URL(request.url);
  const start=Number(url.searchParams.get("start")??1), limit=Number(url.searchParams.get("limit")??20);
  if (!Number.isInteger(start)||start<1||start>count||!Number.isInteger(limit)||limit<1||limit>20) {
    return failure(request,"invalid_replica_page",400);
  }
  const end=Math.min(count,start+limit-1);
  const entries=await Promise.all(Array.from({length:end-start+1},async (_,index)=>{
    const node=nodeName(start+index);
    try {
      const result=await fetchReceipt(node);
      const record=await result.json();
      if (result.ok && record.node===node && record.sha256===catalogDigest && record.verified) return record;
      return {node,verified:false,error:record.error??"receipt_mismatch"};
    } catch { return {node,verified:false,error:"receipt_unavailable"}; }
  }));
  return output(request,{release:compiled.release,total:count,next:end<count?end+1:null,entries},
    entries.every(e=>e.verified)?200:503);
}

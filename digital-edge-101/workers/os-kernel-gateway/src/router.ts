import table from "../../../registry/os-syscall-table.json";
import {handlers} from "../../../registry/handlers.ts";
import {InputError,check,type Env,type JSONValue} from "../../../shared/core.ts";
import {runPlan} from "../../../agent-core/dag.ts";
import {actCollection} from "../../../fabric/act.ts";
import {app,html,icon,manifest,serviceWorker} from "../../../shell/web-pwa/assets.ts";

export interface SyscallRequest<T=unknown> {
  syscall_id:string; trace_id:string;
  caller_context:{tenant_id:string;auth_level:"guest"|"user"|"agent"|"admin";approval_token?:string};
  payload:T;
}
export interface SyscallResponse<R=unknown> {
  ok:boolean; syscall_id:string; execution_ms:number;trace_id?:string; data?:R;
  error?:{code:string;message:string;retryable:boolean};
}
const records=new Map(table.map(r=>[r.id,r]));
const callable=table.filter(r=>handlers.has(r.id));
const toolName=(id:string)=>"syscall_"+id.replaceAll("-","_");
const toolIds=new Map(callable.map(r=>[toolName(r.id),r.id]));
export const counts={registered:table.length,callable:callable.length,
  executable:table.filter(r=>r.status==="executable").length,fixture:table.filter(r=>r.status==="fixture").length,
  specified:table.filter(r=>r.status==="specified").length,awaitingSpec:table.filter(r=>r.status==="awaiting-spec").length};
const rings=["Edge microkernel","State and storage fabric","Comms and protocol bus","Agent orchestration","Web shell and device utilities"];
const headers={"cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer"};
const json=(data:unknown,status=200)=>Response.json(data,{status,headers});
function asset(body:string,type:string){return new Response(body,{headers:{...headers,"content-type":type,"content-security-policy":"default-src 'none'; connect-src 'self'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});}
async function readBody(request:Request):Promise<unknown>{
  check(request.headers.get("content-type")?.split(";")[0].trim()==="application/json","Expected application/json");
  const reader=request.body?.getReader();
  check(reader,"Request body is missing");
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;
    if(size>32768){await reader.cancel();throw new InputError("Request body exceeds 32 KiB");}
    chunks.push(value);}
  try{return JSON.parse(await new Blob(chunks as BlobPart[]).text());}catch{throw new InputError("Malformed JSON");}
}
const err=(code:string,message:string,retryable=false)=>({code,message,retryable});
export async function syscall(id:string,input:JSONValue|undefined,env:Env,trace?:string):Promise<SyscallResponse>{
  const start=Date.now(),handler=handlers.get(id);
  const stamp=()=>({syscall_id:id,execution_ms:Date.now()-start,trace_id:trace});
  if(!handler)return {ok:false,...stamp(),error:records.has(id)?err("NOT_CALLABLE","This registry entry has no executable handler"):err("UNKNOWN_ID","Syscall ID is not in the registry")};
  try{
    const data=await handler.execute(input===undefined?handler.sample:input,env);
    return {ok:true,...stamp(),data};
  }catch(e){return {ok:false,...stamp(),error:e instanceof InputError?err("INVALID_INPUT",e.message):err("EXECUTION_ERROR","The module could not complete",true)};}
}
function status(x:SyscallResponse){return x.ok?200:x.error?.code==="UNKNOWN_ID"?404:x.error?.code==="NOT_CALLABLE"?501:x.error?.code==="INVALID_INPUT"?400:503;}
async function mcp(input:unknown,env:Env){
  check(input&&typeof input==="object"&&!Array.isArray(input),"Expected one JSON-RPC request");
  const x=input as Record<string,unknown>;
  check(x.jsonrpc==="2.0"&&typeof x.method==="string","Invalid JSON-RPC envelope");
  if(x.id===undefined)return new Response(null,{status:202});
  check(typeof x.id==="string"||typeof x.id==="number","Invalid JSON-RPC ID");
  const rpc=(result:unknown)=>json({jsonrpc:"2.0",id:x.id,result});
  const rpcError=(code:number,message:string)=>json({jsonrpc:"2.0",id:x.id,error:{code,message}});
  const p=x.params&&typeof x.params==="object"?x.params as Record<string,unknown>:{};
  if(x.method==="initialize")return rpc({protocolVersion:p.protocolVersion==="2025-03-26"?"2025-03-26":"2025-11-25",
    capabilities:{tools:{listChanged:false}},serverInfo:{name:"nathan-tabor-sovereign-edge-os",version:"1.0.0"}});
  if(x.method==="ping")return rpc({});
  if(x.method==="tools/list"){
    const cursor=p.cursor===undefined?0:typeof p.cursor==="string"&&/^\d+$/.test(p.cursor)?Number(p.cursor):-1;
    if(!Number.isSafeInteger(cursor)||cursor<0||cursor>=callable.length)return rpcError(-32602,"Invalid tool cursor");
    const tools=callable.slice(cursor,cursor+50).map(r=>({name:toolName(r.id),description:r.implementation??r.title,
      inputSchema:{type:"object",properties:{payload:{type:"object",examples:[r.sample]}},additionalProperties:false},
      annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}}));
    return rpc({tools,...(cursor+50<callable.length?{nextCursor:String(cursor+50)}:{})});
  }
  if(x.method==="tools/call"){
    const id=typeof p.name==="string"?toolIds.get(p.name):undefined;
    if(!id)return rpcError(-32602,"Unknown tool");
    const args=p.arguments??{};
    if(!args||typeof args!=="object"||Array.isArray(args)||Object.keys(args).some(k=>k!=="payload"))return rpcError(-32602,"Invalid tool arguments");
    const r=await syscall(id,(args as {payload?:JSONValue}).payload,env);
    return rpc({content:[{type:"text",text:JSON.stringify(r)}],isError:!r.ok});
  }
  return rpcError(-32601,"Method not found");
}

export async function router(request:Request,env:Env){
  const url=new URL(request.url),{pathname:path}=url;
  try{
    if(request.method==="GET"){
      if(path==="/")return asset(html,"text/html; charset=utf-8");
      if(path==="/app.js")return asset(app,"text/javascript; charset=utf-8");
      if(path==="/sw.js")return asset(serviceWorker,"text/javascript; charset=utf-8");
      if(path==="/icon.svg")return asset(icon,"image/svg+xml");
      if(path==="/manifest.webmanifest")return json(manifest);
      if(path==="/health")return json({status:"ok",...counts});
      if(path==="/api/rings")return json(rings.map((name,ring)=>({ring,name,registered:table.filter(r=>r.ring===ring).length,callable:callable.filter(r=>r.ring===ring).length})));
      if(path==="/registry/os-syscall-table.json"||path==="/schemas/module-manifest.json")return json(table);
      if(path==="/api/act")return json(actCollection());
      const route=/^\/api\/modules\/((?:OG-)?\d{3})(\/sample)?$/.exec(path);
      if(route){if(route[2]){const res=await syscall(route[1],undefined,env);return json(res,status(res));}
        const record=records.get(route[1]);return record?json(record):json({error:"Unknown syscall"},404);}
    }
    if(request.method==="POST"){
      if(path==="/mcp")return mcp(await readBody(request),env);
      if(path==="/api/plan"){const input=await readBody(request);return json(await runPlan(input,env));}
      if(path==="/syscall"){
        const x=await readBody(request) as SyscallRequest<JSONValue>;
        check(x&&typeof x==="object"&&!Array.isArray(x)&&typeof x.syscall_id==="string"&&/^(OG-)?\d{3}$/.test(x.syscall_id),"Expected a valid syscall ID");
        check(x.trace_id===undefined||typeof x.trace_id==="string"&&/^[0-9a-f]{32}$/.test(x.trace_id),"Expected a 32-digit hexadecimal trace ID");
        // The asserted caller context is untrusted. Every public operation is read-only and runs as a guest.
        const res=await syscall(x.syscall_id,x.payload,env,x.trace_id??crypto.randomUUID().replaceAll("-",""));return json(res,status(res));
      }
    }
    return json({error:"Route not found"},404);
  }catch(e){if(e instanceof InputError)return path==="/mcp"?json({jsonrpc:"2.0",id:null,error:{code:-32600,message:e.message}},400):json({ok:false,error:err("INVALID_INPUT",e.message)},400);
    return json({ok:false,error:err("EXECUTION_ERROR","The request could not complete",true)},503);}
}

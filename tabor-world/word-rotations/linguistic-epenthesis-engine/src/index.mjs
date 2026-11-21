import {DASHBOARD_HTML} from "./dashboard.mjs";
import {MATRIX,RULES,applyIntrusiveR,applyParagogicS,processNode,processAxis} from "./engine.mjs";
const respond=(body,status=200)=>new Response(JSON.stringify(body,null,2),{status,headers:{"content-type":"application/json;charset=UTF-8","cache-control":"no-store","access-control-allow-origin":"*"}});
export default {async fetch(request,env,ctx){
 if(request.method!=="GET")return respond({error:"method_not_allowed"},405);
 const url=new URL(request.url);
 if(url.pathname==="/dashboard")return new Response(DASHBOARD_HTML,{headers:{"content-type":"text/html;charset=utf-8","cache-control":"no-store","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'","x-content-type-options":"nosniff"}});
 if(url.pathname==="/api/metrics"){
   if(!env.DB)return respond({error:"aggregate_database_not_configured"},503);
   try{const rows=await env.DB.prepare("SELECT event_day,operation,axis,calls FROM epenthesis_aggregate ORDER BY event_day DESC,operation,axis LIMIT 200").all();return respond({records:rows.results,raw_inputs_stored:false})}
   catch{return respond({error:"aggregate_query_unavailable"},503)}
 }
 const axis=url.searchParams.get("axis")||"W_axis",next=url.searchParams.get("next")||"is";
 if(next.length>256)return respond({error:"next_token_too_long"},400);
 if(url.pathname==="/health")return respond({service:"epenthesis-word-matrix",status:"ready",axes:4,nodes:12});
 if(url.pathname==="/api/rules")return respond({linguistic_engine:RULES,low_open_endings:["a","ah","aw","ay","uh","o"],vowel_starts:["a","e","i","o","u"],note:"Orthographic approximation; not IPA transcription, phonological guarantee, or network-routing optimizer"});
 if(url.pathname==="/api/matrix")return respond({matrix:MATRIX});
 if(url.pathname==="/api/node"){
 const index=Number(url.searchParams.get("index")??0);if(!Number.isInteger(index))return respond({error:"invalid_node_index"},400);
 const result=processNode(axis,index,next);return respond(result,result.error?400:200);
 }
 if(url.pathname==="/api/bridge"){
 const first=url.searchParams.get("first")||"",second=url.searchParams.get("second")||"";
 if(first.length>256||second.length>256)return respond({error:"token_too_long"},400);
 return respond({first,second,intrusive_r_bridge:applyIntrusiveR(first,second),paragogic_s_first:applyParagogicS(first)});
 }
 if(url.pathname!=="/"&&url.pathname!=="/api/axis")return respond({error:"not_found",endpoints:["/","/health","/api/rules","/api/matrix","/api/node","/api/axis","/api/bridge"]},404);
 const result=processAxis(axis,next);if(result.error)return respond({...result,linguistic_engine:RULES},400);
 if(env.DB&&ctx?.waitUntil)ctx.waitUntil(env.DB.prepare("INSERT INTO epenthesis_aggregate(event_day,operation,axis,calls) VALUES(?,?,?,1) ON CONFLICT(event_day,operation,axis) DO UPDATE SET calls=calls+1").bind(new Date().toISOString().slice(0,10),"axis",axis).run().catch(()=>{}));
 return respond({axiom:env.SYSTEM_AXIOM||"ZERO_COINCIDENCES",...result,linguistic_engine:RULES,notation:"<< denotes stacked left-facing chevrons as an ASCII stand-in"});
}};

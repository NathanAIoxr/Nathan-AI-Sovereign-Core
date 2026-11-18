// Standalone read-only registry Worker. Does not execute untrusted work or claim bots are active.
const NODES=[{"id":"WILL","slug":"w-0","family":"W","role":"intent-governor","state":"registered","execution":"requires-queue-worker"},{"id":"WHEEL","slug":"w-1","family":"W","role":"compute-planner","state":"registered","execution":"requires-queue-worker"},{"id":"WAY","slug":"w-2","family":"W","role":"route-planner","state":"registered","execution":"requires-queue-worker"},{"id":"MILL","slug":"m-0","family":"M","role":"input-refiner","state":"registered","execution":"requires-queue-worker"},{"id":"MHEEL","slug":"m-1","family":"M","role":"lease-controller","state":"registered","execution":"requires-queue-worker"},{"id":"MAY","slug":"m-2","family":"M","role":"permission-gate","state":"registered","execution":"requires-queue-worker"},{"id":"3ILL","slug":"three-0","family":"THREE","role":"fault-inspector","state":"registered","execution":"requires-queue-worker"},{"id":"3HEEL","slug":"three-1","family":"THREE","role":"stability-inspector","state":"registered","execution":"requires-queue-worker"},{"id":"3AY","slug":"three-2","family":"THREE","role":"acknowledgment-coordinator","state":"registered","execution":"requires-queue-worker"},{"id":"<<ILL","slug":"stacked-0","family":"STACKED","role":"bitstream-transformer","state":"registered","execution":"requires-queue-worker"},{"id":"<<HEEL","slug":"stacked-1","family":"STACKED","role":"dual-rail-controller","state":"registered","execution":"requires-queue-worker"},{"id":"<<AY","slug":"stacked-2","family":"STACKED","role":"broadcast-tracker","state":"registered","execution":"requires-queue-worker"}];
const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(request.method!=="GET")return json({error:"method_not_allowed"},405);
 if(u.pathname==="/health")return json({name:"nathan-rotational-agent-mesh",ready:true,mode:"registry",agents_registered:NODES.length,agents_executing:"unverified"});
 if(u.pathname==="/api/nodes")return json({nodes:NODES,source:"NATHAN AI W/M/3/stacked glyph matrix",status:"registered_not_execution_verified"});
 if(u.pathname==="/api/matrix")return json({families:{"W":["WILL","WHEEL","WAY"],"M":["MILL","MHEEL","MAY"],"THREE":["3ILL","3HEEL","3AY"],"STACKED":["<<ILL","<<HEEL","<<AY"]},intra_family_edges:4*9,self_edges:4*3,cross_family:"symbolic transformations"});
 if(u.pathname==="/api/live"){
  if(!env.REGISTRY)return json({error:"registry_binding_unavailable"},503);
  try{const r=await env.REGISTRY.prepare("SELECT id,family,role,state,last_heartbeat,last_receipt FROM nathan_rotational_agents ORDER BY family,id").all();return json({agents:r.results})}
  catch{return json({error:"registry_schema_unavailable"},503)}
 }
 return json({name:"NATHAN AI — Rotational Agent Mesh",endpoints:["/health","/api/nodes","/api/matrix","/api/live"],note:"Agent registry, not a claim of active autonomous processing"});
}};

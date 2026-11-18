import {FORMALISMS,LAYERS,initialState,step} from "./engine.mjs";
const json=(x,s=200)=>new Response(JSON.stringify(x,null,2),{status:s,headers:{"content-type":"application/json;charset=utf-8","cache-control":"no-store"}});
export default {async fetch(request){const u=new URL(request.url);
if(request.method==="GET"){if(u.pathname==="/health")return json({service:"nathan-genie-mechanics",formalisms:21,layers:4,mode:"simulation"});
if(u.pathname==="/api/formalisms")return json({count:FORMALISMS.length,formalisms:FORMALISMS});
if(u.pathname.startsWith("/api/formalisms/")){const n=Number(u.pathname.split("/").pop());return FORMALISMS[n-1]?.id===n?json(FORMALISMS[n-1]):json({error:"not_found"},404);}
if(u.pathname==="/api/layers")return json({layers:LAYERS});
if(u.pathname==="/api/state")return json(initialState());
return json({endpoints:["/health","/api/formalisms","/api/formalisms/1..21","/api/layers","/api/state","POST /api/step"]});}
if(request.method==="POST"&&u.pathname==="/api/step"){let b;try{const raw=await request.text();if(raw.length>8192)return json({error:"too_large"},413);b=JSON.parse(raw);}catch{return json({error:"invalid_json"},400);}
const s=b?.state??initialState();if(!s||!["IDLE","ARMED","EXECUTING","COMPLETE"].includes(s.phase)||!s.world||!Array.isArray(s.snapshots)||s.snapshots.length>16||!Number.isInteger(s.version))return json({error:"invalid_state"},400);
const r=step(s,b.event);return json(r,r.ok?200:400);}
return json({error:"unsupported"},405);}};

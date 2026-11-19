// Live read-only public catalog + scheduled health verification of OWN service.
// No third-party code execution, scans, endpoint enrollment, or remote control.
const json=(value,status=200)=>Response.json(value,{status,headers:{"cache-control":"no-store","access-control-allow-origin":"*","x-content-type-options":"nosniff"}});
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(request.method!=="GET")return json({error:"read_only"},405);
  if(u.pathname==="/health")return json({service:"nathan-ai-dmsp-dit",status:"running",scope:"public_catalog_and_scheduled_self_check"});
  if(u.pathname==="/api/departments"){
   const r=await env.DB.prepare("SELECT id,title,scope FROM dmsp_departments ORDER BY id").all();
   return json({departments:r.results||[]});
  }
  if(u.pathname==="/api/open-source"){
   const r=await env.DB.prepare("SELECT name,category,url,license_note,state FROM dmsp_open_source ORDER BY name LIMIT 100").all();
   return json({projects:r.results||[]});
  }
  if(u.pathname==="/api/monitoring"){
   const r=await env.DB.prepare("SELECT service,result,observed_at,detail FROM dmsp_runtime_checks ORDER BY id DESC LIMIT 30").all();
   return json({checks:r.results||[]});
  }
  return json({error:"not_found"},404);
 },
 async scheduled(controller,env,ctx){
  ctx.waitUntil((async()=>{
   const url="https://nathan-ai-dmsp-dit-public.nathantaboract.workers.dev/health";
   let result="FAIL",detail="unreachable";
   try{const r=await fetch(url,{method:"GET",signal:AbortSignal.timeout(10000)});result=r.ok?"PASS":"FAIL";detail="HTTP "+r.status;}
   catch(e){detail=String(e).slice(0,160)}
   await env.DB.prepare("INSERT INTO dmsp_runtime_checks(service,url,result,observed_at,detail) VALUES(?,?,?,?,?)").bind("dmsp-public",url,result,new Date().toISOString(),detail).run();
  })());
 }
};

// Scheduled inventory integrity checks; no execution or mutations of fleet scripts.
export default {
 async fetch(req,env){
  if(new URL(req.url).pathname!=="/health")return Response.json({error:"not_found"},{status:404});
  return Response.json({service:"nathan-ai-grid-reconciler",status:"deployed",checks:"scheduled"});
 },
 async scheduled(controller,env,ctx){
  ctx.waitUntil((async()=>{
   const checks=[
    ["main_count","SELECT COUNT(*) n FROM grid_nodes WHERE node_type='MAIN_CONTROL_PLANE'",1],
    ["super_count","SELECT COUNT(*) n FROM grid_nodes WHERE node_type='SUPERCOMPUTER_SLOT'",1000],
    ["hyper_count","SELECT COUNT(*) n FROM grid_nodes WHERE node_type='HYPERCOMPUTER_SLOT'",1000],
    ["pool_count","SELECT COUNT(DISTINCT p.script_name) n FROM dmsp_worker_pool AS p JOIN grid_nodes AS g ON g.worker_script=p.script_name WHERE g.node_type='SUPERCOMPUTER_SLOT'",1000],
    ["links_count","SELECT COUNT(*) n FROM grid_links",2000],
    ["orphan_super","SELECT COUNT(*) n FROM grid_nodes WHERE node_type='SUPERCOMPUTER_SLOT' AND worker_script NOT IN (SELECT script_name FROM dmsp_worker_pool)",0],
    ["orphan_hyper","SELECT COUNT(*) n FROM grid_nodes WHERE node_type='HYPERCOMPUTER_SLOT' AND parent_id NOT IN (SELECT node_id FROM grid_nodes)",0]
   ];
   for(const [name,sql,expected] of checks){
    let result="FAIL",detail="";
    try{const q=await env.DB.prepare(sql).first();const observed=Number(q?.n);result=observed===expected?"PASS":"WARN";detail=JSON.stringify({expected,observed})}
    catch(e){detail=String(e).slice(0,140)}
    await env.DB.prepare("INSERT INTO dmsp_runtime_checks(service,url,result,observed_at,detail) VALUES(?,?,?,?,?)").bind("grid-"+name,"internal:d1",result,new Date().toISOString(),detail).run();
   }
  })());
 }
};
// Nathan AI Universal Grid public read-only aggregate API.
// No tenant data, secrets, script execution, or unbounded enumeration exposed.
const headers={"cache-control":"no-store","access-control-allow-origin":"*","x-content-type-options":"nosniff"};
const send=(v,s=200)=>Response.json(v,{status:s,headers});
export default {async fetch(req,env){
 if(req.method!=="GET")return send({error:"read_only"},405);
 const p=new URL(req.url).pathname;
 if(p==="/health")return send({service:"nathan-ai-universal-grid",status:"running",mode:"read_only"});
 if(p==="/api/grid/summary"){
  const [nodes,links,pool,caps]=await Promise.all([
   env.DB.prepare("SELECT node_type,reality,state,COUNT(*) AS count FROM grid_nodes GROUP BY node_type,reality,state ORDER BY node_type").all(),
   env.DB.prepare("SELECT relation,verified,COUNT(*) AS count FROM grid_links GROUP BY relation,verified").all(),
   env.DB.prepare("SELECT pool_state,execution_enabled,health_state,COUNT(*) AS count FROM dmsp_worker_pool GROUP BY pool_state,execution_enabled,health_state").all(),
   env.DB.prepare("SELECT implementation_state,COUNT(*) AS count FROM grid_capabilities GROUP BY implementation_state").all()
  ]);
  return send({nodes:nodes.results||[],links:links.results||[],worker_pool:pool.results||[],capabilities:caps.results||[],interpretation:"Logical slots are not physical computers. Registered workers are not verified running jobs."});
 }
 return send({error:"not_found"},404);
}};
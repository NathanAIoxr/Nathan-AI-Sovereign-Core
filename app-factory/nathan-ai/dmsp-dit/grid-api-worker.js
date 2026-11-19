// Nathan AI Universal Grid — read-only, paginated topology explorer.
// Only logical inventory and aggregate state are public. No dispatch or customer data.
const h={"cache-control":"no-store","access-control-allow-origin":"*","x-content-type-options":"nosniff"};
const reply=(x,s=200)=>Response.json(x,{status:s,headers:h});
const page=n=>Math.min(100,Math.max(1,Number.isInteger(+n)?+n:25));
const offset=n=>Math.max(0,Math.min(100000,Number.isInteger(+n)?+n:0));
export default {async fetch(req,env){
 if(req.method!=="GET")return reply({error:"read_only"},405);
 const u=new URL(req.url),p=u.pathname;
 try{
  if(p==="/health")return reply({service:"nathan-ai-universal-grid",status:"running",version:2,mode:"read_only"});
  if(p==="/api/grid/summary"){
   const [nodes,links,pool,caps]=await Promise.all([
    env.DB.prepare("SELECT node_type,reality,state,COUNT(*) AS count FROM grid_nodes GROUP BY node_type,reality,state ORDER BY node_type").all(),
    env.DB.prepare("SELECT relation,verified,COUNT(*) AS count FROM grid_links GROUP BY relation,verified").all(),
    env.DB.prepare("SELECT pool_state,execution_enabled,health_state,COUNT(*) AS count FROM dmsp_worker_pool GROUP BY pool_state,execution_enabled,health_state").all(),
    env.DB.prepare("SELECT implementation_state,COUNT(*) AS count FROM grid_capabilities GROUP BY implementation_state").all()]);
   return reply({nodes:nodes.results||[],links:links.results||[],worker_pool:pool.results||[],capabilities:caps.results||[],interpretation:"Logical slots are not physical computers. Registered scripts are not confirmed running jobs."});
  }
  if(p==="/api/grid/nodes"){
   const type=u.searchParams.get("type"),limit=page(u.searchParams.get("limit")),skip=offset(u.searchParams.get("offset"));
   const allowed=["MAIN_CONTROL_PLANE","SUPERCOMPUTER_SLOT","HYPERCOMPUTER_SLOT"];
   if(type&&!allowed.includes(type))return reply({error:"invalid_type"},400);
   const sql="SELECT node_id,node_type,label,parent_id,worker_script,reality,state FROM grid_nodes"+(type?" WHERE node_type=?":"")+" ORDER BY node_id LIMIT ? OFFSET ?";
   const stmt=env.DB.prepare(sql),r=await (type?stmt.bind(type,limit,skip):stmt.bind(limit,skip)).all();
   return reply({items:r.results||[],limit,offset:skip,next_offset:(r.results||[]).length===limit?skip+limit:null});
  }
  if(p==="/api/grid/children"){
   const parent=u.searchParams.get("parent");
   if(!parent||!/^((main-0001)|(super-[0-9]{4}))$/.test(parent))return reply({error:"invalid_parent"},400);
   const limit=page(u.searchParams.get("limit")),skip=offset(u.searchParams.get("offset"));
   const r=await env.DB.prepare("SELECT node_id,node_type,label,reality,state FROM grid_nodes WHERE parent_id=? ORDER BY node_id LIMIT ? OFFSET ?").bind(parent,limit,skip).all();
   return reply({parent,items:r.results||[],limit,offset:skip,next_offset:(r.results||[]).length===limit?skip+limit:null});
  }
  if(p==="/api/grid/worker-pool"){
   const limit=page(u.searchParams.get("limit")),skip=offset(u.searchParams.get("offset"));
   const r=await env.DB.prepare("SELECT script_name,namespace,pool_state,execution_enabled,health_state FROM dmsp_worker_pool ORDER BY script_name LIMIT ? OFFSET ?").bind(limit,skip).all();
   return reply({items:r.results||[],limit,offset:skip,next_offset:(r.results||[]).length===limit?skip+limit:null});
  }
  return reply({error:"not_found"},404);
 }catch(e){return reply({error:"service_unavailable"},503)}
}};
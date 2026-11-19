// DMSP + DIT tenant-scoped API; deploy as an independent Worker with D1 binding DB.
// Auth: Cloudflare Access JWT verification at edge is recommended; until configured,
// require a server-side DMSP_ADMIN_KEY and restrict access to a trusted operator.
const json=(x,status=200)=>Response.json(x,{status,headers:{"cache-control":"no-store","x-content-type-options":"nosniff"}});
const te=new TextEncoder();
function same(a,b){let x=te.encode(a||""),y=te.encode(b||""),d=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)d|=(x[i]||0)^(y[i]||0);return d===0}
function safe(s){return typeof s==="string"&&s.length>0&&s.length<=160}
async function audit(db,tenant,action,resource){await db.prepare("INSERT INTO dmsp_audit(tenant_id,actor,action,resource) VALUES(?,'operator',?,?)").bind(tenant,action,resource).run()}
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(!env.DB||!env.DMSP_ADMIN_KEY)return json({error:"not_configured"},503);
 const bearer=request.headers.get("authorization")||"";
 if(!bearer.startsWith("Bearer ")||!same(bearer.slice(7),env.DMSP_ADMIN_KEY))return json({error:"unauthorized"},401);
 try{
  if(request.method==="GET"&&u.pathname==="/api/departments"){
   const {results}=await env.DB.prepare("SELECT * FROM dmsp_departments ORDER BY id").all();return json({departments:results});
  }
  if(request.method==="GET"&&u.pathname==="/api/tenants"){
   const {results}=await env.DB.prepare("SELECT id,name,mode,status,created_at FROM dmsp_tenants ORDER BY name LIMIT 100").all();return json({tenants:results});
  }
  if(request.method==="POST"&&u.pathname==="/api/tenants"){
   const b=await request.json();if(!safe(b.id)||!safe(b.name)||!['DMSP','DIT','CO_MANAGED'].includes(b.mode))return json({error:"invalid_tenant"},400);
   await env.DB.prepare("INSERT INTO dmsp_tenants(id,name,mode) VALUES(?,?,?)").bind(b.id,b.name,b.mode).run();
   await audit(env.DB,b.id,"TENANT_CREATED",b.id);return json({ok:true,id:b.id},201);
  }
  const tenant=u.searchParams.get("tenant");
  if(request.method==="GET"&&u.pathname==="/api/overview"){
   if(!safe(tenant))return json({error:"tenant_required"},400);
   const [assets,tickets,checks]=await Promise.all([
    env.DB.prepare("SELECT health,COUNT(*) n FROM dmsp_assets WHERE tenant_id=? GROUP BY health").bind(tenant).all(),
    env.DB.prepare("SELECT state,COUNT(*) n FROM dmsp_tickets WHERE tenant_id=? GROUP BY state").bind(tenant).all(),
    env.DB.prepare("SELECT result,COUNT(*) n FROM dmsp_checks WHERE tenant_id=? GROUP BY result").bind(tenant).all()
   ]);return json({tenant,assets:assets.results,tickets:tickets.results,checks:checks.results});
  }
  if(request.method==="GET"&&u.pathname==="/api/tickets"){
   if(!safe(tenant))return json({error:"tenant_required"},400);
   const {results}=await env.DB.prepare("SELECT * FROM dmsp_tickets WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100").bind(tenant).all();return json({tickets:results});
  }
  if(request.method==="POST"&&u.pathname==="/api/tickets"){
   const b=await request.json();if(!safe(b.id)||!safe(b.tenant_id)||!safe(b.department_id)||!safe(b.title)||!['LOW','MEDIUM','HIGH','CRITICAL'].includes(b.severity))return json({error:"invalid_ticket"},400);
   await env.DB.prepare("INSERT INTO dmsp_tickets(id,tenant_id,department_id,title,severity) VALUES(?,?,?,?,?)").bind(b.id,b.tenant_id,b.department_id,b.title,b.severity).run();
   await audit(env.DB,b.tenant_id,"TICKET_CREATED",b.id);return json({ok:true,id:b.id},201);
  }
  if(request.method==="GET"&&u.pathname==="/api/actions"){
   if(!safe(tenant))return json({error:"tenant_required"},400);
   const {results}=await env.DB.prepare("SELECT * FROM dmsp_actions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100").bind(tenant).all();return json({actions:results});
  }
  return json({error:"not_found"},404);
 }catch(e){return json({error:"request_failed",detail:String(e).slice(0,200)},400)}
}};

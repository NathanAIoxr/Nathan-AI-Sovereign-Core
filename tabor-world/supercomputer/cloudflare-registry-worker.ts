/** Cloudflare read-only Supercomputer catalog; intentionally separate from existing Supercomputer Worker. */
interface Env { DB:D1Database }
export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  const u=new URL(request.url);
  if(u.pathname==="/health")return Response.json({service:"tabor-supercomputer-registry",status:"online",role:"read-only catalog",autonomousExecution:false});
  if(u.pathname==="/systems"){
   const q=(u.searchParams.get("q")||"").slice(0,100);
   const stmt=q?env.DB.prepare("SELECT id,name,kind,status,provenance FROM supercomputer_registry WHERE name LIKE ? ORDER BY name LIMIT 200").bind("%"+q+"%"):env.DB.prepare("SELECT id,name,kind,status,provenance FROM supercomputer_registry ORDER BY name LIMIT 200");
   const rows=await stmt.all();
   return Response.json({count:rows.results.length,systems:rows.results},{headers:{"cache-control":"no-store"}});
  }
  return Response.json({error:"not found"},{status:404});
 }
};

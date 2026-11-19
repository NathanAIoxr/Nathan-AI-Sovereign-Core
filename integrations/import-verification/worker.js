// Nathan AI verified inventory status; read-only. No claim that indexed entries are installed.
export default {
 async fetch(req,env) {
  const url=new URL(req.url);
  if(url.pathname!=="/"&&url.pathname!=="/health"&&url.pathname!=="/api/status")return new Response("Not found",{status:404});
  const query=async(sql)=>{const row=await env.DB.prepare(sql).first();return row?.n??null};
  try {
   const catalog=await query("SELECT COUNT(*) AS n FROM unified_catalog");
   const indexed=await query("SELECT COUNT(*) AS n FROM unified_catalog WHERE integration_status='INDEXED'");
   return new Response(JSON.stringify({service:"nathan-ai-import-verification",status:"operational",catalog_records:catalog,indexed_records:indexed,verified_external_source_imports:null,verified_external_deployments:null,note:"Catalog records are not software installations. Null means not audited, not zero.",checked_at:new Date().toISOString()}),{headers:{"content-type":"application/json","cache-control":"no-store"}});
  } catch(e) {return new Response(JSON.stringify({status:"error",reason:"database_query_failed"}),{status:503,headers:{"content-type":"application/json"}});}
 }
};
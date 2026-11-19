// Conservative read-only deployment starter. No payments, donations or provisioning without verified auth.
export interface Env { DB: D1Database; EDGE_CONFIG_KV: KVNamespace; }
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url);
 if(url.pathname==="/health" && request.method==="GET")return json({ok:true,service:"pumpkin-patch-ct-inc-total-os",mode:"read-only-starter"});
 if(url.pathname==="/api/public/catalog" && request.method==="GET"){
  const cached=await env.EDGE_CONFIG_KV.get("public:catalog:v1","json");
  return json({catalog:cached??[],source:cached?"kv":"empty-not-configured"});
 }
 return json({error:"Not found or not enabled; authentication and tenant authorization required."},404);
}} satisfies ExportedHandler<Env>;

// Public gate: keep /compute and add /v1/jobs. Bearer secret is configured outside source.
const reply=(body,status=200)=>Response.json(body,{status,headers:{"cache-control":"no-store"}});
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(request.method==="GET"&&url.pathname==="/health")return reply({service:"nathan-box-zero",axiom:"1-1=0",ready:true});
 if(!env.SOVEREIGN_KEY||request.headers.get("authorization")!=="Bearer "+env.SOVEREIGN_KEY)
  return reply({status:"rejected",reason:"unauthorized",receipt:crypto.randomUUID()},401);
 if(!env.BOX_ONE||!env.BOX_INTERNAL_KEY)return reply({status:"deferred",reason:"internal_binding_unavailable",receipt:crypto.randomUUID()},503);
 const allowed=url.pathname==="/compute"&&request.method==="POST"||
 /^\/v1\/jobs(?:\/[a-zA-Z0-9-]+(?:\/artifact|\/cancel)?)?$/.test(url.pathname)&&["GET","POST"].includes(request.method)||
 url.pathname==="/v1/capacity"&&request.method==="GET";
 if(!allowed)return reply({status:"rejected",reason:"route_not_found",receipt:crypto.randomUUID()},404);
 const raw=["POST","PUT","PATCH"].includes(request.method)?await request.text():"";
 if(raw.length>16384)return reply({status:"rejected",reason:"payload_too_large",receipt:crypto.randomUUID()},413);
 if(raw){try{JSON.parse(raw)}catch{return reply({status:"rejected",reason:"invalid_json",receipt:crypto.randomUUID()},400)}}
 const headers=new Headers({"x-box-gate":env.BOX_INTERNAL_KEY,"content-type":"application/json"});
 const idempotency=request.headers.get("idempotency-key");if(idempotency)headers.set("idempotency-key",idempotency);
 const project=request.headers.get("x-project-id");if(project)headers.set("x-project-id",project);
 const downstream=await env.BOX_ONE.fetch(new Request("https://box-one.internal"+url.pathname+url.search,{method:request.method,headers,body:raw||undefined}));
 return new Response(downstream.body,{status:downstream.status,headers:{"content-type":downstream.headers.get("content-type")||"application/json","cache-control":"no-store"}});
}};

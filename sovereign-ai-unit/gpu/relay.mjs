// Deploy once per authorized pool with public and preview URLs disabled.
export async function relay(request,env,send=fetch) {
  const label=new URL(request.url);
  if(label.origin!=="https://authorized-pool"||label.pathname!=="/v1/slice"||request.method!=="POST") return new Response(null,{status:404});
  const id=request.headers.get("idempotency-key")??"";
  const contentType=request.headers.get("content-type")??"";
  if(!/^[a-f0-9-]{36}-[0-9]{1,3}$/.test(id)||!["application/json","multipart/form-data"].some(t=>contentType.startsWith(t))) return new Response(null,{status:400});
  if(!env.POOL_BEARER||!env.POOL_ENDPOINT)return new Response(null,{status:503});
  const target=new URL(env.POOL_ENDPOINT);
  if(target.protocol!=="https:"||target.username||target.password||target.search||target.hash||target.pathname!=="/v1/slice")return new Response(null,{status:503});
  try {
    return await send(target.href,{method:"POST",headers:{authorization:"Bearer "+env.POOL_BEARER,"idempotency-key":id,"content-type":contentType},
      body:request.body,redirect:"error",signal:AbortSignal.timeout(42000)});
  }catch{return new Response(null,{status:502});}
}
export default {fetch:(request,env)=>relay(request,env)};

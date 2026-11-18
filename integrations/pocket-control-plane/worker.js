// Nathan AI Pocket Control Plane — additive Cloudflare Worker.
// Secrets: POCKET_KEY, GH_TOKEN, GH_WEBHOOK_SECRET. Vars: GH_OWNER, GH_REPO.
// All write operations require explicit confirmation and a fixed action allowlist.
// Never expose GitHub credentials to the browser.
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}});
const eq=(a,b)=>{if(typeof a!=="string"||typeof b!=="string")return false;const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let v=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)v|=(x[i]||0)^(y[i]||0);return v===0};
async function gh(env,path,method="GET",body){
 const url="https://api.github.com/repos/"+encodeURIComponent(env.GH_OWNER)+"/"+encodeURIComponent(env.GH_REPO)+path;
 const r=await fetch(url,{method,headers:{"authorization":"Bearer "+env.GH_TOKEN,"accept":"application/vnd.github+json","x-github-api-version":"2022-11-28","user-agent":"nathan-ai-pocket-control"},body:body?JSON.stringify(body):undefined});
 const data=r.status===204?{}:await r.json().catch(()=>({error:"invalid upstream response"}));
 return json({upstream_status:r.status,data},r.ok?200:502);
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!env.POCKET_KEY||!env.GH_TOKEN||!env.GH_OWNER||!env.GH_REPO)return json({error:"not_configured"},503);
  const auth=request.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")||!eq(auth.slice(7),env.POCKET_KEY))return json({error:"unauthorized"},401);
  if(request.method==="GET"&&url.pathname==="/health")return json({status:"ok",service:"nathan-ai-pocket-control"});
  if(request.method==="GET"&&url.pathname==="/repos")return gh(env,"");
  if(request.method==="GET"&&url.pathname==="/runs")return gh(env,"/actions/runs?per_page=20");
  if(request.method==="GET"&&url.pathname==="/pulls")return gh(env,"/pulls?state=open&per_page=20");
  if(request.method==="POST"&&url.pathname==="/dispatch"){
   let b;try{b=await request.json()}catch{return json({error:"invalid_json"},400)}
   if(b.confirm!==true||typeof b.workflow!=="string"||!/^[\w.-]+\.ya?ml$/.test(b.workflow)||typeof b.ref!=="string"||!/^[-\w./]{1,150}$/.test(b.ref))return json({error:"explicit_confirmation_and_valid_workflow_ref_required"},400);
   // Only approved workflow files may be invoked; configure as comma-separated list.
   const allowed=(env.ALLOWED_WORKFLOWS||"").split(",").map(x=>x.trim());
   if(!allowed.includes(b.workflow))return json({error:"workflow_not_allowlisted"},403);
   return gh(env,"/actions/workflows/"+encodeURIComponent(b.workflow)+"/dispatches","POST",{ref:b.ref,inputs:b.inputs&&typeof b.inputs==="object"?b.inputs:{}});
  }
  return json({error:"not_found"},404);
 }
};

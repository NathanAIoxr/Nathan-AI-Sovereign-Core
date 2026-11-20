// Cloudflare Worker adapter: eight-arm queue-ready verification service.
// No third-party mining, unowned assets, or public arbitrary compute endpoints.
const arms=['intake','forward','reverse','distribute','optimize','refine','golden-goose','conductor'];
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
async function digest(input){return hex(await crypto.subtle.digest('SHA-256',input));}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/health')return Response.json({engine:'octopus-mirror-engine',status:'ready',arms,mode:'VERIFICATION_ONLY'});
  if(url.pathname!=='/verify'||request.method!=='POST')return new Response('Not found',{status:404});
  if(!env.OCTOPUS_API_TOKEN||request.headers.get('authorization')!==`Bearer ${env.OCTOPUS_API_TOKEN}`)return new Response('Unauthorized',{status:401});
  if(Number(request.headers.get('content-length')||0)>65536)return new Response('Payload too large',{status:413});
  let body;try{body=await request.json();}catch{return new Response('Bad JSON',{status:400});}
  if(!Array.isArray(body.jobs)||body.jobs.length>64)return new Response('Invalid batch',{status:400});
  const results=[];
  for(const job of body.jobs){
   if(typeof job?.id!=='string'||typeof job?.payload!=='string'||job.payload.length>4096)return new Response('Invalid job',{status:400});
   results.push({id:job.id,sha256:await digest(new TextEncoder().encode(job.payload))});
  }
  return Response.json({processed:results.length,results,rewardsVerified:0,coinsMinted:0});
 }
};

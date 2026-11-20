// Octopus Mirror Engine: authenticated, bounded Cloudflare verification service.
const arms=['intake','forward','reverse','distribute','optimize','refine','golden-goose','conductor'];
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
async function digest(input){return hex(await crypto.subtle.digest('SHA-256',input));}
const reply=(message,status)=>new Response(message,{status,headers:{'cache-control':'no-store'}});
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/health'&&request.method==='GET')return Response.json({engine:'octopus-mirror-engine',status:'ready',arms,mode:'VERIFICATION_ONLY'},{headers:{'cache-control':'no-store'}});
  if(url.pathname!=='/verify'||request.method!=='POST')return reply('Not found',404);
  if(!env.OCTOPUS_API_TOKEN||request.headers.get('authorization')!==`Bearer ${env.OCTOPUS_API_TOKEN}`)return reply('Unauthorized',401);
  if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return reply('JSON required',415);
  const reader=request.body?.getReader();
  if(!reader)return reply('Body required',400);
  const chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();return reply('Payload too large',413);}chunks.push(value);}}
  catch{return reply('Read error',400);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return reply('Bad JSON',400);}
  if(!body||!Array.isArray(body.jobs)||body.jobs.length>64)return reply('Invalid batch',400);
  const results=[];const seen=new Set();
  for(const job of body.jobs){
   if(!job||typeof job.id!=='string'||!/^[a-zA-Z0-9_.-]{1,100}$/.test(job.id)||typeof job.payload!=='string'||new TextEncoder().encode(job.payload).byteLength>4096)return reply('Invalid job',400);
   if(seen.has(job.id))continue;seen.add(job.id);
   results.push({id:job.id,sha256:await digest(new TextEncoder().encode(job.payload))});
  }
  return Response.json({processed:results.length,results,rewardsVerified:0,coinsMinted:0},{headers:{'cache-control':'no-store'}});
 }
};
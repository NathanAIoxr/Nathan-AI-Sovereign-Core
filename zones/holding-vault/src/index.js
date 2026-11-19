const headers = {'cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY'};
const holding = (name) => new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Holding Vault</title><style>body{font:18px system-ui;background:#101827;color:#fff;min-height:100vh;display:grid;place-items:center;text-align:center}main{padding:2rem}</style><main><h1>Holding Vault</h1><p>'+escapeHtml(name)+'</p><p>Not yet publicly launched.</p></main></html>',{headers:{...headers,'content-type':'text/html; charset=utf-8'}});
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export default {
 async fetch(request,env) {
  const url=new URL(request.url);
  if(request.method!=='GET'&&request.method!=='HEAD') return new Response('Method not allowed',{status:405,headers});
  if(url.pathname==='/health') return Response.json({service:'holding-vault',status:'ok'},{headers});
  const project=await env.REGISTRY.prepare('SELECT display_name,launch_status,staging_url FROM zones_registry WHERE project_id=?').bind(env.PROJECT_ID).first();
  if(!project) return new Response('Project not registered',{status:503,headers});
  if(project.launch_status!=='LIVE') return holding(project.display_name);
  if(!project.staging_url) return new Response('Live target not configured',{status:503,headers});
  const target=new URL(project.staging_url);
  if(target.protocol!=='https:'||!(target.hostname.endsWith('.pages.dev')||target.hostname.endsWith('.workers.dev'))) return new Response('Unapproved upstream',{status:503,headers});
  const upstream=new URL(url.pathname+url.search,target);
  return fetch(new Request(upstream,request),{redirect:'manual'});
 }
};

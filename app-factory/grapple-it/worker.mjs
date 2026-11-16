
export function createWorker(assets){
 const types={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
 return {async fetch(request){
  const {pathname}=new URL(request.url);
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  const asset=pathname==='/'?'index.html':pathname.slice(1);
  if(!Object.hasOwn(assets,asset))return new Response('Page not found',{status:404});
  const suffix=asset.slice(asset.lastIndexOf('.'));
  return new Response(request.method==='HEAD'?null:assets[asset],{headers:{
   'Content-Type':(types[suffix]??'text/plain')+'; charset=utf-8',
   'Cache-Control':'no-cache',
   'X-Content-Type-Options':'nosniff',
   'Referrer-Policy':'strict-origin-when-cross-origin',
   'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
  }});
 }};
}

const assets=/*__ASSETS__*/ {};
const types={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',json:'application/json; charset=utf-8',webmanifest:'application/manifest+json',svg:'image/svg+xml',png:'image/png'};
export default {
  fetch(request){
    const url=new URL(request.url);
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const route=url.pathname;
    if(route==='/healthz')return new Response(request.method==='HEAD'?null:JSON.stringify({app:'history-of-snow-globes',chapters:7}),{headers:{'content-type':'application/json'}});
    const name=route==='/'?'index.html':route.slice(1);
    if(!Object.hasOwn(assets,name))return new Response('Not found',{status:404});
    const content=assets[name];
    const body=request.method==='HEAD'?null:typeof content==='string'?content:Uint8Array.from(atob(content.base64),c=>c.charCodeAt(0));
    return new Response(body,{headers:{'content-type':types[name.split('.').at(-1)],'cache-control':'public, max-age=0, must-revalidate','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'self'"}});
  }
};

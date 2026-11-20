const assets=/*__ASSETS__*/ {};
const types={html:"text/html",css:"text/css",js:"text/javascript",txt:"text/plain"};
export default {fetch(request){
 const head=request.method==="HEAD";
 if(!head&&request.method!=="GET")return new Response(null,{status:405,headers:{Allow:"GET, HEAD"}});
 const path=new URL(request.url).pathname;
 if(path==="/healthz")return new Response(head?null:JSON.stringify({app:"make-a-snow-globe",chambers:[1,3,6],exports:["png","json","maker-sheet"]}),{headers:{"content-type":"application/json"}});
 const name=path==="/"?"index.html":path.slice(1);
 if(!Object.hasOwn(assets,name))return new Response(head?null:"Not found",{status:404});
 return new Response(head?null:assets[name],{headers:{"content-type":types[name.split(".").at(-1)]+"; charset=utf-8","cache-control":"no-cache","x-content-type-options":"nosniff","content-security-policy":"default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"}});
}};

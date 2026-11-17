import assets from "./asset-bundle.mjs";

const types={html:"text/html; charset=utf-8",css:"text/css; charset=utf-8",mjs:"text/javascript; charset=utf-8",
  js:"text/javascript; charset=utf-8",json:"application/json; charset=utf-8",
  webmanifest:"application/manifest+json; charset=utf-8",svg:"image/svg+xml",md:"text/plain; charset=utf-8"};
const headers={
  "x-content-type-options":"nosniff","referrer-policy":"no-referrer",
  "content-security-policy":"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'none'; worker-src 'self'",
};
export default {
  async fetch(request){
    if(!["GET","HEAD"].includes(request.method)) return new Response("Method not allowed",{status:405,headers:{...headers,allow:"GET, HEAD"}});
    const {pathname}=new URL(request.url);
    if(pathname==="/docs/record/index.html") return Response.redirect("https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/docs/record/",302);
    if(pathname==="/health"){
      return new Response(request.method==="HEAD"?null:JSON.stringify({ok:true,app:"tabor-tracker-ball",release:"1.1.1",games:13}),
        {headers:{...headers,"content-type":types.json,"cache-control":"no-store"}});
    }
    const name=pathname==="/"?"index.html":pathname.slice(1);
    if(!Object.hasOwn(assets,name)) return new Response(request.method==="HEAD"?null:"Page not found",{status:404,headers});
    const type=types[name.split(".").at(-1)]??"application/octet-stream";
    const extra=name==="sw.js"?{"service-worker-allowed":"/"}:{};
    return new Response(request.method==="HEAD"?null:assets[name],{headers:{...headers,...extra,
      "content-type":type,"cache-control":"no-cache"}});
  },
};

const types={html:"text/html; charset=utf-8",mjs:"text/javascript; charset=utf-8",css:"text/css; charset=utf-8",json:"application/json; charset=utf-8",webp:"image/webp"};
const sourceAliases={
  "/api/releases":entry+"world/release-ledger.json",
  "/api/destinations":entry+"world/destinations.json",
  "/app-factory/nathan-ai/anatomy/cosmic-body/atlas.json":entry+"world/cosmic-body.json",
  "/app-factory/one/mespark-memory-matrix/worlds-atlas.json":entry+"world/worlds-atlas.json",
};
export default {
  fetch(request,env){
    const url=new URL(request.url),head=request.method==="HEAD";
    if(request.method!=="GET"&&!head)return new Response(null,{status:405,headers:{Allow:"GET, HEAD"}});
    if(url.pathname==="/docs/record/index.html")
      return Response.redirect("https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/docs/record/index.html",302);
    if(url.pathname==="/api/health"){
      const headers={"Content-Type":types.json,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
      return new Response(head?null:JSON.stringify({status:"ok",...releaseInfo}),{headers});
    }
    if(url.pathname==="/")return new Response(null,{status:302,headers:{Location:entry+url.search,"Cache-Control":"no-store"}});
    if(url.pathname==="/world"||url.pathname==="/world/"||url.pathname===entry+"world")
      return new Response(null,{status:302,headers:{Location:entry+"world/"+url.search,"Cache-Control":"no-store"}});
    const library=entry+"library/";
    if(url.pathname==="/library"||url.pathname===library.slice(0,-1))
      return new Response(null,{status:302,headers:{Location:"/library/"+url.search,"Cache-Control":"no-store"}});
    const pathName=url.pathname.startsWith("/library/")?library+url.pathname.slice("/library/".length):url.pathname;
    if(pathName.startsWith(library)){
      const endpoint=pathName.slice(library.length);
      if(endpoint==="api/connections"||/^api\/collections\/(worlds|cosmic)$/.test(endpoint)){
        const headers={"Content-Type":types.json,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
        if(url.search)return new Response(head?null:JSON.stringify({error:"Unknown route"}),{status:404,headers});
        if(!env?.LIBRARY_DATA)return new Response(head?null:JSON.stringify({error:"Data connection unavailable"}),{status:503,headers});
        return env.LIBRARY_DATA.fetch("https://library-data.internal/"+endpoint.slice(4),{method:request.method})
          .catch(()=>new Response(head?null:JSON.stringify({error:"Data connection unavailable"}),{status:503,headers}));
      }
      if(endpoint==="catalog.json"||endpoint.startsWith("api/"))return catalogResponse(catalog,endpoint,url,head);
    }
    const path=sourceAliases[pathName] ??
      ([entry,entry+"world/",library].includes(pathName)?pathName+"index.html":pathName);
    if(!Object.hasOwn(files,path))return new Response(head?null:"Not found",{status:404});
    const headers={"Content-Type":types[path.split(".").pop()],"Cache-Control":"no-cache","X-Content-Type-Options":"nosniff",
      "Referrer-Policy":"no-referrer","Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"};
    if(head)return new Response(null,{headers});
    const asset=files[path];
    if(typeof asset==="string")return new Response(asset,{headers});
    const bytes=Uint8Array.from(atob(asset.base64??asset[0]),c=>c.charCodeAt(0));
    if(asset.base64)return new Response(bytes,{headers});
    const body=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(body,{headers});
  }
};

const types={html:"text/html; charset=utf-8",mjs:"text/javascript; charset=utf-8",css:"text/css; charset=utf-8",json:"application/json; charset=utf-8",webp:"image/webp"};
const sourceAliases={
  "/app-factory/nathan-ai/anatomy/cosmic-body/atlas.json":entry+"world/cosmic-body.json",
  "/app-factory/one/mespark-memory-matrix/worlds-atlas.json":entry+"world/worlds-atlas.json",
};
export default {
  fetch(request){
    const url=new URL(request.url),head=request.method==="HEAD";
    if(request.method!=="GET"&&!head)return new Response(null,{status:405,headers:{Allow:"GET, HEAD"}});
    if(url.pathname==="/")return new Response(null,{status:302,headers:{Location:entry+url.search,"Cache-Control":"no-store"}});
    if(url.pathname==="/world"||url.pathname==="/world/"||url.pathname===entry+"world")
      return new Response(null,{status:302,headers:{Location:entry+"world/"+url.search,"Cache-Control":"no-store"}});
    const library=entry+"library/";
    if(url.pathname==="/library"||url.pathname===library.slice(0,-1))
      return new Response(null,{status:302,headers:{Location:"/library/"+url.search,"Cache-Control":"no-store"}});
    const pathName=url.pathname.startsWith("/library/")?library+url.pathname.slice("/library/".length):url.pathname;
    if(pathName.startsWith(library)){
      const endpoint=pathName.slice(library.length);
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
    const bytes=Uint8Array.from(atob(asset[0]),c=>c.charCodeAt(0));
    if(asset[1]==="raw")return new Response(bytes,{headers});
    const body=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(body,{headers});
  }
};

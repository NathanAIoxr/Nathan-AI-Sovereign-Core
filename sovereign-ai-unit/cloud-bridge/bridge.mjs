import original from "../../tabor-world/true-cloud-computing/src/index.js";
const destination="https://sovereign-ai-unit.nathantaboract.workers.dev";
const publicRoutes=new Set(["/platform/status","/platform/benchmarks"]);
export default {
  async fetch(request,env,ctx) {
    const url = new URL(request.url);
    const path=url.pathname;
    if ((path==="/compute-platform"||path==="/compute-platform/") && request.method==="GET") {
      return Response.redirect(destination+"/platform",302);
    }
    if (path.startsWith("/compute-platform/")) {
      const suffix=path.slice("/compute-platform".length);
      if (!["/status","/benchmarks","/jobs","/objects"].includes(suffix) && !/^\/jobs\/[0-9a-f-]{36}(\/artifact)?$/.test(suffix)) {
        return Response.json({error:"Unknown compute platform route"},{status:404});
      }
      const upstream="/platform"+suffix;
      const headers=new Headers();
      if (!publicRoutes.has(upstream)||request.method!=="GET") {
        for(const key of ["authorization","x-sovereign-project","content-type","idempotency-key"]) {
          if (request.headers.has(key)) headers.set(key,request.headers.get(key));
        }
      }
      try { return await env.COMPUTE_PLATFORM.fetch(destination+upstream,{method:request.method,headers,body:request.body}); }
      catch { return Response.json({error:"Compute platform temporarily unavailable"},{status:503,headers:{"cache-control":"no-store"}}); }
    }
    const response=await original.fetch(request,env,ctx);
    if (path==="/" && request.method==="GET" && response.ok && typeof HTMLRewriter==="function") {
      return new HTMLRewriter().on("main", {element(node) {
        node.prepend('<p><a href="/compute-platform">NATHAN AI — NATHAN TABOR 2X+ SOVEREIGN SUPERCOMPUTER · Compute platform and benchmark dashboard</a></p>',{html:true});
      }}).transform(response);
    }
    return response;
  },
  scheduled:original.scheduled
};

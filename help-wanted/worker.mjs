import page from "./index.html";

const PUBLIC = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
};
const SERVICE_PATHS = {
  hive: ["HIVE", "https://hive.internal/api/repair/status"],
  discovery: ["DISCOVERY", "https://discovery.internal/api/queue"],
  verifier: ["VERIFIER", "https://verifier.internal/api/status"]
};

async function read(binding, url) {
  const r = await binding.fetch(url, {signal:AbortSignal.timeout(6500)});
  if (!r.ok) throw Error("Upstream HTTP " + r.status);
  return r.json();
}

async function overview(env) {
  const names = Object.keys(SERVICE_PATHS);
  const results = await Promise.allSettled(names.map(async name => {
    const [binding, url] = SERVICE_PATHS[name];
    return read(env[binding], url);
  }));
  const [hive, discovery, verifier] = results.map(r => r.status === "fulfilled" ? r.value : null);
  const snapshot = discovery?.snapshot;
  return {
    fetchedAt:Date.now(),
    unavailable:names.filter((_, i) => results[i].status === "rejected"),
    handoff:hive?.handoff ?? null,
    discovery:snapshot ? {indexedOpen:snapshot.indexedOpen, coverage:snapshot.coverage} : null,
    sources:(hive?.sources ?? []).map(({id,success_at,error})=>({id,success_at,error})),
    checks:(verifier?.checks ?? []).map(({job_id,job_status,status,reason})=>({job_id,job_status,status,reason}))
  };
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") {
      return Response.json({error:"Use GET"},{status:405,headers:{...PUBLIC,Allow:"GET"}});
    }
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return new Response(page,{headers:{
        ...PUBLIC, "Content-Type":"text/html; charset=utf-8",
        "Content-Security-Policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"
      }});
    }
    if (url.pathname === "/api/overview") return Response.json(await overview(env), {headers:PUBLIC});
    if (url.pathname === "/api/pairs") {
      const kind = url.searchParams.get("kind") ?? "help-wanted";
      const after = url.searchParams.get("after") ?? "";
      if (!["help-wanted","projects"].includes(kind) || after.length > 400) {
        return Response.json({error:"Invalid pair query"},{status:400,headers:PUBLIC});
      }
      const source = new URL("https://hive.internal/api/repair/pairs");
      source.search = new URLSearchParams({kind,after,limit:"24"});
      try {
        return Response.json(await read(env.HIVE, source), {headers:PUBLIC});
      } catch {
        return Response.json({error:"Pair source unavailable"},{status:502,headers:PUBLIC});
      }
    }
    return Response.json({error:"Not found"},{status:404,headers:PUBLIC});
  }
};

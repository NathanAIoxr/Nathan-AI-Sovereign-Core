import { importCatalog, sourceInventory } from "./catalog.js";
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const safe=(s)=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const allowed=(req,env)=>{
 if(!env.COCKPIT_KEY)return false;
 const h=req.headers.get("authorization")||"";
 if(h===`Bearer ${env.COCKPIT_KEY}`)return true;
 if(h.startsWith("Basic ")){try{return atob(h.slice(6))===`cockpit:${env.COCKPIT_KEY}`}catch{return false}}
 return false;
};
const deny=()=>new Response("Authentication required",{status:401,headers:{"www-authenticate":'Basic realm="Nathan AI Cockpit", charset="UTF-8"',"cache-control":"no-store"}});
const record=(db,tier,action,state,payload)=>db.prepare("INSERT INTO cockpit_log(tier,action,state,payload,created_at) VALUES(?,?,?,?,?)").bind(tier,action,state,payload,new Date().toISOString()).run();
function deck(rows,summary){const trs=rows.map(r=>`<tr><td>${r.id}</td><td>${safe(r.tier)}</td><td>${safe(r.action)}</td><td>${r.state}</td><td>${safe(r.payload)}</td><td>${safe(r.created_at)}</td></tr>`).join("");
return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI • Unified Operations Cockpit</title><style>body{background:#0a0c10;color:#e6edf3;font:15px system-ui;margin:0;padding:24px}h1{color:#58a6ff}button,input{background:#161b22;color:#e6edf3;border:1px solid #555;padding:10px;margin:4px}table{border-collapse:collapse;width:100%}td,th{padding:10px;border-bottom:1px solid #30363d;text-align:left}#message{color:#fbbf24}main{overflow-x:auto}</style></head><body><h1>NATHAN AI 🚀 // UNIFIED OPERATIONS COCKPIT</h1><p>MICRO + MACRO // 1 + 1 = 2 // 1 - 1 = 0</p><p>Ledger sources: ${safe(summary.source_tables)} tables. Indexed: ${safe(summary.catalog_items)}. Dispatch namespace binding: ${summary.dispatch_bound ? "PRESENT (count not measured by Worker)" : "MISSING"}.</p><p>A catalog entry or virtual slot is not a deployed Worker. GitHub manifest export is not software installation.</p><p>Sign in with HTTP Basic username: cockpit</p><button onclick="run('/api/import?pages=4')">IMPORT NEXT 400</button><button onclick="run('/api/micro')">RUN MICRO PULSE</button><button onclick="run('/api/macro')">SYNC 25 TO GITHUB</button><button onclick="run('/api/macro-all')">SYNC UP TO 250</button><button onclick="location.reload()">REFRESH</button><p id="message"></p><main><table><thead><tr><th>ID</th><th>TIER</th><th>ACTION</th><th>STATE</th><th>PAYLOAD</th><th>UTC</th></tr></thead><tbody>${trs||'<tr><td colspan="6">NO LOGS</td></tr>'}</tbody></table></main><script>async function run(path){const m=document.getElementById('message');try{const r=await fetch(path,{method:'POST',});const data=await r.json();m.textContent=JSON.stringify(data);if(r.ok)setTimeout(()=>location.reload(),1200)}catch(e){m.textContent=e.message}}</script></body></html>`;}

async function dispatchManifests(env, maxBatches) {
  if (!env.GH_PAT || !env.GH_OWNER || !env.GH_REPO) {
    return { ok: false, error: "GitHub bridge credentials not configured", status: 503 };
  }
  const batches = [];
  const upperBound = Math.max(1, Math.min(10, maxBatches));
  for (let index = 0; index < upperBound; index++) {
    const found = await env.DB.prepare(
      "SELECT uid,name,category,repo_url FROM unified_catalog " +
      "WHERE synced_to_github=0 AND repo_url LIKE 'https://github.com/%' " +
      "AND integration_status IN ('INDEXED','MANIFEST_FAILED') ORDER BY uid LIMIT 25"
    ).all();
    const items = found.results || [];
    if (!items.length) break;
    const dispatchId = crypto.randomUUID();
    const owner = encodeURIComponent(env.GH_OWNER);
    const repo = encodeURIComponent(env.GH_REPO);
    const response = await fetch("https://api.github.com/repos/" + owner + "/" + repo + "/dispatches", {
      method: "POST",
      headers: {
        "authorization": "Bearer " + env.GH_PAT,
        "accept": "application/vnd.github+json",
        "user-agent": "nathan-ai-cockpit",
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        event_type: "catalog_manifest_batch",
        client_payload: { source: "unified-operations-cockpit", dispatch_id: dispatchId, items }
      })
    });
    batches.push({ dispatch_id: dispatchId, count: items.length, github_status: response.status });
    if (!response.ok) {
      await record(env.DB, "MACRO", "GITHUB_DISPATCH_REJECTED", 0, "HTTP " + response.status);
      break;
    }
    const now = new Date().toISOString();
    const update = env.DB.prepare(
      "UPDATE unified_catalog SET integration_status='DISPATCHED', updated_at=? " +
      "WHERE uid=? AND integration_status IN ('INDEXED','MANIFEST_FAILED')"
    );
    await env.DB.batch(items.map(item => update.bind(now, item.uid)));
  }
  const ok = batches.every(b => b.github_status === 204);
  await record(env.DB, "MACRO", "GITHUB_MANIFEST_DISPATCH", ok ? 1 : 0,
    JSON.stringify({ batches: batches.length, accepted_records: batches.reduce((n, b) => n + (b.github_status === 204 ? b.count : 0), 0) }));
  return { ok, batches, status: ok ? 202 : 502, note: "Dispatch accepted, not installed. Await GitHub artifact callback." };
}

export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!allowed(request,env))return deny();
  if(request.method==="GET"&&url.pathname==="/health")return json({ok:true,service:"unified-operations-cockpit"});
  if(request.method==="GET"&&url.pathname==="/api/platforms")return json({
    ok:true, namespace:"nathan-tabor-platforms", binding_present:Boolean(env.PLATFORMS),
    script_count:null, note:"Binding presence is not a live count; inspect namespace through Cloudflare API."
  });
  if(request.method==="GET"&&url.pathname==="/api/sources")return json(await sourceInventory(env));
  if(request.method==="GET"&&url.pathname==="/api/catalog-status"){
    const rows=await env.DB.prepare("SELECT source_db,source_table,COUNT(*) AS rows FROM unified_catalog GROUP BY source_db,source_table ORDER BY source_db,source_table").all();
    const progress=await env.DB.prepare("SELECT source_key,row_offset,complete,updated_at FROM import_cursors ORDER BY source_key").all();
    return json({ok:true,indexed:rows.results||[],progress:progress.results||[]});
  }
  if(request.method==="GET"&&url.pathname.startsWith("/dispatch/")){
    const name=decodeURIComponent(url.pathname.slice("/dispatch/".length));
    if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(name))return json({error:"invalid script name"},400);
    const allowedScripts=new Set((env.ALLOWED_DISPATCH_SCRIPTS||"").split(",").map(x=>x.trim()).filter(Boolean));
    if(!allowedScripts.has(name))return json({error:"script not allowlisted"},403);
    if(!env.PLATFORMS)return json({error:"dispatch namespace not bound"},503);
    const destination=new URL(request.url);
    destination.pathname="/";
    try {return await env.PLATFORMS.get(name).fetch(new Request(destination.toString(),{method:"GET"}));}
    catch(error){return json({error:"dispatch failed",detail:String(error.message||error)},502);}
  }

  if(request.method==="GET"&&url.pathname==="/"){const [rows,catalog,sourceTables]=await Promise.all([env.DB.prepare("SELECT id,tier,action,state,payload,created_at FROM cockpit_log ORDER BY id DESC LIMIT 50").all(),env.DB.prepare("SELECT COUNT(*) AS n FROM unified_catalog").first(),env.DB.prepare("SELECT COUNT(DISTINCT source_db || char(31) || source_table) AS n FROM unified_catalog").first()]);return new Response(deck(rows.results||[],{catalog_items:catalog?.n||0,source_tables:sourceTables?.n||0,dispatch_bound:Boolean(env.PLATFORMS)}),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});}
  if(request.method!=="POST"||!["/api/micro","/api/macro","/api/macro-all","/api/import","/api/clear","/api/callback"].includes(url.pathname))return json({error:"not found"},404);
  if(url.pathname==="/api/callback"){
    let body;try{body=await request.json()}catch{return json({error:"invalid JSON"},400)}
    if(!["success","failure","cancelled","skipped"].includes(body.status)||!Number.isSafeInteger(body.run_id)||body.run_id<1)return json({error:"invalid callback"},400);
    if(body.job==="macro-batch-matrix"){
      await record(env.DB,"MACRO","GITHUB_RESULT",body.status==="success"?1:0,JSON.stringify({run_id:body.run_id,job:body.job,status:body.status}));
      return json({ok:true,recorded:true});
    }
    if(body.job!=="catalog-manifest"||!Array.isArray(body.completed_uids)||body.completed_uids.length>25||!body.completed_uids.every(x=>typeof x==="string"&&x.length<=512))
      return json({error:"invalid manifest callback"},400);
    const uids=[...new Set(body.completed_uids)];
    if(body.status==="success"&&uids.length){
      const now=new Date().toISOString();
      const update=env.DB.prepare("UPDATE unified_catalog SET integration_status='MANIFEST_EXPORTED',synced_to_github=1,updated_at=? WHERE uid=? AND integration_status='DISPATCHED'");
      await env.DB.batch(uids.map(uid=>update.bind(now,uid)));
    } else if(body.status!=="success"&&uids.length){
      const update=env.DB.prepare("UPDATE unified_catalog SET integration_status='MANIFEST_FAILED' WHERE uid=? AND integration_status='DISPATCHED'");
      await env.DB.batch(uids.map(uid=>update.bind(uid)));
    }
    await record(env.DB,"MACRO","GITHUB_MANIFEST_RESULT",body.status==="success"?1:0,
      JSON.stringify({run_id:body.run_id,job:body.job,status:body.status,uid_count:uids.length}));
    return json({ok:true,acknowledged:uids.length,note:"Manifest exported; no installation claimed"});
  }
  if(url.pathname==="/api/import"){
    if(url.searchParams.get("reset")==="1")await env.DB.prepare("DELETE FROM import_cursors").run();
    const result=await importCatalog(env,Number(url.searchParams.get("pages")||4));
    await record(env.DB,"MICRO","D1_CATALOG_IMPORT",result.ok?1:0,JSON.stringify({
      processed:result.rows_processed,done:result.sources_completed,total:result.sources_discovered,errors:result.errors
    }));
    return json(result,result.ok?200:207);
  }
  if(url.pathname==="/api/micro"){
    await record(env.DB,"MICRO","EDGE_PULSE",1,"Pulse logged; not a completed fleet batch");
    return json({ok:true,tier:"MICRO",action:"EDGE_PULSE"});
  }
  if(url.pathname==="/api/clear"){
    await record(env.DB,"CONTROL","RESET_REQUEST",0,"Logical zero recorded; all catalog records preserved");
    return json({ok:true,state:0,message:"Logical zero recorded; audit and catalog preserved"});
  }
  const result=await dispatchManifests(env,url.pathname==="/api/macro-all"?10:1);
  return json(result,result.status);
 },
 async scheduled(controller,env){
  const now=new Date();
  if(now.getUTCHours()===0 && now.getUTCMinutes()===0)await env.DB.prepare("DELETE FROM import_cursors").run();
  await record(env.DB,"MICRO","CRON_HEARTBEAT",1,`Cron ${controller.cron}; import run follows`);
  try { const result=await importCatalog(env,4); await record(env.DB,"MICRO","CRON_IMPORT",result.ok?1:0,JSON.stringify({rows:result.rows_processed,completed:result.sources_completed,total:result.sources_discovered,errors:result.errors})); }
  catch(error){ await record(env.DB,"MICRO","CRON_IMPORT_ERROR",0,String(error.message||error)); }
  await env.DB.prepare("DELETE FROM cockpit_log WHERE id NOT IN (SELECT id FROM cockpit_log ORDER BY id DESC LIMIT 500)").run();
 }
};

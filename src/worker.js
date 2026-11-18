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
function deck(rows){const trs=rows.map(r=>`<tr><td>${r.id}</td><td>${safe(r.tier)}</td><td>${safe(r.action)}</td><td>${r.state}</td><td>${safe(r.payload)}</td><td>${safe(r.created_at)}</td></tr>`).join("");
return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI • Unified Operations Cockpit</title><style>body{background:#0a0c10;color:#e6edf3;font:15px system-ui;margin:0;padding:24px}h1{color:#58a6ff}button,input{background:#161b22;color:#e6edf3;border:1px solid #555;padding:10px;margin:4px}table{border-collapse:collapse;width:100%}td,th{padding:10px;border-bottom:1px solid #30363d;text-align:left}#message{color:#fbbf24}main{overflow-x:auto}</style></head><body><h1>NATHAN AI 🚀 // UNIFIED OPERATIONS COCKPIT</h1><p>MICRO + MACRO // 1 + 1 = 2 // 1 - 1 = 0</p><p>Only verified ledger entries are shown. A pulse is not a completed batch.</p><p>Sign in with HTTP Basic username: cockpit</p><button onclick="run('/api/micro')">RUN MICRO PULSE</button><button onclick="run('/api/macro')">DISPATCH GITHUB</button><button onclick="location.reload()">REFRESH</button><p id="message"></p><main><table><thead><tr><th>ID</th><th>TIER</th><th>ACTION</th><th>STATE</th><th>PAYLOAD</th><th>UTC</th></tr></thead><tbody>${trs||'<tr><td colspan="6">NO LOGS</td></tr>'}</tbody></table></main><script>async function run(path){const m=document.getElementById('message');try{const r=await fetch(path,{method:'POST',});const data=await r.json();m.textContent=JSON.stringify(data);if(r.ok)setTimeout(()=>location.reload(),1200)}catch(e){m.textContent=e.message}}</script></body></html>`;}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!allowed(request,env))return deny();
  if(request.method==="GET"&&url.pathname==="/health")return json({ok:true,service:"unified-operations-cockpit"});
  if(request.method==="GET"&&url.pathname==="/"){const rows=await env.DB.prepare("SELECT id,tier,action,state,payload,created_at FROM cockpit_log ORDER BY id DESC LIMIT 50").all();return new Response(deck(rows.results||[]),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","content-security-policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});}
  if(request.method!=="POST"||!["/api/micro","/api/macro","/api/clear","/api/callback"].includes(url.pathname))return json({error:"not found"},404);
  if(url.pathname==="/api/callback"){
   let body;try{body=await request.json()}catch{return json({error:"invalid JSON"},400)}
   if(!["success","failure","cancelled","skipped"].includes(body.status)||body.job!=="macro-batch-matrix"||!Number.isSafeInteger(body.run_id)||body.run_id<1)return json({error:"invalid callback"},400);
   await record(env.DB,"MACRO","GITHUB_RESULT",body.status==="success"?1:0,JSON.stringify({run_id:body.run_id,job:body.job,status:body.status}));
   return json({ok:true,recorded:true});
  }
  if(url.pathname==="/api/micro"){await record(env.DB,"MICRO","EDGE_PULSE",1,"Pulse logged; not a completed fleet batch");return json({ok:true,tier:"MICRO",action:"EDGE_PULSE"});}
  if(url.pathname==="/api/clear"){await record(env.DB,"CONTROL","RESET_REQUEST",0,"Logical reset recorded; retention capped at 500 rows");return json({ok:true,state:0,message:"Logical zero recorded; historical audit retained"});}
  if(!env.GH_PAT||!env.GH_OWNER||!env.GH_REPO)return json({error:"GitHub bridge credentials not configured"},503);
  const owner=encodeURIComponent(env.GH_OWNER),repo=encodeURIComponent(env.GH_REPO);
  const res=await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`,{method:"POST",headers:{"authorization":`Bearer ${env.GH_PAT}`,"accept":"application/vnd.github+json","user-agent":"nathan-ai-cockpit","x-github-api-version":"2022-11-28","content-type":"application/json"},body:JSON.stringify({event_type:"macro_cockpit_trigger",client_payload:{source:"unified-operations-cockpit",triggered_at:new Date().toISOString()}})});
  await record(env.DB,"MACRO","GITHUB_DISPATCH",res.ok?1:0,`GitHub API HTTP ${res.status}; workflow execution unverified`);
  return json({ok:res.ok,github_status:res.status,dispatch_accepted:res.ok},res.ok?202:502);
 },
 async scheduled(controller,env){
  await record(env.DB,"MICRO","CRON_HEARTBEAT",1,`Cron ${controller.cron}; pulse only`);
  await env.DB.prepare("DELETE FROM cockpit_log WHERE id NOT IN (SELECT id FROM cockpit_log ORDER BY id DESC LIMIT 500)").run();
 }
};

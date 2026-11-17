const q={
  "summary": "SELECT (SELECT count(*) FROM hive_help_wanted_pairs) AS help_wanted,\n (SELECT count(*) FROM hive_owned_project_pairs WHERE visibility='public') AS projects",
  "due": "SELECT id,probe_url FROM hive_owned_projects WHERE probe_url IS NOT NULL\n AND (probe_at IS NULL OR probe_at < unixepoch() - 3600) ORDER BY probe_at,id LIMIT 5",
  "update": "UPDATE hive_owned_projects SET probe_at=?,probe_code=?,probe_status=?\n WHERE id=? AND probe_url=? AND (probe_at IS NULL OR probe_at < ?)"
};
function pairIds(id) {
  return {bee:"bee:"+id,ant:"ant:"+id};
}

function asPair(row,kind) {
  const project=kind==="projects";
  return {id:row.id,title:row.title,url:row.url,provider:row.provider,scope:project?"OWNED":row.scope,
    workerBee:{id:row.bee_id,status:project?(row.probe_status??"ASSIGNED"):row.bee_status,
      evidenceAt:project?row.probe_at:row.updated_at,...(project?{httpStatus:row.probe_code}:{})},
    antBot:{id:row.ant_id,status:project?"REGISTERED":(row.ant_seen?"INDEXED":"ASSIGNED"),
      evidenceAt:project?row.discovered_at:row.ant_seen}};
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
}

function safeLink(value) {
  try {const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password?url.href:null;}
  catch {return null;}
}

const pagesOrigin = "https://nathanaioxr.github.io";
const jsonHeaders = headers => ({...headers, "Access-Control-Allow-Origin": pagesOrigin});

function listQuery(kind, filters) {
  const projects = kind === "projects";
  const table = projects ? "hive_owned_project_pairs" : "hive_help_wanted_pairs";
  const status = projects ? "COALESCE(probe_status,'ASSIGNED')" : "bee_status";
  const conditions = projects ? ["visibility='public'"] : [];
  const args = [];
  if (filters.provider) { conditions.push("provider=?"); args.push(filters.provider); }
  if (filters.scope && !projects) { conditions.push("scope=?"); args.push(filters.scope); }
  if (filters.state) { conditions.push(status+"=?"); args.push(filters.state); }
  if (filters.q) {
    conditions.push("(instr(lower(title),lower(?))>0 OR instr(lower(id),lower(?))>0)");
    args.push(filters.q,filters.q);
  }
  const where = conditions.length ? " WHERE "+conditions.join(" AND ") : "";
  return {
    filtered: args.length > 0,
    count: "SELECT count(*) AS matches FROM "+table+where,
    sql: "SELECT * FROM "+table+" WHERE "+[...conditions,"id>?"].join(" AND ")+" ORDER BY id LIMIT ?",
    args
  };
}

async function readCoverage(db) {
  const [sources,issues,projects] = await db.batch([
    db.prepare("SELECT id,items,checked_at,success_at,covered_through,error IS NOT NULL AS failed FROM repair_sources ORDER BY id"),
    db.prepare("SELECT provider,scope,bee_status AS status,count(*) AS count FROM hive_help_wanted_pairs GROUP BY provider,scope,bee_status ORDER BY provider,scope,bee_status"),
    db.prepare("SELECT provider,COALESCE(probe_status,'ASSIGNED') AS status,count(*) AS count,MAX(probe_at) AS latest_check FROM hive_owned_project_pairs WHERE visibility='public' GROUP BY provider,probe_status ORDER BY provider,probe_status")
  ]);
  return {sources:sources.results,issues:issues.results,projects:projects.results};
}

async function serveCoverage(request,db,headers) {
  if (request.method !== "GET") return new Response(null,{status:405,headers:{...headers,Allow:"GET"}});
  return Response.json(await readCoverage(db),{headers:jsonHeaders(headers)});
}

function utc(timestamp) {
  return Number.isSafeInteger(timestamp) && timestamp > 0
    ? new Date(timestamp*1000).toISOString().slice(0,16).replace("T"," ")+" UTC"
    : "Pending";
}

function pageHTML(kind,data) {
  const counts=data.coverage;
  const filters=Object.entries(data.filters);
  const param=new URLSearchParams({kind});
  for (const [key,value] of filters) if(value) param.set(key,value);
  const json=escapeHTML("/api/repair/pairs?"+param);
  const items=data.items.map(row=>{
    const name=escapeHTML(row.title);
    const url=safeLink(row.url);
    const http=row.workerBee.httpStatus ? " (HTTP "+escapeHTML(row.workerBee.httpStatus)+")" : "";
    return "<li>"+(url?'<a href="'+escapeHTML(url)+'">'+name+"</a>":name)+
      "<small>"+escapeHTML(row.provider)+" · "+escapeHTML(row.scope)+"</small>"+
      "<small>Worker Bee · "+escapeHTML(row.workerBee.status)+http+" · "+utc(row.workerBee.evidenceAt)+
      "<br>Ant Bot · "+escapeHTML(row.antBot.status)+" · "+utc(row.antBot.evidenceAt)+"</small>"+
      "<details><summary>Assignment IDs</summary><code>"+escapeHTML(row.workerBee.id)+"</code><br><code>"+escapeHTML(row.antBot.id)+"</code></details></li>";
  }).join("");
  if (data.nextAfter) param.set("after",data.nextAfter);
  const next=data.nextAfter?'<p><a href="/pairs?'+escapeHTML(param)+'">Next page</a></p>':"";
  const controls='<form method="get" action="/pairs"><input type="hidden" name="kind" value="'+kind+'">'+
    filters.filter(([key])=>kind!=="projects" || key!=="scope").map(([key,value])=>{
      const label={q:"Title or ID",provider:"Provider",scope:"Lane",state:"Bee status"}[key];
      return '<label>'+label+'<input name="'+key+'" value="'+escapeHTML(value)+'"></label>';
    }).join("")+'<button>Filter</button> <a href="/pairs?kind='+kind+'">Reset</a></form>';
  const groups=data.sourceCoverage;
  const sourceRows=groups.sources.map(source=>'<tr><td>'+escapeHTML(source.id)+'</td><td>'+
    (source.failed?"Check failed":"Checked")+'</td><td>'+source.items+'</td><td>'+utc(source.success_at)+'</td><td>'+utc(source.covered_through)+'</td></tr>').join("");
  const totals=[...groups.issues,...groups.projects].map(row=>'<tr><td>'+escapeHTML(row.provider)+'</td><td>'+
    escapeHTML(row.scope??"OWNED")+'</td><td>'+escapeHTML(row.status)+'</td><td>'+row.count+'</td></tr>').join("");
  const table=(labels,rows)=>'<div class="table"><table><thead><tr>'+labels.map(label=>'<th scope="col">'+label+'</th>').join("")+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Worker Bees and Ant Bots · Nathan AI</title><style>:root{color-scheme:dark;background:#101822;color:#f3f7fb}body{font:1rem/1.6 system-ui,sans-serif;max-width:70rem;margin:2rem auto;padding:0 1.25rem}a{color:#a5dcff}li{padding:.55rem 0;border-bottom:1px solid #394551;overflow-wrap:anywhere}small{display:block;color:#c4ced8}nav{margin:1rem 0}form{display:flex;flex-wrap:wrap;align-items:end;gap:.6rem 1rem}label,input{display:block}input,button{font:inherit;padding:.25rem .4rem}summary{cursor:pointer}.table{overflow-x:auto}table{border-collapse:collapse;width:100%;text-align:left}td,th{padding:.35rem .6rem;border-bottom:1px solid #394551;min-width:7rem}section{margin:2rem 0}</style>'+
    '<main><a href="/">Nathan AI Sovereign Hive</a><h1>Worker Bees and Ant Bots</h1><p>By Nathan Tabor and Nathan AI</p>'+
    "<p>Worker Bees track repair and verification. Ant Bots track source evidence and assignment history.</p>"+
    '<nav><a href="/pairs?kind=help-wanted">Help Wanted ('+counts.helpWanted+')</a> · <a href="/pairs?kind=projects">Owned projects ('+counts.publicProjects+')</a> · '+
    '<a href="'+json+'">JSON</a> · <a href="#coverage">Source coverage</a> · <a href="'+pagesOrigin+'/Nathan-AI-Sovereign-Core/hive/">GitHub Pages</a></nav>'+
    '<section aria-label="Assignments">'+controls+'<p>'+data.matched.toLocaleString("en-US")+' matching records</p><ol>'+items+"</ol>"+next+"</section>"+
    '<section id="coverage"><h2>Source coverage</h2><p>Counts reflect the Hive ledger. The coverage watermark belongs to each source scan.</p>'+
    table(["Source","Last outcome","Last batch","Last success","Covered through"],sourceRows)+
    '<h2>Assignments by provider and state</h2>'+table(["Provider","Lane","Bee status","Records"],totals)+
    '<p><a href="/api/repair/coverage">Coverage JSON</a> · <a href="/api/repair/status">Repair status and check receipts</a></p></section></main></html>';
}

async function servePairs(request,db,headers) {
  if(request.method!=="GET") return new Response(null,{status:405,headers:{...headers,Allow:"GET"}});
  const url=new URL(request.url);
  const kind=url.searchParams.get("kind")??"help-wanted";
  const after=url.searchParams.get("after")??"";
  const limit=Number(url.searchParams.get("limit")??"30");
  const filters=Object.fromEntries(["q","provider","scope","state"].map(key=>[key,(url.searchParams.get(key)??"").trim()]));
  if(!["help-wanted","projects"].includes(kind)||after.length>400||!Number.isInteger(limit)||limit<1||limit>100||
    filters.q.length>160||!/^[-a-z0-9]{0,40}$/.test(filters.provider)||
    !["","GLOBAL","INTERNAL"].includes(filters.scope)||!/^[_A-Z0-9]{0,40}$/.test(filters.state))
    return Response.json({error:"Invalid pair query"},{status:400,headers:jsonHeaders(headers)});
  const query=listQuery(kind,filters);
  const html=url.pathname==="/pairs";
  const [rows,counts,filtered,sourceCoverage]=await Promise.all([
    db.prepare(query.sql).bind(...query.args,after,limit+1).all(),db.prepare(q.summary).first(),
    query.filtered ? db.prepare(query.count).bind(...query.args).first() : null,
    html ? readCoverage(db) : null
  ]);
  const entries=rows.results.slice(0,limit);
  const data={kind,coverage:{helpWanted:counts.help_wanted,publicProjects:counts.projects},
    filters,matched:filtered?.matches??(kind==="projects"?counts.projects:counts.help_wanted),sourceCoverage,
    items:entries.map(row=>asPair(row,kind)),nextAfter:rows.results.length>limit?entries.at(-1).id:null};
  if(!html)return Response.json(data,{headers:jsonHeaders(headers)});
  return new Response(pageHTML(kind,data),{headers:{...headers,"Content-Type":"text/html; charset=utf-8"}});
}

async function probeProjects(db,read=fetch) {
  const entries=(await db.prepare(q.due).all()).results;
  await Promise.all(entries.map(async row=>{
    const url=safeLink(row.probe_url);
    if(!url||!/^https:\/\/[a-z0-9-]+\.nathantaboract\.workers\.dev(?:\/|$)/.test(url))return;
    const at=Math.floor(Date.now()/1000);
    let code=null;
    let state="HTTP_UNAVAILABLE";
    try {
      const res=await read(url,{method:"GET",redirect:"manual",signal:AbortSignal.timeout(5000)});
      code=res.status;
      state=res.ok?"HTTP_OK":(code>=300&&code<400?"HTTP_REDIRECT":(code===401||code===403?"HTTP_RESTRICTED":"HTTP_ERROR"));
      if(res.body)await res.body.cancel().catch(()=>{});
    }catch{}
    await db.prepare(q.update).bind(at,code,state,row.id,row.probe_url,at).run();
  }));
  return entries.length;
}

export { asPair, pairIds, probeProjects, serveCoverage, servePairs };

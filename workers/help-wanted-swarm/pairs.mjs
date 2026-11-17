const q={
  "help": "SELECT * FROM hive_help_wanted_pairs WHERE id>? ORDER BY id LIMIT ?",
  "projects": "SELECT * FROM hive_owned_project_pairs WHERE visibility='public' AND id>? ORDER BY id LIMIT ?",
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

function pageHTML(kind,data) {
  const counts=data.coverage;
  const items=data.items.map(row=>{
    const name=escapeHTML(row.title);
    const url=safeLink(row.url);
    return "<li>"+(url?'<a href="'+escapeHTML(url)+'">'+name+"</a>":name)+
      "<small>Worker Bee · "+escapeHTML(row.workerBee.status)+"<br>Ant Bot · "+escapeHTML(row.antBot.status)+"</small></li>";
  }).join("");
  const next=data.nextAfter?'<p><a href="/pairs?kind='+kind+'&amp;after='+encodeURIComponent(data.nextAfter)+'">Next page</a></p>':"";
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Worker Bees and Ant Bots · Nathan AI</title><style>:root{color-scheme:dark}body{font:1rem/1.6 system-ui,sans-serif;max-width:54rem;margin:2rem auto;padding:0 1.25rem}a{color:#a5dcff}li{padding:.55rem 0;border-bottom:1px solid #394551}small{display:block;color:#c4ced8}nav{margin:1rem 0}</style>'+
    '<main><a href="/">Nathan AI Sovereign Hive</a><h1>Worker Bees and Ant Bots</h1><p>By Nathan Tabor and Nathan AI</p>'+
    "<p>Worker Bees track repair and verification. Ant Bots track source evidence and assignment history.</p>"+
    '<nav><a href="/pairs?kind=help-wanted">Help Wanted ('+counts.helpWanted+')</a> · <a href="/pairs?kind=projects">Owned projects ('+counts.publicProjects+')</a> · '+
    '<a href="/api/repair/pairs?kind='+kind+'">JSON</a> · <a href="https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/hive/">GitHub Pages</a></nav><ol>'+items+"</ol>"+next+"</main></html>";
}

async function servePairs(request,db,headers) {
  if(request.method!=="GET") return new Response(null,{status:405,headers:{...headers,Allow:"GET"}});
  const url=new URL(request.url);
  const kind=url.searchParams.get("kind")??"help-wanted";
  const after=url.searchParams.get("after")??"";
  const limit=Number(url.searchParams.get("limit")??"30");
  if(!["help-wanted","projects"].includes(kind)||after.length>400||!Number.isInteger(limit)||limit<1||limit>100)
    return Response.json({error:"Invalid pair query"},{status:400,headers});
  const [rows,counts]=await Promise.all([
    db.prepare(kind==="projects"?q.projects:q.help).bind(after,limit+1).all(),db.prepare(q.summary).first()
  ]);
  const entries=rows.results.slice(0,limit);
  const data={kind,coverage:{helpWanted:counts.help_wanted,publicProjects:counts.projects},
    items:entries.map(row=>asPair(row,kind)),nextAfter:rows.results.length>limit?entries.at(-1).id:null};
  if(url.pathname!=="/pairs")return Response.json(data,{headers:{...headers,
    "Access-Control-Allow-Origin":"https://nathanaioxr.github.io"}});
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

export { asPair, pairIds, probeProjects, servePairs };

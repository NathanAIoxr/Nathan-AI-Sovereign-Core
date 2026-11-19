const snapshot = "tabor-sovereign-app-units-20261118-v1";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
const fields = "u.id,u.title,u.kind,u.evidence_stage,u.workstream,u.next_action,u.repository_path,u.package_state,u.package_sha256,u.packaged_at,u.focus,s.id AS shard,s.job_id,COALESCE(q.status,'pending') AS assignment_state,f.state AS feature_state";
const joined = "FROM sovereign_app_unit_v1 u JOIN sovereign_app_unit_shard_v1 s ON s.id=u.shard_id LEFT JOIN build_queue q ON q.id=s.job_id LEFT JOIN sovereign_app_unit_feature_v1 f ON f.unit_id=u.id";
const encode = new TextEncoder();
const unitID=/^app-\d{4}$/;

function reply(body, type, status=200, extra={}) {
  return new Response(body,{status,headers:{...privateHeaders,"Content-Type":type,...extra}});
}
const json=(data,status=200)=>reply(JSON.stringify(data),"application/json; charset=utf-8",status);
async function sha256(text) {
  const data=await crypto.subtle.digest("SHA-256",encode.encode(text));
  return Array.from(new Uint8Array(data),v=>v.toString(16).padStart(2,"0")).join("");
}
function unitPackage(unit) {
  const original=JSON.parse(unit.source_json);
  if (original.id!==unit.id || original.name!==unit.title || !unitID.test(unit.id)) throw Error("Source identity mismatch");
  return {
    schema:1,release:snapshot,id:unit.id,title:unit.title,kind:unit.kind,evidence:unit.evidence_stage,
    original,sourceSha256:unit.source_sha256,repositoryPath:unit.repository_path,workstream:unit.workstream,
    work:{state:"queued",firstMilestone:unit.next_action,requiredReceipt:["source revision or recovered reference","test or verification result","work remaining"]},
    assignment:{worker:"tabor-build-loop",shard:unit.shard,jobId:unit.job_id},
    packageScope:"Independent source and build handoff"
  };
}

export async function runPackages(db, rounds=8) {
  let packaged=0, errors=0;
  for(let step=0;step<rounds;step++){
    const lease=crypto.randomUUID();
    const {results:leased}=await db.prepare(`UPDATE sovereign_app_unit_v1 SET package_state='packaging',lease_id=?,lease_until=unixepoch()+180,
      packages_attempted=packages_attempted+1 WHERE id IN(SELECT id FROM sovereign_app_unit_v1
      WHERE packages_attempted<3 AND (package_state='queued' OR (package_state='packaging' AND lease_until<=unixepoch()))
      ORDER BY id LIMIT 100) RETURNING id`).bind(lease).all();
    if(!leased.length)break;
    const {results:items}=await db.prepare(`SELECT ${fields},u.source_json,u.source_sha256 ${joined} WHERE u.lease_id=? ORDER BY u.id`).bind(lease).all();
    const ready=[];
    const failed=[];
    for(const unit of items){
      try {
        if(await sha256(unit.source_json)!==unit.source_sha256)throw Error("Source checksum mismatch");
        const content=JSON.stringify(unitPackage(unit));
        ready.push({id:unit.id,content,digest:await sha256(content)});
      }catch(err){failed.push({id:unit.id,error:String(err.message).slice(0,140)});}
    }
    if(ready.length){
      const result=await db.prepare(`WITH out AS (SELECT value->>'id' AS id,value->>'content' AS content,value->>'digest' AS digest FROM json_each(?))
        UPDATE sovereign_app_unit_v1 AS u SET package_json=out.content,package_sha256=out.digest,package_state='packaged',
        packaged_at=unixepoch(),lease_id=NULL,lease_until=NULL,package_error=NULL FROM out WHERE u.id=out.id AND u.lease_id=? AND u.package_state='packaging'`).bind(JSON.stringify(ready),lease).run();
      packaged+=result.meta?.changes??0;
    }
    if(failed.length){
      const result=await db.prepare(`WITH out AS (SELECT value->>'id' AS id,value->>'error' AS error FROM json_each(?))
        UPDATE sovereign_app_unit_v1 AS u SET package_state='error',package_error=out.error,lease_id=NULL,lease_until=NULL
        FROM out WHERE u.id=out.id AND u.lease_id=? AND u.package_state='packaging'`).bind(JSON.stringify(failed),lease).run();
      errors+=result.meta?.changes??0;
    }
  }
  await db.prepare(`UPDATE sovereign_app_unit_v1 SET package_state='error',package_error='Final packaging lease expired',lease_id=NULL,lease_until=NULL
    WHERE package_state='packaging' AND packages_attempted>=3 AND lease_until<=unixepoch()`).run();
  return {packaged,errors};
}

function escape(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);}
function frame(title,body) {
  return reply(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title><style>
body{margin:auto;max-width:66rem;padding:1.2rem;font:16px/1.55 system-ui,sans-serif;color:#20352c;background:#f8f6ef}h1{font:clamp(2rem,7vw,4rem)/1.08 Georgia,serif}h2{font:1.5rem Georgia,serif}a{color:#205a44}label{font-weight:600}input,button,select{font:inherit;padding:.55rem;border:1px solid #7c8b81;border-radius:.33rem;background:white;color:inherit}input{width:min(75%,27rem)}.record{display:block;margin:.6rem 0;border:1px solid #d5dbd2;border-radius:.4rem;background:white;padding:.65rem}.sub{color:#46594e}.crumb{margin:.65rem 0}.nav{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem}dt{font-weight:650}dd{margin:.2rem 0 .7rem;overflow-wrap:anywhere}
</style><main>${body}</main></html>`,"text/html; charset=utf-8",200,{"Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"});
}
function checkLink(val){
  try { const u=new URL(val);return /^https?:$/.test(u.protocol)?u.href:""; } catch {return "";}
}
async function report(db){
  const r=await db.batch([
    db.prepare("SELECT COUNT(*) AS total,COUNT(package_sha256) AS packaged,SUM(package_state='error') AS errors FROM sovereign_app_unit_v1"),
    db.prepare("SELECT q.status,COUNT(*) AS shards,SUM(s.item_count) AS units FROM sovereign_app_unit_shard_v1 s LEFT JOIN build_queue q ON q.id=s.job_id GROUP BY q.status ORDER BY q.status"),
    db.prepare("SELECT state,COUNT(*) AS total FROM sovereign_app_unit_feature_v1 GROUP BY state ORDER BY state")
  ]);
  return {release:snapshot,...r[0].results[0],assignments:r[1].results,featureWork:r[2].results};
}
async function listing(db,url){
  const q=(url.searchParams.get("q")??"").trim().slice(0,120);
  const offset=Math.min(1300,Math.max(0,Number(url.searchParams.get("offset"))||0));
  const pattern="%"+q.replace(/[\\%_]/g,c=>"\\"+c)+"%";
  const res=await db.batch([
    db.prepare("SELECT COUNT(*) AS total FROM sovereign_app_unit_v1 WHERE title LIKE ? ESCAPE '\\' OR id LIKE ? ESCAPE '\\'").bind(pattern,pattern),
    db.prepare(`SELECT ${fields} ${joined} WHERE u.title LIKE ? ESCAPE '\\' OR u.id LIKE ? ESCAPE '\\' ORDER BY u.title,u.id LIMIT 45 OFFSET ?`).bind(pattern,pattern,offset)
  ]);
  return {results:res[1].results,total:res[0].results[0].total,q,offset};
}
async function home(db,url){
  const [list,s]=await Promise.all([listing(db,url),report(db)]);
  const items=list.results.map(x=>`<div class="record"><a href="/unit/${x.id}">${escape(x.title)}</a> <span class="sub">${x.id} · ${escape(x.kind)}</span><div class="sub">${escape(x.evidence_stage)} · ${escape(x.package_state)} · ${escape(x.workstream)}</div></div>`).join("");
  const link=(n)=>"/?q="+encodeURIComponent(list.q)+"&offset="+n;
  const pager=`<div class="nav">${list.offset>0?`<a href="${link(Math.max(0,list.offset-45))}">Previous</a>`:""}${list.offset+45<list.total?`<a href="${link(list.offset+45)}">Next</a>`:""}</div>`;
  return frame("Sovereign App Units",`<h1>Sovereign App Units</h1><p>${s.total} units · ${s.packaged} build handoffs packaged</p>
<form method="get"><label for="q">Find an app or unit ID</label><br><input id="q" name="q" value="${escape(list.q)}"><button>Search</button></form>
<div class="nav"><a href="/api/status">Build status JSON</a><a href="/archive-key">Download owner archive key</a></div><h2>${list.total} matching units</h2>${items}${pager}`);
}
async function detail(db,id,isJSON=false){
  const x=await db.prepare(`SELECT ${fields},u.source_json,u.source_sha256,u.package_json ${joined} WHERE u.id=?`).bind(id).first();
  if(!x)return json({error:"Unit missing"},404);
  if(isJSON){if(!x.package_json)return json({id,state:x.package_state},202);return reply(x.package_json,"application/json; charset=utf-8",200,{"X-Package-SHA256":x.package_sha256});}
  const source=JSON.parse(x.source_json);
  const ss=source.sources.map(s=>{const link=checkLink(s.url);return `<li>${link?`<a rel="noreferrer" href="${escape(link)}">${escape(s.source)}</a>`:escape(s.source)} · ${escape(s.stage)} ${escape(s.original_status)}</li>`;}).join("");
  const path="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/build/sovereign-app-units-20261118/"+x.repository_path;
  return frame(x.title,`<p class="crumb"><a href="/">Sovereign App Units</a> / ${id}</p><h1>${escape(x.title)}</h1>
<dl><dt>Evidence</dt><dd>${escape(x.evidence_stage)}</dd><dt>Package</dt><dd>${escape(x.package_state)} ${escape(x.package_sha256)}</dd>
<dt>Assigned Worker</dt><dd>tabor-build-loop · ${escape(x.shard)} · ${escape(x.assignment_state)}</dd>
<dt>Feature work</dt><dd>${escape(x.feature_state)} · ${escape(x.next_action)}</dd></dl>
<div class="nav"><a href="/unit/${id}/package.json">Build handoff JSON</a><a rel="noreferrer" href="${path}">GitHub manifest</a></div><h2>Source evidence</h2><ul>${ss}</ul>`);
}
export default {
 async scheduled(_event,env,ctx){ctx.waitUntil(runPackages(env.DB));},
 async fetch(request,env,ctx){
   if(request.method!=="GET"&&request.method!=="HEAD")return json({error:"Method unavailable"},405);
   const url=new URL(request.url);
   let identity;
   try { if(ctx.access&&ctx.access.aud===env.OWNER_AUDIENCE)identity=await ctx.access.getIdentity(); }
   catch{return json({error:"Owner identity unavailable"},503);}
   if(!identity?.email||identity.email.toLowerCase()!==env.OWNER_EMAIL?.toLowerCase())return json({error:"Owner sign-in required"},403);
   if(url.pathname==="/")return home(env.DB,url);
   if(url.pathname==="/api/status")return json(await report(env.DB));
   if(url.pathname==="/api/units")return json(await listing(env.DB,url));
   if(url.pathname==="/archive-key"&&env.ARCHIVE_KEY)return reply(env.ARCHIVE_KEY+"\n","text/plain; charset=utf-8",200,{"Content-Disposition":'attachment; filename="sovereign-app-units-owner-key.txt"'});
   const m=/^\/unit\/(app-\d{4})(\/package\.json)?$/.exec(url.pathname);
   if(m)return detail(env.DB,m[1],Boolean(m[2]));
   return json({error:"Route missing"},404);
 }
};

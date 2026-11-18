const APPS = new Set(["bibletopia","tabor-world","grapple-it","hook-and-ring","tabor-tracker-ball"]);
const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nathan AI · 1,000-slot virtual fleet index</title>
<style>
:root{color-scheme:dark;font:16px system-ui,-apple-system,BlinkMacSystemFont,sans-serif;background:#091425;color:#e8effa}
*{box-sizing:border-box}body{margin:0;padding:28px max(18px,calc((100vw - 1080px)/2));line-height:1.5}
a{color:#a6caff}h1{font-size:clamp(27px,4vw,44px);margin:.2rem 0}p{color:#bbccdd}
header{border-bottom:1px solid #375073;padding-bottom:20px;margin-bottom:20px}
small{color:#b4c6d8}h2{margin-top:32px}.cards{display:flex;flex-wrap:wrap;gap:10px}
.card{flex:1 1 150px;border:1px solid #36506f;background:#14253a;border-radius:12px;padding:15px}
.card strong{display:block;font-size:24px} .card small{display:block}
form{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:15px 0}label{display:flex;flex-direction:column;gap:5px}
select,button{background:#19324e;color:#fff;border:1px solid #54789b;border-radius:8px;padding:10px;font:inherit}
button{cursor:pointer}button:disabled{opacity:.45;cursor:default}
table{width:100%;border-collapse:collapse;background:#111f32}th,td{text-align:left;padding:10px;border-bottom:1px solid #30425d;overflow-wrap:anywhere}
th{color:#a9c9ee}td{font-size:14px}code{color:#c5e3ff} .scroll{overflow-x:auto;border:1px solid #35506d;border-radius:10px}
#notice{min-height:1.5em}.toolbar{display:flex;gap:14px;align-items:center;justify-content:space-between;margin-top:14px;flex-wrap:wrap}
footer{border-top:1px solid #36506f;margin-top:35px;padding:20px 0;font-size:13px;color:#a7bdd4}
</style></head><body>
<header><small>NATHAN AI 🚀 / CLOUDFARE D1 LIVE METADATA</small><h1>1,000 logical compute slots</h1>
<p>Five existing apps, individually indexed books sets, individually indexed technology sets. These are <strong>logical records</strong>, not 1,000 physical supercomputers or separately deployed runtimes.</p>
<p><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/348">Source indexes and GitHub review</a></p></header>
<section aria-label="Fleet summary"><div class="cards" id="stats"><div class="card">Loading verified registry counts…</div></div></section>
<section><h2>Explore each slot</h2>
<form id="search"><label>Assigned app<select id="app"><option value="">All five apps</option><option value="bibletopia">Bible Topia</option><option value="tabor-world">Tabor World</option><option value="grapple-it">Grapple It</option><option value="hook-and-ring">Hook &amp; Ring</option><option value="tabor-tracker-ball">Tabor Track Baller</option></select></label>
<button type="submit">Filter</button></form><p id="notice" role="status"></p>
<div class="scroll"><table><thead><tr><th>Slot</th><th>App</th><th>Book set</th><th>Technology set</th><th>Runtime</th></tr></thead><tbody id="rows"></tbody></table></div>
<div class="toolbar"><button id="prev" type="button">Previous 25</button><span id="page"></span><button id="next" type="button">Next 25</button></div></section>
<footer>The current metadata does not imply physical hardware, application copies, book copies, or an active dedicated runtime at each slot. Private source bytes remain outside this public viewer.</footer>
<script>
let page=1, total=0;const $=id=>document.getElementById(id);
async function loadStats(){let j=await (await fetch("/api/summary")).json();$("stats").replaceChildren();for(let [label,value] of [["Logical slots",j.slots],["Book sets",j.book_sets],["Technology sets",j.technology_sets],["Existing preserved fleet",j.original_fleet],["Primary apps",j.apps]]){const d=document.createElement("div");d.className="card";const s=document.createElement("strong");s.textContent=Number(value).toLocaleString();const t=document.createElement("small");t.textContent=label;d.append(s,t);$("stats").append(d);}}
async function loadSlots(){const app=$("app").value;const u="/api/slots?page="+page+"&limit=25&app="+encodeURIComponent(app);try{let response=await fetch(u);if(!response.ok)throw Error("Index request failed");const j=await response.json();total=j.total;$("rows").replaceChildren();for(const record of j.items){const tr=document.createElement("tr");for(const key of ["node_id","app_id","book_set_id","technology_set_id","deployment_state"]){let td=document.createElement("td");td.textContent=record[key];tr.append(td);}$("rows").append(tr)}$("notice").textContent=j.total+" matching logical records";$("page").textContent="Page "+page+" of "+Math.max(1,Math.ceil(total/25));$("prev").disabled=page===1;$("next").disabled=page*25>=total;}catch(e){$("notice").textContent="Could not retrieve live index data.";}}
$("search").addEventListener("submit",e=>{e.preventDefault();page=1;loadSlots()});
$("prev").addEventListener("click",()=>{if(page>1){page--;loadSlots()}});
$("next").addEventListener("click",()=>{if(page*25<total){page++;loadSlots()}});
Promise.all([loadStats(),loadSlots()]).catch(()=>$("notice").textContent="Database unavailable");
</script></body></html>`;
const json = (obj,status=200) => new Response(JSON.stringify(obj),{
 status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=30","access-control-allow-origin":"*"}
});
const bad = (message,status) => json({error:message},status);
export default {
 async fetch(request,env) {
  if (request.method !== "GET") return bad("Read-only index; GET only",405);
  if (!env.REGISTRY) return bad("Database binding unavailable",503);
  const url=new URL(request.url), p=url.pathname;
  try {
   if(p==="/"||p==="/index.html")return new Response(PAGE,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=30","x-content-type-options":"nosniff"}});
   if(p==="/health")return json({ok:true,kind:"indexed_logical_compute_slots",physical_hosts_verified:0,version:1});
   if(p==="/api/summary"){
    const q=await env.REGISTRY.batch([
     env.REGISTRY.prepare("SELECT COUNT(*) AS n FROM virtual_supercomputer_slot_v1"),
     env.REGISTRY.prepare("SELECT COUNT(*) AS n FROM virtual_book_set_v1"),
     env.REGISTRY.prepare("SELECT COUNT(*) AS n FROM virtual_technology_set_v1"),
     env.REGISTRY.prepare("SELECT COUNT(*) AS n FROM virtual_app_v1"),
     env.REGISTRY.prepare("SELECT COUNT(*) AS n FROM fleet_entry")
    ]);
    return json({slots:q[0].results[0].n,book_sets:q[1].results[0].n,technology_sets:q[2].results[0].n,apps:q[3].results[0].n,original_fleet:q[4].results[0].n});
   }
   if(p==="/api/slots"){
    const page=Math.max(1,Math.min(100,Number.parseInt(url.searchParams.get("page")||"1",10)||1));
    const limit=Math.max(1,Math.min(50,Number.parseInt(url.searchParams.get("limit")||"25",10)||25));
    const app=url.searchParams.get("app")||"";
    if(app&&!APPS.has(app))return bad("Unknown app",400);
    const count=await env.REGISTRY.prepare("SELECT COUNT(*) AS n FROM virtual_supercomputer_slot_v1 WHERE (?='' OR app_id=?)").bind(app,app).first();
    const rows=await env.REGISTRY.prepare("SELECT node_id,app_id,book_set_id,technology_set_id,deployment_state FROM virtual_supercomputer_slot_v1 WHERE (?='' OR app_id=?) ORDER BY slot LIMIT ? OFFSET ?").bind(app,app,limit,(page-1)*limit).all();
    return json({total:count.n,page,limit,items:rows.results||[]});
   }
   const match=p.match(/^\/api\/slot\/(\d{1,4})$/);
   if(match){
    const n=Number(match[1]);
    if(n<1||n>1000)return bad("Unknown slot",404);
    const record=await env.REGISTRY.prepare("SELECT s.slot,s.node_id,s.app_id,s.book_set_id,s.technology_set_id,s.deployment_state,a.title,a.public_url FROM virtual_supercomputer_slot_v1 s JOIN virtual_app_v1 a ON s.app_id=a.app_id WHERE s.slot=?").bind(n).first();
    return record?json(record):bad("Slot not indexed",404);
   }
   return bad("Not found",404);
  } catch(e) {
   return bad("Index lookup unavailable",503);
  }
 }
};

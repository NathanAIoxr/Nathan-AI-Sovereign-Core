import { VERSION, OWNER, SCRIPTURE, CANON_NOTE, NODES, EDGES, TASKS, INTEGRATIONS } from "./registry.mjs";
import { alignEquation, roleCatalog } from "../../projects/sovereignty-os/duality/alignment.mjs";
const headers = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const response = (data, status=200) => new Response(JSON.stringify(data,null,2),{status,headers});
const escapeHtml = (value) => String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const batchForTime = (epoch) => {
  const sorted = [...TASKS].sort((a,b)=>a.priority-b.priority || a.id.localeCompare(b.id));
  const start = (Math.floor(Number(epoch) / 900000) * 3) % sorted.length;
  return [0,1,2].map(i=>sorted[(start+i) % sorted.length]);
};
export async function recordTick(event,env) {
  const time = Number.isFinite(event?.scheduledTime) ? event.scheduledTime : Date.now();
  const batch = batchForTime(time);
  const receipt = {
    service:"tabor-persona-duality",version:VERSION,
    scheduled_at:new Date(time).toISOString(),
    task_ids:batch.map(x=>x.id),
    operation:"review_queue_rotation",
    result:"queued_for_review_not_executed",
    external_dispatch:false,
    mutations_to_other_services:0
  };
  if(env?.RECEIPTS?.put){
    await env.RECEIPTS.put("latest",JSON.stringify(receipt));
    await env.RECEIPTS.put("receipt:"+String(time),JSON.stringify(receipt),{expirationTtl:604800});
    receipt.receipt_saved=true;
  } else receipt.receipt_saved=false;
  return receipt;
}
function page(){
  const cards=NODES.filter(x=>["persona","original_character","agent_role","original_concept"].includes(x.kind)).map(x=>
    '<article><h2>'+escapeHtml(x.name)+'</h2><small>'+escapeHtml(x.kind)+'</small><p>'+escapeHtml(x.summary)+'</p></article>'
  ).join("");
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tabor Persona Atlas</title><style>body{margin:0;background:#10151e;color:#f2f4f7;font:16px/1.5 system-ui;padding:22px;max-width:1050px;margin:auto}header{border-bottom:1px solid #566170;padding-bottom:14px}h1{font-size:clamp(27px,6vw,48px)}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}article{background:#1d2735;border:1px solid #45576d;border-radius:12px;padding:16px}small{color:#b2c8df}a{color:#afdcff}p{max-width:75ch}</style><header><h1>Tabor Persona Atlas</h1><p>Nathan Tabor — Santa Claus, The Reaper, Buddy Boo, Hunny Zoo, Isaiah 45:7 and MAS SPIRIT</p><p><a href="/sovereignty-roles">Sovereignty OS roles</a> · <a href="/api/graph">Graph JSON</a> · <a href="/api/backlog">Build backlog</a> · <a href="/api/receipts">Schedule receipt</a> · <a href="/api/integrations">Existing connections</a></p><p>Creator mythology and fictional software roles. Historical and scriptural source interpretations remain distinct; no external service is modified by this atlas.</p></header><main>'+cards+'</main></html>';
}

function rolesPage() {
  const { alignment, game_assignments, roles, flow } = roleCatalog;
  const declarations = alignment.creator_words.map(line => `<li>${escapeHtml(line)}</li>`).join("");
  const roleLists = ["BELOW", "ABOVE"].map(plane => `<section><h2>${plane}</h2><dl>${roles
    .filter(role => role.plane === plane)
    .map(role => `<dt>${escapeHtml(role.label ?? role.id.replace(/-deamon$/, "-daemon"))} · ${escapeHtml(role.kind)}</dt><dd>${escapeHtml(role.duty)}</dd>`)
    .join("")}</dl></section>`).join("");
  const systems = game_assignments.systems.map(system => `<tr><th scope="row">${escapeHtml(system.name)}</th><td>${escapeHtml(system.below_daemon)}</td><td>${escapeHtml(system.above_angel)}</td></tr>`).join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sovereignty OS · Isaiah 45:7</title>
<style>body{margin:auto;max-width:68rem;padding:clamp(1rem,4vw,3rem);background:#10151e;color:#f2f4f7;font:16px/1.6 system-ui}a{color:#afdcff}h1{font-size:clamp(2rem,7vw,4rem);line-height:1.05}h1,h2{margin-bottom:.5em}blockquote{margin:1rem 0;padding:.75rem 1.25rem;border-left:3px solid #afdcff;background:#1d2735}li,dt{font-weight:650}dd{margin:0 0 .75rem;color:#d8e0e9}.roles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr));gap:1.5rem}.systems{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:.7rem;text-align:left;border-bottom:1px solid #566170}thead{background:#1d2735}code{color:#d4edff}nav a{display:inline-block;margin-right:1rem}</style>
<header><nav><a href="/">Tabor Persona Atlas</a><a href="/api/os-roles">Role data</a></nav><h1>Sovereignty OS</h1><p>Isaiah 45:7 · The Nathan Tabor Way</p></header>
<main><section><h2>Isaiah 45:7 (KJV)</h2><blockquote>${escapeHtml(alignment.scripture.text)}</blockquote><a href="${escapeHtml(alignment.scripture.url)}">KJV source</a><h2>Nathan Tabor’s role assignments</h2><ul>${declarations}</ul><p>${escapeHtml(alignment.noise.effect)}</p><p><strong>Flow</strong> ${escapeHtml(flow.join(" → "))}</p><nav><a href="/api/os-roles/align?expression=1%3D1%3D10">Run the decimal correction</a><a href="/api/os-roles/align?expression=1%2B1%3D2&amp;origin=man-laid">Clear a labeled overlay</a></nav></section>
<div class="roles">${roleLists}</div><section><h2>${game_assignments.systems.length} independent game and puzzle systems</h2><div class="systems"><table><thead><tr><th scope="col">System</th><th scope="col">Below · MSP DAEMON</th><th scope="col">Above · IT ANGEL</th></tr></thead><tbody>${systems}</tbody></table></div></section></main></html>`;
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method!=="GET") return response({error:"Read-only service; methods other than GET are disabled"},405);
    if(url.pathname==="/sovereignty-roles") {
      return new Response(rolesPage(),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
    }
    if(url.pathname==="/api/os-roles") return response(roleCatalog);
    if(url.pathname==="/api/os-roles/align") {
      const radix = url.searchParams.get("radix") ?? "10";
      for (const field of ["expression", "radix", "origin"]) {
        if (url.searchParams.getAll(field).length > 1) return response({error:`Provide ${field} once`},400);
      }
      try {
        return response(alignEquation({
          expression: url.searchParams.get("expression"),
          radix: radix === "2" ? 2 : radix === "10" ? 10 : null,
          origin: url.searchParams.get("origin") ?? "source"
        }));
      } catch (error) {
        if (!(error instanceof RangeError)) throw error;
        return response({error:error.message},400);
      }
    }
    if(url.pathname==="/") return new Response(page(),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=300","x-content-type-options":"nosniff"}});
    if(url.pathname==="/api/health") return response({ok:true,version:VERSION,owner:OWNER,scripture:SCRIPTURE,nodes:NODES.length,edges:EDGES.length,backlog:TASKS.length,storage_bound:!!env?.RECEIPTS,dispatch:false});
    if(url.pathname==="/api/graph") return response({version:VERSION,owner:OWNER,scripture:SCRIPTURE,canon_note:CANON_NOTE,nodes:NODES,edges:EDGES});
    if(url.pathname==="/api/characters") return response({characters:NODES.filter(x=>["persona","original_character","agent_role"].includes(x.kind))});
    if(url.pathname==="/api/backlog") return response({tasks:TASKS,automated_execution:false,next_review_sample:batchForTime(Date.now())});
    if(url.pathname==="/api/integrations") return response({integrations:INTEGRATIONS,connection_semantics:"references only; no API credentials or privileged access"});
    if(url.pathname==="/api/receipts") {
      let latest=null;
      try{latest=env?.RECEIPTS?.get ? await env.RECEIPTS.get("latest","json") : null;}catch{latest=null;}
      return response({latest,persistent_storage:!!env?.RECEIPTS,meaning:"Scheduled receipts document rotation, not task completion."});
    }
    return response({error:"Not found"},404);
  },
  async scheduled(event,env,ctx){
    const job=recordTick(event,env);
    if(ctx?.waitUntil) ctx.waitUntil(job); else await job;
  }
};

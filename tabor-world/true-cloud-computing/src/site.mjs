const script=`
const el=id=>document.getElementById(id);
async function get(path) {
  const response=await fetch(path);
  const data=await response.json();
  if(!response.ok) throw new Error(data.error||"Endpoint unavailable");
  return data;
}
async function load() {
  const [services,jobs,status]=await Promise.allSettled([get("/api/federation"),get("/api/jobs"),get("/api/status")]);
  if(services.status==="fulfilled"){
    el("colo").textContent=services.value.edge.colo||"Unavailable";
    el("links").replaceChildren();
    for(const item of services.value.services) {
      const row=document.createElement("li");
      const title=document.createElement(item.url?"a":"span");
      title.textContent=item.name;
      if(item.url) title.href=item.url;
      const indicator=document.createElement("span");
      indicator.textContent=item.reachable?"Connected":"Unavailable";
      indicator.className=item.reachable?"good":"warn";
      row.append(title,indicator);
      el("links").append(row);
    }
  }else el("links").textContent="The service registry is unavailable.";
  if(status.status==="fulfilled"){
    el("complete").textContent=status.value.counts.completed_jobs;
    el("registered").textContent=status.value.counts.registered_compute_nodes;
  }
  if(jobs.status==="fulfilled"){
    el("jobs").replaceChildren();
    for(const job of jobs.value.jobs.slice(0,8)){
      const row=document.createElement("li");
      const label=document.createElement("span");
      label.textContent=job.kind+" · "+job.status;
      if(job.sha256){
        const link=document.createElement("a");
        link.href="/api/jobs/"+encodeURIComponent(job.id)+"/audit";
        link.textContent="Audit receipt";
        row.append(label,link);
      }else row.append(label);
      el("jobs").append(row);
    }
    if(!el("jobs").childElementCount)el("jobs").textContent="The first scheduled check is pending.";
  }else el("jobs").textContent="The receipt journal is unavailable.";
}
el("act").onsubmit=async event=>{
  event.preventDefault();
  el("result").textContent="Computing address…";
  try{
    const data=await get("/api/act/address?"+new URLSearchParams({label:el("label").value}));
    el("result").textContent=data.address+" · sector "+data.pie_sector+
      " · "+data.angle_degrees.toFixed(2)+"° · φ phase "+data.phi_phase.toFixed(6);
    el("sector").style.transform="rotate("+data.angle_degrees+"deg)";
  }catch(error){el("result").textContent=error.message;}
};
load();
`;

export const page=`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRUE CLOUD COMPUTING BY NATHAN TABOR</title>
<style>
:root{color-scheme:dark;--background:#0b1016;--card:#121c25;--line:#304555;--text:#ecf1eb;--dim:#adc0c7;--green:#a2eed3;--gold:#f5d49d}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{width:min(1120px,100%);margin:auto;padding:clamp(15px,4vw,47px)}header{border-bottom:1px solid var(--line);padding:8px 0 28px}nav{display:flex;gap:15px;flex-wrap:wrap;color:var(--green);font:600 .8rem ui-monospace,monospace;margin-bottom:28px}h1{font-size:clamp(2.5rem,8vw,6.6rem);letter-spacing:-.065em;line-height:.95;margin:0}h2{font-size:1.25rem;line-height:1.2;margin:0 0 12px}p{margin:0 0 10px}.byline{font-size:clamp(1.2rem,3.4vw,2.35rem);color:var(--gold);margin:10px 0 16px}.subtle{color:var(--dim)}a{color:var(--green);text-underline-offset:.2em}section{border:1px solid var(--line);background:var(--card);padding:clamp(15px,3vw,24px);min-width:0}.panels{display:grid;grid-template-columns:1.15fr 1fr;gap:14px;margin-top:14px}.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:13px 0}.facts div{border:1px solid var(--line);padding:9px}.facts strong{display:block;color:var(--green);font:600 1.28rem ui-monospace,monospace;word-break:break-word}ul{list-style:none;padding:0;margin:0}li{display:flex;gap:12px;justify-content:space-between;border-top:1px solid var(--line);padding:9px 0}.good{color:var(--green)}.warn{color:var(--gold)}.wide{margin-top:14px}.act-layout{display:grid;grid-template-columns:100px minmax(0,1fr);gap:20px;align-items:center}.dial{width:100%;aspect-ratio:1;border:1px solid var(--green);border-radius:50%;background:repeating-conic-gradient(from -1deg,#314b54 0deg 2deg,transparent 2deg 30deg);position:relative}.pointer{position:absolute;width:2px;height:48%;background:var(--gold);top:2%;left:50%;transform-origin:bottom center}form{display:flex;gap:8px;flex-wrap:wrap}input,button{min-height:44px;font:inherit;border-radius:3px;border:1px solid #4a6a76;padding:7px 10px}input{background:#0c151e;color:var(--text);width:min(220px,100%)}button{color:#10251c;background:var(--green);font-weight:700;cursor:pointer}code{color:var(--gold);overflow-wrap:anywhere}footer{margin:16px 0;color:var(--dim)}:focus-visible{outline:2px solid var(--gold);outline-offset:3px}@media(max-width:720px){.panels{grid-template-columns:1fr}.act-layout{grid-template-columns:65px minmax(0,1fr)}}
</style>
<main>
<header>
<nav><a href="https://tabor-world-hub.nathantaboract.workers.dev/">TABOR WORLD HUB</a><a href="#act-address">PIE / PI / PHI</a><a href="/technology">TECHNOLOGY STACK</a><a href="/compute">COMPUTE</a><a href="/api/architecture">ARCHITECTURE API</a></nav>
<h1>TRUE CLOUD<br>COMPUTING</h1><p class="byline">BY NATHAN TABOR</p><p class="subtle">GitHub source. Cloudflare edge execution. D1 receipts you can verify.</p>
</header>
<div class="panels">
<section><h2>Cloud services</h2><div class="facts">
<div class="subtle">Edge location<strong id="colo">—</strong></div>
<div class="subtle">Completed jobs<strong id="complete">—</strong></div>
<div class="subtle">Fleet registrations<strong id="registered">—</strong></div>
</div><ul id="links">Checking service bindings…</ul></section>
<section><h2>Scheduled checks</h2><ul id="jobs">Reading the journal…</ul></section>
</div>
<section id="act-address" class="wide"><h2>Pie / Pi / Phi · ACT addressing</h2><div class="act-layout">
<div class="dial" aria-hidden="true"><div id="sector" class="pointer"></div></div>
<div><p class="subtle">Turn a label into a repeatable node address, a pie sector, and a φ phase.</p>
<form id="act"><input id="label" aria-label="Node label" value="Pie Pi Phi" maxlength="160" required><button>Compute address</button></form>
<p aria-live="polite"><code id="result"></code></p></div>
</div></section>
<footer><a href="/api/status">Status API</a> · <a href="/api/jobs">Receipt journal</a> · <a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core">GitHub source</a></footer>
<script src="/dashboard.js" defer></script></main></html>`;

export { script };

var M=Object.defineProperty;var s=(e,t)=>M(e,"name",{value:t,configurable:!0});var g={project:"TRUE CLOUD COMPUTING BY NATHAN TABOR",version:"0.3.0",state:"edge_runtime",layers:[{id:"source",provider:"GitHub",functions:["version_control","CI","releases"],state:"source_and_ci"},{id:"edge",provider:"Cloudflare Workers",functions:["api_gateway","authentication","routing"],state:"service_bindings"},{id:"metadata",provider:"Cloudflare D1",functions:["capabilities","job_leases","receipts"],state:"d1_job_leases_and_receipts"},{id:"artifacts",provider:"Cloudflare R2",state:"requires_provisioning",functions:["build_artifacts","backups"]},{id:"dispatch",provider:"Workers Cron and Cloudflare D1",state:"scheduled",functions:["fixed_job_dispatch","lease_recovery"]},{id:"compute",provider:"authorized CPU/GPU nodes",state:"external_fleet_registry",functions:["builds","bounded_tasks","benchmarking"]}],integrations:["tabor-world-hub","nathan-ai-sovereign-2x","tabor-compute-fleet"],principles:["preserve_originals","no_unverified_hardware_claims","least_privilege","bounded_cost","execution_receipts"],act_addressing:{version:1,constants:{pi:3.141592653589793,phi:1.618033988749895},pie_sectors:12,storage:"stateless"}};function m(e){return Array.isArray(e)?"["+e.map(m).join(",")+"]":e!==null&&typeof e=="object"?"{"+Object.keys(e).sort().map(t=>JSON.stringify(t)+":"+m(e[t])).join(",")+"}":JSON.stringify(e)}s(m,"canonical");var b=s(e=>Array.from(e,t=>t.toString(16).padStart(2,"0")).join(""),"toHex");async function p(e){let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return b(new Uint8Array(t))}s(p,"sha256");async function w(e){if(typeof e!="string"||e.length>320)throw new RangeError("Enter a label of up to 80 characters.");let t=e.normalize("NFKC").trim().replace(/\s+/g," ");if(!t||Array.from(t).length>80||/\p{C}/u.test(t))throw new RangeError("Enter a label of 1\u201380 visible characters.");let o=await p(m(["ACT",1,t])),r=1000000000n,a=BigInt("0x"+o.slice(0,8))*3141592653n%r,i=BigInt("0x"+o.slice(8,16))*1618033988n%r;return{address:"act-v1-"+o.slice(0,24),sha256:o,version:1,pi:Math.PI,phi:(1+Math.sqrt(5))/2,pie_sector:Number(a*12n/r),angle_degrees:Number(a)/Number(r)*360,phi_phase:Number(i)/Number(r)}}s(w,"actAddress");var h=["inventory-audit","genesis-selftest","telemetry-check"],T=`SELECT (SELECT COUNT(*) FROM true_cloud_jobs) total_jobs,
  (SELECT COUNT(*) FROM true_cloud_jobs WHERE status='completed') completed_jobs,
  (SELECT COUNT(*) FROM tabor_compute_fleet) registered_compute_nodes,
  (SELECT COUNT(*) FROM tabor_restoration_inventory) restoration_inventory`;async function H(){let e="01000000"+"00".repeat(32)+"3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a29ab5f49ffff001d1dac2b7c",t=Uint8Array.from(e.match(/../g),a=>parseInt(a,16)),o=await crypto.subtle.digest("SHA-256",t),r=b(new Uint8Array(await crypto.subtle.digest("SHA-256",o)).reverse());return{hash:r,pass:r==="000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"}}s(H,"genesis");function F(e,t){if(e==="genesis-selftest")return H();let o=e==="inventory-audit"?`SELECT (SELECT COUNT(*) FROM tabor_agent_assignments) agents,
    (SELECT COUNT(*) FROM tabor_coin_federation) coins,(SELECT COUNT(*) FROM tabor_restoration_inventory) restoration_entries,
    (SELECT COUNT(*) FROM tabor_compute_fleet) connected_compute_nodes`:`SELECT (SELECT COUNT(*) FROM nathan_supercomputer_telemetry_log) telemetry_records,
    (SELECT COUNT(*) FROM tabor_compute_heartbeats) heartbeat_records`;return t.prepare(o).first()}s(F,"inspect");async function C(e,t,o){return await e.prepare(`INSERT INTO true_cloud_jobs(id,kind,status) VALUES(?,?,'queued')
    ON CONFLICT(id) DO NOTHING RETURNING id,status,kind`).bind(t,o).first()??e.prepare("SELECT id,status,kind FROM true_cloud_jobs WHERE id=?").bind(t).first()}s(C,"submit");async function E(e,t,o,r,a){let i=m({version:1,id:o.id,kind:o.kind,status:r,attempt:t.attempts,completed_at:new Date().toISOString(),result:a}),c=await p(i),l="SELECT 1 FROM true_cloud_job_claims WHERE job_id=? AND token=? AND expires_ms>?",d=Date.now(),[u]=await e.batch([e.prepare(`INSERT INTO true_cloud_receipts(job_id,body,sha256)
      SELECT ?,?,? WHERE EXISTS(${l}) ON CONFLICT(job_id) DO NOTHING`).bind(o.id,i,c,o.id,t.token,d),e.prepare(`UPDATE true_cloud_jobs SET status=?,completed_at=CURRENT_TIMESTAMP,result_json=?
      WHERE id=? AND status='running' AND EXISTS(${l})`).bind(r,m(a),o.id,o.id,t.token,d)]);return u.meta.changes?{id:o.id,status:r,sha256:c,result:a}:{id:o.id,state:"lease_expired"}}s(E,"complete");async function y(e,t=Date.now()){let o=crypto.randomUUID(),[,r,a]=await e.batch([e.prepare(`UPDATE true_cloud_jobs SET status='failed', completed_at=CURRENT_TIMESTAMP,
      result_json='{"error":"Lease expired after three attempts"}'
      WHERE status='running' AND EXISTS(SELECT 1 FROM true_cloud_job_claims c
        WHERE c.job_id=true_cloud_jobs.id AND c.attempts>=3 AND c.expires_ms<=?)`).bind(t),e.prepare(`INSERT INTO true_cloud_job_claims(job_id,token,expires_ms,attempts)
      SELECT j.id,?,?,1 FROM true_cloud_jobs j LEFT JOIN true_cloud_job_claims c ON c.job_id=j.id
      WHERE j.status IN ('queued','running') AND (c.job_id IS NULL OR (c.expires_ms<=? AND c.attempts<3))
      ORDER BY j.created_at,j.id LIMIT 1
      ON CONFLICT(job_id) DO UPDATE SET token=excluded.token,expires_ms=excluded.expires_ms,attempts=true_cloud_job_claims.attempts+1
      RETURNING token,attempts`).bind(o,t+9e4,t),e.prepare(`UPDATE true_cloud_jobs SET status='running',started_at=CURRENT_TIMESTAMP
      WHERE id=(SELECT job_id FROM true_cloud_job_claims WHERE token=?) RETURNING id,kind`).bind(o)]),i=r.results[0],c=a.results[0];if(!i||!c)return{state:"idle"};try{let l=await F(c.kind,e);return await E(e,i,c,l.pass===!1?"failed":"completed",l)}catch(l){return console.error("task failed",c.kind,l.name),i.attempts>=3?E(e,i,c,"failed",{error:"Audit failed after three attempts"}):(await e.prepare("UPDATE true_cloud_job_claims SET expires_ms=? WHERE job_id=? AND token=?").bind(Date.now()+3e4,c.id,i.token).run(),{id:c.id,state:"retry_wait"})}}s(y,"runNext");async function k(e,t){let o=new Date(t).toISOString().slice(0,16);await e.batch(h.map(r=>e.prepare(`INSERT OR IGNORE INTO true_cloud_jobs(id,kind,status)
    VALUES(?,?,'queued')`).bind("cron-"+o+"-"+r,r)));for(let r of h)await y(e)}s(k,"runScheduled");var j=`
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
      label.textContent=job.kind+" \xB7 "+job.status;
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
  el("result").textContent="Computing address\u2026";
  try{
    const data=await get("/api/act/address?"+new URLSearchParams({label:el("label").value}));
    el("result").textContent=data.address+" \xB7 sector "+data.pie_sector+
      " \xB7 "+data.angle_degrees.toFixed(2)+"\xB0 \xB7 \u03C6 phase "+data.phi_phase.toFixed(6);
    el("sector").style.transform="rotate("+data.angle_degrees+"deg)";
  }catch(error){el("result").textContent=error.message;}
};
load();
`,S=`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRUE CLOUD COMPUTING BY NATHAN TABOR</title>
<style>
:root{color-scheme:dark;--background:#0b1016;--card:#121c25;--line:#304555;--text:#ecf1eb;--dim:#adc0c7;--green:#a2eed3;--gold:#f5d49d}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{width:min(1120px,100%);margin:auto;padding:clamp(15px,4vw,47px)}header{border-bottom:1px solid var(--line);padding:8px 0 28px}nav{display:flex;gap:15px;flex-wrap:wrap;color:var(--green);font:600 .8rem ui-monospace,monospace;margin-bottom:28px}h1{font-size:clamp(2.5rem,8vw,6.6rem);letter-spacing:-.065em;line-height:.95;margin:0}h2{font-size:1.25rem;line-height:1.2;margin:0 0 12px}p{margin:0 0 10px}.byline{font-size:clamp(1.2rem,3.4vw,2.35rem);color:var(--gold);margin:10px 0 16px}.subtle{color:var(--dim)}a{color:var(--green);text-underline-offset:.2em}section{border:1px solid var(--line);background:var(--card);padding:clamp(15px,3vw,24px);min-width:0}.panels{display:grid;grid-template-columns:1.15fr 1fr;gap:14px;margin-top:14px}.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:13px 0}.facts div{border:1px solid var(--line);padding:9px}.facts strong{display:block;color:var(--green);font:600 1.28rem ui-monospace,monospace;word-break:break-word}ul{list-style:none;padding:0;margin:0}li{display:flex;gap:12px;justify-content:space-between;border-top:1px solid var(--line);padding:9px 0}.good{color:var(--green)}.warn{color:var(--gold)}.wide{margin-top:14px}.act-layout{display:grid;grid-template-columns:100px minmax(0,1fr);gap:20px;align-items:center}.dial{width:100%;aspect-ratio:1;border:1px solid var(--green);border-radius:50%;background:repeating-conic-gradient(from -1deg,#314b54 0deg 2deg,transparent 2deg 30deg);position:relative}.pointer{position:absolute;width:2px;height:48%;background:var(--gold);top:2%;left:50%;transform-origin:bottom center}form{display:flex;gap:8px;flex-wrap:wrap}input,button{min-height:44px;font:inherit;border-radius:3px;border:1px solid #4a6a76;padding:7px 10px}input{background:#0c151e;color:var(--text);width:min(220px,100%)}button{color:#10251c;background:var(--green);font-weight:700;cursor:pointer}code{color:var(--gold);overflow-wrap:anywhere}footer{margin:16px 0;color:var(--dim)}:focus-visible{outline:2px solid var(--gold);outline-offset:3px}@media(max-width:720px){.panels{grid-template-columns:1fr}.act-layout{grid-template-columns:65px minmax(0,1fr)}}
</style>
<main>
<header>
<nav><a href="https://tabor-world-hub.nathantaboract.workers.dev/">TABOR WORLD HUB</a><a href="#act-address">PIE / PI / PHI</a><a href="/technology">TECHNOLOGY STACK</a><a href="/api/architecture">ARCHITECTURE API</a></nav>
<h1>TRUE CLOUD<br>COMPUTING</h1><p class="byline">BY NATHAN TABOR</p><p class="subtle">GitHub source. Cloudflare edge execution. D1 receipts you can verify.</p>
</header>
<div class="panels">
<section><h2>Cloud services</h2><div class="facts">
<div class="subtle">Edge location<strong id="colo">\u2014</strong></div>
<div class="subtle">Completed jobs<strong id="complete">\u2014</strong></div>
<div class="subtle">Fleet registrations<strong id="registered">\u2014</strong></div>
</div><ul id="links">Checking service bindings\u2026</ul></section>
<section><h2>Scheduled checks</h2><ul id="jobs">Reading the journal\u2026</ul></section>
</div>
<section id="act-address" class="wide"><h2>Pie / Pi / Phi \xB7 ACT addressing</h2><div class="act-layout">
<div class="dial" aria-hidden="true"><div id="sector" class="pointer"></div></div>
<div><p class="subtle">Turn a label into a repeatable node address, a pie sector, and a \u03C6 phase.</p>
<form id="act"><input id="label" aria-label="Node label" value="Pie Pi Phi" maxlength="160" required><button>Compute address</button></form>
<p aria-live="polite"><code id="result"></code></p></div>
</div></section>
<footer><a href="/api/status">Status API</a> \xB7 <a href="/api/jobs">Receipt journal</a> \xB7 <a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core">GitHub source</a></footer>
<script src="/dashboard.js" defer><\/script></main></html>`;var O=[{id:"io",label:"Input / Output (I/O)",purpose:"Moves information into and out of a system.",physical:["Keyboards","Sensors","Fiber links","Network interface controllers"],software:["REST APIs","Device drivers","Network protocols"],deployment:"An HTTPS request carries the two input bits to the True Cloud Worker. The response returns the gate outputs."},{id:"compute",label:"Compute",purpose:"Applies logic and arithmetic to data.",physical:["CPUs","GPUs","TPUs","Microcontrollers"],software:["V8 isolates","Boolean expressions","Software workloads"],deployment:"JavaScript evaluates the gates and the half adder inside a Cloudflare Worker isolate."},{id:"memory",label:"Memory & Storage",purpose:"Holds data and state for different durations.",physical:["RAM","HBM","NVMe SSDs","Hard drives"],software:["SQLite","Cloudflare D1"],deployment:"A read-only query checks the existing D1 binding. D1 also holds the production job journal."},{id:"control",label:"Control & Power",purpose:"Coordinates operation and provides the physical conditions that hardware requires.",physical:["Timing circuits","Power distribution","Cooling loops"],software:["Operating systems","Kernels","Runtime scheduling"],deployment:"The response reports the request's Cloudflare ingress location when available. Power and cooling are operated by the provider."}],f={title:"The Global Technology Stack",elements:[{title:"The Physical Atoms",subtitle:"Earth, Light, and Power",description:"Compute hardware depends on semiconductor materials, conductors, electricity and heat removal. Fiber transmits data using light. Wireless links use electromagnetic waves."},{title:"The Binary Switch",subtitle:"0 and 1",description:"A transistor can control a conducting path. CMOS logic circuits interpret ranges of voltage as logic states. A bit is a logical value, and its physical encoding varies across circuits, storage and communications. AND, OR, NOT and XOR combine those values."},{title:"The Four Universal Layers",subtitle:"A functional model",description:"I/O, compute, memory and storage, and control and power describe different jobs in a system. One component can serve more than one layer."},{title:"The Global Pattern",subtitle:"Centralized and distributed",description:"Centralized deployments concentrate work in one or a few facilities. Distributed deployments place work across locations. A system can combine edge execution with shared backend services."}],layers:O,topologies:[{label:"Centralized data centers",description:"Large facilities concentrate racks, power, cooling and high-speed interconnects. Examples include centralized databases and tightly coupled compute clusters."},{label:"Distributed edge networks",description:"Work can run on edge servers, workstations or phones near users or data sources. Placement depends on the workload and its backend dependencies."}],sources:[{label:"CMOS Electronics, chapter 4",url:"https://docs.ampnuts.ru/eevblog.docs/_Books/ASIC_Design/cmos%20electronics%20%28segura%2Chawkins-2004%29.pdf"},{label:"Cloudflare Workers execution model",url:"https://developers.cloudflare.com/workers/reference/how-workers-works/"},{label:"Cloudflare D1 documentation",url:"https://developers.cloudflare.com/d1/"}]};function R(e,t){return{a:e,b:t,and:e&t,or:e|t,xor:e^t,not_a:1-e,not_b:1-t,sum:e^t,carry:e&t}}s(R,"evaluate");async function N(e,t){let o=new URL(e.url).searchParams;for(let i of["a","b"])if(o.getAll(i).length!==1||!["0","1"].includes(o.get(i)))throw new RangeError("Supply one 0 or 1 for a and b.");let r=R(Number(o.get("a")),Number(o.get("b"))),a=await t.prepare("SELECT 1 AS ready").first();return{gates:r,layers:{io:{transport:"HTTPS",a:r.a,b:r.b},compute:{runtime:"Cloudflare Worker / V8",half_adder:{sum:r.sum,carry:r.carry}},memory:{provider:"Cloudflare D1",read_verified:a?.ready===1},control:{ingress_colo:e.cf?.colo??null}}}}s(N,"trace");var G=`
:root{color-scheme:dark;--background:#0b1016;--card:#121c25;--line:#304555;--text:#ecf1eb;--dim:#adc0c7;--green:#a2eed3;--gold:#f5d49d}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{width:min(1120px,100%);margin:auto;padding:clamp(16px,4vw,45px)}header{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:20px}nav{display:flex;gap:15px;flex-wrap:wrap;font:600 .8rem ui-monospace,monospace;margin:10px 0 24px}h1{font-size:clamp(2.4rem,7vw,5.15rem);line-height:1;letter-spacing:-.055em;margin:0 0 12px}h2,h3{line-height:1.2;margin:0 0 10px}p{margin:0 0 9px}a{color:var(--green);text-underline-offset:.2em}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.card{background:var(--card);border:1px solid var(--line);padding:clamp(13px,2.8vw,23px);min-width:0}.section{margin-top:24px}.muted{color:var(--dim)}.eyebrow{color:var(--gold);font:.92rem ui-monospace,monospace}.probe{margin:18px 0}.probe h2{margin-bottom:12px}form{display:flex;flex-wrap:wrap;gap:10px;align-items:end}label{display:grid;gap:4px}select,button{font:inherit;min-height:44px;padding:5px 10px;border-radius:4px;border:1px solid #446273;background:#0b1016;color:var(--text)}button{background:var(--green);color:#10251c;font-weight:750;cursor:pointer}div.truth{min-width:0;overflow-x:auto}table{width:100%;border-collapse:collapse;font:14px ui-monospace,monospace}th,td{padding:7px 5px;text-align:right;border-bottom:1px solid var(--line)}th:first-child,td:first-child{text-align:left}tr.active td{color:var(--gold);background:#273238}output{display:block;margin:12px 0;color:var(--gold);overflow-wrap:anywhere}.stack{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:14px}footer{margin:24px 0}:focus-visible{outline:2px solid var(--gold);outline-offset:2px}@media(max-width:710px){.grid,.stack{grid-template-columns:1fr}}
`,W=[0,1].flatMap(e=>[0,1].map(t=>{let o=R(e,t);return"<tr data-input='"+e+t+"'><td>"+e+"</td><td>"+t+"</td><td>"+o.and+"</td><td>"+o.or+"</td><td>"+o.xor+"</td><td>"+o.not_a+"</td><td>"+o.not_b+"</td><td>"+o.sum+"</td><td>"+o.carry+"</td></tr>"})).join(""),z=f.elements.map(e=>"<article class='card'><h2>"+e.title+"</h2><p class='eyebrow'>"+e.subtitle+"</p><p>"+e.description+"</p></article>").join(""),J=O.map(e=>"<article class='card'><h3>"+e.label+"</h3><p>"+e.purpose+"</p><p class='muted'>Hardware examples \xB7 "+e.physical.join(", ")+"</p><p class='muted'>Software examples \xB7 "+e.software.join(", ")+"</p><p>"+e.deployment+"</p></article>").join(""),$=f.topologies.map(e=>"<article class='card'><h3>"+e.label+"</h3><p>"+e.description+"</p></article>").join(""),K=f.sources.map(e=>"<li><a href='"+e.url+"'>"+e.label+"</a></li>").join(""),A=`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Global Technology Stack \xB7 True Cloud Computing</title><style>${G}</style>
<main>
<header><nav><a href="/">TRUE CLOUD COMPUTING BY NATHAN TABOR</a><a href="/api/technology">Technology API</a></nav>
<h1>The Global Technology Stack</h1></header>
<div class="grid">${z}</div>
<section class="card probe" aria-labelledby="demo-title"><h2 id="demo-title">Run two bits through the stack</h2>
<div class="stack"><div>
<form id="gate-form"><label>Bit A<select name="a"><option value="0">0</option><option value="1" selected>1</option></select></label>
<label>Bit B<select name="b"><option value="0" selected>0</option><option value="1">1</option></select></label>
<button type="submit">Run live trace</button></form>
<output id="readout" aria-live="polite">Choose the bits to run a Worker and D1 check.</output>
</div><div class="truth"><table><caption>Gate and half-adder truth table</caption><thead>
<tr><th scope="col">A</th><th scope="col">B</th><th scope="col">AND</th><th scope="col">OR</th><th scope="col">XOR</th>
<th scope="col">\xACA</th><th scope="col">\xACB</th><th scope="col">Sum</th><th scope="col">Carry</th></tr>
</thead><tbody>${W}</tbody></table></div></div>
</section>
<section class="section"><h2>The four layers in True Cloud Computing</h2><div class="grid">${J}</div></section>
<section class="section"><h2>Global deployment patterns</h2><div class="grid">${$}</div></section>
<footer><details><summary>Technical references</summary><ul>${K}</ul></details></footer>
</main><script src="/technology.js" defer><\/script></html>`,U=`
const form=document.getElementById("gate-form");
const readout=document.getElementById("readout");
const button=form.querySelector("button");
form.addEventListener("submit",async event=>{
  event.preventDefault();
  button.disabled=true;
  readout.textContent="Tracing the request\u2026";
  for(const row of document.querySelectorAll("tr[data-input]"))row.classList.remove("active");
  try {
    const response=await fetch("/api/technology/trace?"+new URLSearchParams(new FormData(form)));
    const result=await response.json();
    if(!response.ok)throw Error(result.error||"Trace unavailable");
    const selected=String(result.gates.a)+String(result.gates.b);
    for(const row of document.querySelectorAll("tr[data-input]"))row.classList.toggle("active",row.dataset.input===selected);
    const colo=result.layers.control.ingress_colo;
    readout.textContent="Sum "+result.gates.sum+" \xB7 Carry "+result.gates.carry+
      " \xB7 D1 read "+(result.layers.memory.read_verified?"verified":"unverified")+
      (colo?" \xB7 Cloudflare ingress "+colo:"");
  }catch(error){readout.textContent=error.message;}
  finally{button.disabled=false;}
});
`;var v={"cache-control":"no-store","x-content-type-options":"nosniff"},n=s((e,t=200)=>Response.json(e,{status:t,headers:{...v,"access-control-allow-origin":"*"}}),"json"),I=s(e=>new Response(e,{headers:{...v,"content-type":"text/html;charset=utf-8","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"}}),"html"),D=s(e=>new Response(e,{headers:{...v,"content-type":"text/javascript;charset=utf-8"}}),"javascript"),q=[{key:"WORLD_HUB",name:"Tabor World Hub",host:"https://hub.internal",path:"/health",url:"https://tabor-world-hub.nathantaboract.workers.dev/"},{key:"SOVEREIGN_COMPUTE",name:"Nathan AI 2X+ Sovereign Supercomputer",host:"https://compute.internal",path:"/health",url:"https://nathan-ai-sovereign-2x.nathantaboract.workers.dev/"},{key:"COMPUTE_FLEET",name:"Compute Fleet Registry",host:"https://fleet.internal",path:"/health"}];async function V(e,t){let o=await Promise.all(q.map(async({key:r,name:a,host:i,path:c,url:l})=>{let d=null;try{let u=await t[r]?.fetch(i+c,{signal:AbortSignal.timeout(3500)});d=u?.status??null,u?.body&&await u.body.cancel()}catch{}return{key:r,name:a,url:l,status:d,reachable:d>=200&&d<300}}));return n({edge:{provider:"Cloudflare",colo:e.cf?.colo??null},services:o})}s(V,"federation");async function L(e,t){let o=e.headers.get("authorization")||"";if(!t.TRUE_CLOUD_TOKEN||o.length>300||!o.startsWith("Bearer "))return!1;let[r,a]=await Promise.all([p(o.slice(7)),p(t.TRUE_CLOUD_TOKEN)]),i=0;for(let c=0;c<r.length;c++)i|=r.charCodeAt(c)^a.charCodeAt(c);return i===0}s(L,"authorized");var Y=`SELECT j.id,j.kind,j.status,j.created_at,j.started_at,j.completed_at,j.result_json,r.sha256
  FROM true_cloud_jobs j LEFT JOIN true_cloud_receipts r ON r.job_id=j.id`;async function X(e,t,o){if(t.pathname==="/api/jobs"&&e.method==="GET"){let{results:r}=await o.DB.prepare(Y+" ORDER BY j.created_at DESC,j.id DESC LIMIT 30").all();return n({jobs:r.map(({result_json:a,...i})=>({...i,result_json:i.status==="failed"?'{"error":"Job failed"}':a}))})}if(t.pathname==="/api/jobs"&&e.method==="POST"){if(!await L(e,o))return n({error:"Unauthorized"},401);let r=e.body?.getReader(),a="",i=0,c=new TextDecoder;if(!r)return n({error:"JSON body required"},400);for(;;){let{done:P,value:_}=await r.read();if(P)break;if(i+=_.byteLength,i>1024)return await r.cancel(),n({error:"Request exceeds 1 KB"},413);a+=c.decode(_,{stream:!0})}let l;try{l=JSON.parse(a+c.decode())}catch{return n({error:"Invalid JSON"},400)}if(!h.includes(l?.kind))return n({error:"Unsupported job kind"},400);let d=e.headers.get("idempotency-key");if(d!==null&&!/^[a-z0-9_-]{1,80}$/i.test(d))return n({error:"Invalid idempotency key"},400);let u=d===null?crypto.randomUUID():"request-"+await p(d),x=await C(o.DB,u,l.kind);return x.kind!==l.kind?n({error:"Idempotency key is assigned to a different kind"},409):n(x,201)}if(e.method==="GET"){let r=/^\/api\/jobs\/([a-zA-Z0-9_.:%-]{1,120})(\/audit)?$/.exec(t.pathname);if(r){let a=decodeURIComponent(r[1]),i=await o.DB.prepare("SELECT body,sha256 FROM true_cloud_receipts WHERE job_id=?").bind(a).first();return i?n(r[2]?{id:a,sha256:i.sha256,verified:await p(i.body)===i.sha256}:{receipt:JSON.parse(i.body),sha256:i.sha256}):n({error:"Verified receipt unavailable"},404)}}return n({error:"Not found"},404)}s(X,"receipts");var me={async fetch(e,t){let o=new URL(e.url),r=o.pathname;if(e.method==="OPTIONS")return new Response(null,{status:204,headers:{"access-control-allow-origin":"*","access-control-allow-headers":"authorization,content-type,idempotency-key","access-control-allow-methods":"GET,POST,OPTIONS"}});try{if(e.method==="GET"){if(r==="/")return I(S);if(r==="/dashboard.js")return D(j);if(r==="/technology")return I(A);if(r==="/technology.js")return D(U);if(r==="/api/technology")return n(f);if(r==="/api/technology/trace")return n(await N(e,t.DB));if(r==="/health")return n({name:g.project,version:g.version,hub:"TABOR WORLD HUB",state:"edge-online",job_kinds:h});if(r==="/api/architecture")return n(g);if(r==="/api/federation")return V(e,t);if(r==="/api/act/address")return n(await w(o.searchParams.get("label")));if(r==="/api/status"){let a=await t.DB.prepare(T).first();return n({platform:"TRUE CLOUD COMPUTING",hub:"TABOR WORLD HUB",counts:a,capabilities:{edge:!0,d1:!0,scheduled_execution:!0,external_compute_provisioned:!1,registered_nodes:a.registered_compute_nodes}})}}return r==="/api/jobs"||r.startsWith("/api/jobs/")?await X(e,o,t):e.method==="POST"&&r==="/api/run-next"?await L(e,t)?n(await y(t.DB)):n({error:"Unauthorized"},401):n({error:"Not found"},404)}catch(a){return a instanceof RangeError||a instanceof URIError?n({error:a.message},400):(console.error("true cloud route",r,a.name),n({error:"Service temporarily unavailable"},503))}},scheduled(e,t,o){o.waitUntil(k(t.DB,e.scheduledTime))}};export{me as default};
//# sourceMappingURL=index.js.map

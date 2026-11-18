import { PLATFORM } from "../protocol.mjs";
export const dashboard = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${PLATFORM}</title><link rel="stylesheet" href="/platform.css"><script src="/platform.js" type="module"></script></head>
<body><main><header><p><a href="https://tabor-true-cloud-computing.nathantaboract.workers.dev/">True Cloud Computing by Nathan Tabor</a></p>
<h1>NATHAN AI</h1><p class="sub">Nathan Tabor 2X+ Sovereign Supercomputer</p></header>
<div class="steps"><span>Fe · Verify</span><span>Fi · Reserve</span><span>Fo · Execute</span><span>Fum · Commit</span></div>
<p id="health" role="status">Loading platform status…</p>
<section><h2>Capacity and spending</h2><div id="capacity" class="grid"></div></section>
<section><h2>Project jobs</h2><form id="project" method="post" action="/platform"><label>Project<input name="project" autocomplete="off" required></label>
<label>Project token<input type="password" name="token" autocomplete="off" required></label><button>Show jobs</button></form>
<p id="project-status" role="status"></p><div class="table" id="jobs"></div></section>
<section><h2>Benchmark receipts</h2><p>Fresh compute is measured against a fixed workload, quality target, and latency limit.</p><div id="benchmarks"></div></section>
<footer><a href="/platform/status">Status JSON</a><a href="/platform/benchmarks">Raw benchmark receipts</a></footer></main></body></html>`;
export const dashboardStyle = `
:root{color-scheme:dark;font:16px/1.55 "Instrument Sans",system-ui,sans-serif;background:#101a18;color:#e9f3e9}
*{box-sizing:border-box}main{width:min(1100px,calc(100% - 32px));margin:auto}header{padding:2.2rem 0 1.1rem}h1,h2,p{margin:.4rem 0}h1{font-size:clamp(2.9rem,9vw,6rem);line-height:.94;letter-spacing:-.075em}.sub{font-size:clamp(1.1rem,4vw,1.85rem);color:#aee5bf}
section{padding:1rem 0 1.45rem;border-top:1px solid #3d5a50}p,label{color:#c5d8cc}a{color:#aee5bf}.steps,.grid,footer{display:flex;gap:.65rem;flex-wrap:wrap}
.steps span,.card,details{background:#1a2b24;border:1px solid #406052;padding:.65rem .8rem;border-radius:.45rem}.card{flex:1 1 15rem}.card strong{display:block}
form{display:flex;flex-wrap:wrap;gap:.65rem;align-items:end;margin-top:.6rem}label{display:grid;gap:.28rem}input,button{font:inherit;border:1px solid #5d806d;border-radius:.35rem;padding:.47rem .64rem}
input{width:min(100%,18rem);background:#0c1611}button{background:#aee5bf;color:#122219;font-weight:700;cursor:pointer}.table{overflow-x:auto}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:.45rem;border-bottom:1px solid #3d5a50}th{white-space:nowrap}.empty{color:#a6bdb0}pre{white-space:pre-wrap;overflow-wrap:anywhere}footer{border-top:1px solid #3d5a50;padding:1rem 0 2rem}
`;
export const dashboardScript = `
const at=id=>document.getElementById(id);
const el=(tag,val)=>Object.assign(document.createElement(tag),{textContent:val});
const usd=micros=>"$"+(micros/1e6).toFixed(6);
async function read(path,options) {
  const response=await fetch(path,options);
  const data=await response.json();
  if(!response.ok)throw Error(data.receipt?.reason||"Service unavailable");
  return data;
}
async function capacity() {
  try {
    const s=await read("/platform/status");
    at("health").textContent=(s.revision?.slice(0,12)??"revision unknown")+" · "+(s.projectCredentialsConfigured?"Project sign-in configured":"Project sign-in awaits owner credentials");
    const add=(title,body)=>{const node=el("div","");node.className="card";node.append(el("strong",title),el("span",body));return node;};
    at("capacity").replaceChildren(
      add("Durable queue",(s.jobs.queued??0)+" queued · "+(s.jobs.running??0)+" running · "+(s.jobs.succeeded??0)+" completed"),
      add("Estimated spending",usd(s.spending.estimatedUsdMicros)+" used · "+usd(s.spending.reservedUsdMicros)+" reserved"),
      add("Physical devices registered",String(s.physicalDevicesRegistered)),
      ...s.pools.map(p=>add(p.id,p.occupied+" occupied · "+p.available+" available logical slots")));
  } catch { at("health").textContent="Platform status is temporarily unavailable."; }
}
async function benchmarks() {
  const data=await read("/platform/benchmarks");
  at("benchmarks").replaceChildren(...(data.benchmarks.length ? data.benchmarks.map(b=>{
    const node=el("details","");
    node.append(el("summary",b.id+" · "+b.receipt.summary.accepted+"/"+b.receipt.summary.total+" accepted"),el("pre",JSON.stringify(b,null,2)));
    return node;
  }) : [el("p","No benchmark receipts published.")]));
}
at("project").addEventListener("submit",async event=>{
  event.preventDefault();
  at("project-status").textContent="Loading project jobs…";
  at("jobs").replaceChildren();
  const fields=new FormData(event.currentTarget);
  try {
    const data=await read("/platform/jobs",{headers:{"authorization":"Bearer "+fields.get("token"),"x-sovereign-project":fields.get("project")}});
    if(!data.jobs.length) {at("project-status").textContent="No jobs for this project.";return;}
    const table=el("table",""),head=el("tr","");
    for(const label of ["Job","Workload","State","Progress","Backend","Estimate"])head.append(el("th",label));
    const th=el("thead","");th.append(head);table.append(th);
    const tbody=el("tbody","");
    for(const job of data.jobs){const tr=el("tr","");for(const value of [job.id,job.kind,job.state,job.progress+"/"+job.total,job.backend??"Awaiting capacity",usd(job.spentEstimateMicro)])tr.append(el("td",value));tbody.append(tr);}
    table.append(tbody);at("jobs").append(table);at("project-status").textContent=data.jobs.length+" jobs";
  } catch(error){at("project-status").textContent=error.message;}
});
capacity();benchmarks().catch(()=>{at("benchmarks").textContent="Benchmark receipts are temporarily unavailable.";});
setInterval(capacity,15000);
`;

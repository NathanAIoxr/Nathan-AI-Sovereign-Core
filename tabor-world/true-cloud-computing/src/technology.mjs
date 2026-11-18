const layers=[
  {id:"io",label:"Input / Output (I/O)",purpose:"Moves information into and out of a system.",
    physical:["Keyboards","Sensors","Fiber links","Network interface controllers"],software:["REST APIs","Device drivers","Network protocols"],
    deployment:"An HTTPS request carries the two input bits to the True Cloud Worker. The response returns the gate outputs."},
  {id:"compute",label:"Compute",purpose:"Applies logic and arithmetic to data.",
    physical:["CPUs","GPUs","TPUs","Microcontrollers"],software:["V8 isolates","Boolean expressions","Software workloads"],
    deployment:"JavaScript evaluates the gates and the half adder inside a Cloudflare Worker isolate."},
  {id:"memory",label:"Memory & Storage",purpose:"Holds data and state for different durations.",
    physical:["RAM","HBM","NVMe SSDs","Hard drives"],software:["SQLite","Cloudflare D1"],
    deployment:"A read-only query checks the existing D1 binding. D1 also holds the production job journal."},
  {id:"control",label:"Control & Power",purpose:"Coordinates operation and provides the physical conditions that hardware requires.",
    physical:["Timing circuits","Power distribution","Cooling loops"],software:["Operating systems","Kernels","Runtime scheduling"],
    deployment:"The response reports the request's Cloudflare ingress location when available. Power and cooling are operated by the provider."},
];

export const technology={
  title:"The Global Technology Stack",
  elements:[
    {title:"The Physical Atoms",subtitle:"Earth, Light, and Power",description:"Compute hardware depends on semiconductor materials, conductors, electricity and heat removal. Fiber transmits data using light. Wireless links use electromagnetic waves."},
    {title:"The Binary Switch",subtitle:"0 and 1",description:"A transistor can control a conducting path. CMOS logic circuits interpret ranges of voltage as logic states. A bit is a logical value, and its physical encoding varies across circuits, storage and communications. AND, OR, NOT and XOR combine those values."},
    {title:"The Four Universal Layers",subtitle:"A functional model",description:"I/O, compute, memory and storage, and control and power describe different jobs in a system. One component can serve more than one layer."},
    {title:"The Global Pattern",subtitle:"Centralized and distributed",description:"Centralized deployments concentrate work in one or a few facilities. Distributed deployments place work across locations. A system can combine edge execution with shared backend services."},
  ],
  layers,
  topologies:[
    {label:"Centralized data centers",description:"Large facilities concentrate racks, power, cooling and high-speed interconnects. Examples include centralized databases and tightly coupled compute clusters."},
    {label:"Distributed edge networks",description:"Work can run on edge servers, workstations or phones near users or data sources. Placement depends on the workload and its backend dependencies."},
  ],
  sources:[
    {label:"CMOS Electronics, chapter 4",url:"https://docs.ampnuts.ru/eevblog.docs/_Books/ASIC_Design/cmos%20electronics%20%28segura%2Chawkins-2004%29.pdf"},
    {label:"Cloudflare Workers execution model",url:"https://developers.cloudflare.com/workers/reference/how-workers-works/"},
    {label:"Cloudflare D1 documentation",url:"https://developers.cloudflare.com/d1/"},
  ],
};

function evaluate(a,b) {
  return {a,b,and:a&b,or:a|b,xor:a^b,not_a:1-a,not_b:1-b,sum:a^b,carry:a&b};
}

export async function trace(request,db) {
  const input=new URL(request.url).searchParams;
  for (const bit of ["a","b"]) {
    if(input.getAll(bit).length!==1||!["0","1"].includes(input.get(bit))) throw new RangeError("Supply one 0 or 1 for a and b.");
  }
  const gates=evaluate(Number(input.get("a")),Number(input.get("b")));
  const row=await db.prepare("SELECT 1 AS ready").first();
  return {gates,layers:{
    io:{transport:"HTTPS",a:gates.a,b:gates.b},
    compute:{runtime:"Cloudflare Worker / V8",half_adder:{sum:gates.sum,carry:gates.carry}},
    memory:{provider:"Cloudflare D1",read_verified:row?.ready===1},
    control:{ingress_colo:request.cf?.colo??null},
  }};
}

const styles=`
:root{color-scheme:dark;--background:#0b1016;--card:#121c25;--line:#304555;--text:#ecf1eb;--dim:#adc0c7;--green:#a2eed3;--gold:#f5d49d}
*{box-sizing:border-box}body{margin:0;background:var(--background);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{width:min(1120px,100%);margin:auto;padding:clamp(16px,4vw,45px)}header{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:20px}nav{display:flex;gap:15px;flex-wrap:wrap;font:600 .8rem ui-monospace,monospace;margin:10px 0 24px}h1{font-size:clamp(2.4rem,7vw,5.15rem);line-height:1;letter-spacing:-.055em;margin:0 0 12px}h2,h3{line-height:1.2;margin:0 0 10px}p{margin:0 0 9px}a{color:var(--green);text-underline-offset:.2em}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.card{background:var(--card);border:1px solid var(--line);padding:clamp(13px,2.8vw,23px);min-width:0}.section{margin-top:24px}.muted{color:var(--dim)}.eyebrow{color:var(--gold);font:.92rem ui-monospace,monospace}.probe{margin:18px 0}.probe h2{margin-bottom:12px}form{display:flex;flex-wrap:wrap;gap:10px;align-items:end}label{display:grid;gap:4px}select,button{font:inherit;min-height:44px;padding:5px 10px;border-radius:4px;border:1px solid #446273;background:#0b1016;color:var(--text)}button{background:var(--green);color:#10251c;font-weight:750;cursor:pointer}div.truth{min-width:0;overflow-x:auto}table{width:100%;border-collapse:collapse;font:14px ui-monospace,monospace}th,td{padding:7px 5px;text-align:right;border-bottom:1px solid var(--line)}th:first-child,td:first-child{text-align:left}tr.active td{color:var(--gold);background:#273238}output{display:block;margin:12px 0;color:var(--gold);overflow-wrap:anywhere}.stack{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:14px}footer{margin:24px 0}:focus-visible{outline:2px solid var(--gold);outline-offset:2px}@media(max-width:710px){.grid,.stack{grid-template-columns:1fr}}
`;

const truthRows=[0,1].flatMap(a=>[0,1].map(b=>{
  const value=evaluate(a,b);
  return "<tr data-input='"+a+b+"'><td>"+a+"</td><td>"+b+"</td><td>"+value.and+"</td><td>"+value.or+
    "</td><td>"+value.xor+"</td><td>"+value.not_a+"</td><td>"+value.not_b+"</td><td>"+value.sum+"</td><td>"+value.carry+"</td></tr>";
})).join("");
const elementCards=technology.elements.map(e=>"<article class='card'><h2>"+e.title+"</h2><p class='eyebrow'>"+e.subtitle+
  "</p><p>"+e.description+"</p></article>").join("");
const layerCards=layers.map(l=>"<article class='card'><h3>"+l.label+"</h3><p>"+l.purpose+
  "</p><p class='muted'>Hardware examples · "+l.physical.join(", ")+"</p><p class='muted'>Software examples · "+
  l.software.join(", ")+"</p><p>"+l.deployment+"</p></article>").join("");
const topologyCards=technology.topologies.map(t=>"<article class='card'><h3>"+t.label+"</h3><p>"+t.description+"</p></article>").join("");
const sources=technology.sources.map(s=>"<li><a href='"+s.url+"'>"+s.label+"</a></li>").join("");

export const technologyPage=`<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Global Technology Stack · True Cloud Computing</title><style>${styles}</style>
<main>
<header><nav><a href="/">TRUE CLOUD COMPUTING BY NATHAN TABOR</a><a href="/api/technology">Technology API</a></nav>
<h1>The Global Technology Stack</h1></header>
<div class="grid">${elementCards}</div>
<section class="card probe" aria-labelledby="demo-title"><h2 id="demo-title">Run two bits through the stack</h2>
<div class="stack"><div>
<form id="gate-form"><label>Bit A<select name="a"><option value="0">0</option><option value="1" selected>1</option></select></label>
<label>Bit B<select name="b"><option value="0" selected>0</option><option value="1">1</option></select></label>
<button type="submit">Run live trace</button></form>
<output id="readout" aria-live="polite">Choose the bits to run a Worker and D1 check.</output>
</div><div class="truth"><table><caption>Gate and half-adder truth table</caption><thead>
<tr><th scope="col">A</th><th scope="col">B</th><th scope="col">AND</th><th scope="col">OR</th><th scope="col">XOR</th>
<th scope="col">¬A</th><th scope="col">¬B</th><th scope="col">Sum</th><th scope="col">Carry</th></tr>
</thead><tbody>${truthRows}</tbody></table></div></div>
</section>
<section class="section"><h2>The four layers in True Cloud Computing</h2><div class="grid">${layerCards}</div></section>
<section class="section"><h2>Global deployment patterns</h2><div class="grid">${topologyCards}</div></section>
<footer><details><summary>Technical references</summary><ul>${sources}</ul></details></footer>
</main><script src="/technology.js" defer></script></html>`;

export const technologyScript=`
const form=document.getElementById("gate-form");
const readout=document.getElementById("readout");
const button=form.querySelector("button");
form.addEventListener("submit",async event=>{
  event.preventDefault();
  button.disabled=true;
  readout.textContent="Tracing the request…";
  for(const row of document.querySelectorAll("tr[data-input]"))row.classList.remove("active");
  try {
    const response=await fetch("/api/technology/trace?"+new URLSearchParams(new FormData(form)));
    const result=await response.json();
    if(!response.ok)throw Error(result.error||"Trace unavailable");
    const selected=String(result.gates.a)+String(result.gates.b);
    for(const row of document.querySelectorAll("tr[data-input]"))row.classList.toggle("active",row.dataset.input===selected);
    const colo=result.layers.control.ingress_colo;
    readout.textContent="Sum "+result.gates.sum+" · Carry "+result.gates.carry+
      " · D1 read "+(result.layers.memory.read_verified?"verified":"unverified")+
      (colo?" · Cloudflare ingress "+colo:"");
  }catch(error){readout.textContent=error.message;}
  finally{button.disabled=false;}
});
`;

export const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Run the Nathan Tabor Labs quantum simulation, 4T Clover logic and THINKER edge demo."><title>Nathan Tabor Labs</title><style>
:root{--ink:#eff6f4;--sub:#b7c8c7;--page:#111b1d;--card:#192629;--line:#476368;--green:#baf783;--amber:#ffdb94;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--ink);font-family:system-ui,sans-serif;line-height:1.55}main{max-width:1160px;margin:auto;padding:clamp(20px,5vw,64px)}h1,h2,h3{line-height:1.05;margin:.3em 0 .5em}h1{font-size:clamp(3rem,8vw,6rem);letter-spacing:-.055em;max-width:680px}h2{font-size:1.8rem}h3{font-size:1.35rem}.name,.mono,.motto{font-family:ui-monospace,monospace}.name,.motto{color:var(--green)}.name{font-size:.9rem}.lead{font-size:1.15rem;max-width:650px;color:var(--sub)}nav{display:flex;gap:1rem;flex-wrap:wrap;margin:1.3rem 0 2rem}a{color:var(--green);text-underline-offset:.2em}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:1rem}.panel{border:1px solid var(--line);background:var(--card);padding:1.1rem;border-radius:.6rem}.panel p{color:var(--sub)}label{display:block;margin:.6rem 0}input,select,button{font:inherit;padding:.36rem .55rem;border-radius:.3rem;border:1px solid var(--line);color:var(--ink);background:var(--page)}input[type=number]{width:74px}button{background:var(--green);color:#152208;font-weight:700;border-color:var(--green);cursor:pointer}button:disabled{opacity:.65}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--amber);outline-offset:4px}output{display:block;min-height:5rem;margin-top:.8rem;font-family:ui-monospace,monospace;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--amber)}.below{margin-top:2rem;border-top:1px solid var(--line);padding-top:1.4rem}ul{padding-left:1.3rem}.mono{font-size:.94rem;color:var(--amber)}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.35rem;border-bottom:1px solid var(--line);font-size:.87rem}meter{width:65%;accent-color:var(--green);vertical-align:middle}.rollup{display:grid;gap:.35rem}button+button{margin-left:.5rem}
</style></head><body><main>
<header><p class="name">Nathan Tabor Labs · Public launch</p><h1>BAT SHIT<br>NATHAN TABOR<br>MODE</h1><p class="motto">innocence never a commodity</p><p class="lead">Run a quantum circuit simulation, trace a four-bit adder, and split an exact calculation across Cloudflare edge requests.</p></header>
<nav aria-label="Lab sections"><a href="#lab">Run the labs</a><a href="#receipts">Worker receipts</a><a href="#library">Book and Language Library</a></nav>
<section id="lab"><h2>Run the labs</h2><div class="grid">
<article class="panel"><h3>Sovereign Field Lab</h3><p>Two-qubit circuit and Gaussian wave-packet simulator.</p><form id="quantum"><label>Rotation <input name="angle" type="number" required min="0" max="180" value="90"> °</label><label>Relative phase <input name="phase" type="number" required min="-180" max="180" value="0"> °</label><label>Measure in <select name="basis"><option>Z</option><option>X</option></select></label><button>Simulate circuit</button></form><output id="quantum-result" aria-live="polite">Set 90° rotation and 0° phase for Φ+.</output><table id="probabilities" hidden><thead><tr><th scope="col">Outcome</th><th scope="col">Probability</th></tr></thead><tbody></tbody></table></article>
<article class="panel"><h3>4T Clover logic</h3><p>Four-bit ripple-carry adder companion.</p><form id="chip"><label>A <input name="a" required type="number" min="0" max="15" value="15"></label><label>B <input name="b" required type="number" min="0" max="15" value="15"></label><label>Carry in <select name="carry"><option>0</option><option selected>1</option></select></label><button>Trace the gates</button></form><output id="chip-result" aria-live="polite">The bit-by-bit carry trace appears here.</output></article>
<article class="panel"><h3>THINKER edge compute</h3><p>Partition 10,000 numbers across independent requests and combine the partial results.</p><form id="thinker"><label>Edge requests <select name="parts"><option>1</option><option>2</option><option>4</option><option selected>8</option></select></label><button>Run edge calculation</button></form><output id="thinker-result" aria-live="polite">Each response covers its own numbered range.</output></article>
</div></section>
<section class="below" id="receipts"><h2>Worker Bee &amp; Ant Bot receipts</h2><p>The Bee runs the calculations. The Ant checks the results against the known circuit, all 512 adder inputs, and independent formulas for the edge totals.</p><button id="checks">Run all five checks</button><button id="refresh">Refresh receipts</button><output id="check-result" aria-live="polite"></output><p id="window"></p><ul id="runs"></ul><a href="/api/receipts">Open machine-readable receipts</a></section>
<section class="below" id="library"><h2>Book and Language Library</h2><p>65 series and publishing families · 22,781 non-family catalog records · 4,879 language-family records. Manuscripts and author review require owner sign-in.</p><a href="https://nathan-tabor-library.nathantaboract.workers.dev/">Open owner library</a></section>
<section class="below"><h2>Source projects</h2><p>The lab combines numerical simulation, Boolean logic, and classical edge compute. THINKER TITAN and the physical 4T Clover remain design records.</p><nav><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/octopus-root/sovereign-fields">Sovereign Field Lab source</a><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/19">ONE Voice Box code</a></nav></section>
</main><script type="module" src="/app.js"></script></body></html>`;

export const ui=String.raw`
const get=id=>document.getElementById(id);
const int=new Intl.NumberFormat("en-US");
const percent=new Intl.NumberFormat("en-US",{style:"percent",maximumFractionDigits:2});
const date=new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short"});
async function api(path){
  const r=await fetch(path);
  if(!r.ok)throw Error("The lab returned "+r.status+". Try again.");
  return r.json();
}
function form(id,run){
  get(id).addEventListener("submit",async event=>{
    event.preventDefault();
    const button=event.currentTarget.querySelector("button"), data=new FormData(event.currentTarget);
    const out=get(id+"-result");
    button.disabled=true;
    out.textContent="Running…";
    try{await run(out,data);}catch(e){out.textContent=e.message;}
    finally{button.disabled=false;}
  });
}
function cells(values){
  const row=document.createElement("tr");
  for(const value of values){
    const x=document.createElement("td");
    if(value instanceof Node)x.append(value);else x.textContent=value;
    row.append(x);
  }
  return row;
}
form("quantum",async(out,data)=>{
  const args=new URLSearchParams(data), q=await api("/api/quantum?"+args);
  const basis=data.get("basis");
  const rows=q.basis.map((label,i)=>{
    const p=q.probabilities[basis][i], wrap=document.createElement("span"), bar=document.createElement("meter");
    bar.max=1;bar.value=p;bar.setAttribute("aria-label",label);
    wrap.append(bar," "+percent.format(p));
    return cells([label,wrap]);
  });
  get("probabilities").querySelector("tbody").replaceChildren(...rows);
  get("probabilities").hidden=false;
  out.textContent=basis+"-basis measurement · σ: "+(q.width.initialMeters*1e9).toFixed(3)+" → "+(q.width.finalMeters*1e9).toFixed(3)+" nm.";
});
form("chip",async(out,data)=>{
  const a=await api("/api/chip?"+new URLSearchParams(data));
  out.textContent=a.a+" + "+a.b+" + "+a.carryIn+" = "+a.value+"\nBits (low to high)\n"+a.stages.map(s=>"b"+s.bit+" · "+s.a+" + "+s.b+" + "+s.carryIn+" → sum "+s.sum+", carry "+s.carryOut).join("\n");
});
form("thinker",async(out,data)=>{
  const n=Number(data.get("parts"));
  const parts=await Promise.all(Array.from({length:n},(_,i)=>api("/api/shard?parts="+n+"&index="+i)));
  const sum=k=>parts.reduce((total,p)=>total+p[k],0);
  out.textContent=int.format(sum("count"))+" values · "+n+" request"+(n===1?"":"s")+"\nSum "+int.format(sum("sum"))+"\nSum of squares "+int.format(sum("squares"))+"\n"+parts.map(p=>int.format(p.start)+"–"+int.format(p.end)).join(" · ");
});
async function refresh(){
  try{
    const x=await api("/api/receipts");
    get("window").textContent=x.window?(x.active?"Window open":"Window closed")+" · "+date.format(x.window.started_ms)+"–"+date.format(x.window.ends_ms):"Window preparing";
    const bucket=x.counts.map(v=>v.source+" "+v.passed+"/"+v.runs+" passed").join(" · ");
    const rows=x.receipts.map(r=>{
      const e=document.createElement("li");e.textContent=date.format(r.scheduled_ms)+" · "+r.source+" · "+(r.passed?"passed":"failed");return e;
    });
    if(bucket){const e=document.createElement("li");e.textContent=bucket;rows.unshift(e);}
    get("runs").replaceChildren(...rows);
  }catch(e){get("window").textContent=e.message;}
}
get("checks").addEventListener("click",async()=>{
  const out=get("check-result");out.textContent="Running…";
  try{const x=await api("/api/checks");out.textContent=x.checks.map(c=>(c.passed?"PASS":"FAIL")+"  "+c.name).join("\n");}
  catch(e){out.textContent=e.message;}
});
get("refresh").addEventListener("click",refresh);
refresh();
`;

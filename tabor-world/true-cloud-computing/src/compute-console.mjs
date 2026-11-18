const style=`
:root{color-scheme:dark;--bg:#0b1016;--panel:#121c25;--line:#304555;--text:#ecf1eb;--muted:#adc0c7;--mint:#a2eed3;--gold:#f5d49d}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{max-width:1060px;margin:auto;padding:clamp(14px,4vw,45px)}nav,.actions{display:flex;flex-wrap:wrap;gap:9px 16px}nav{margin-bottom:24px;font-size:.88rem}a{color:var(--mint);text-underline-offset:.2em}h1{font-size:clamp(2.1rem,6.4vw,5rem);letter-spacing:-.055em;line-height:.99;margin:10px 0 13px}h2{font-size:1.18rem;line-height:1.2;margin:0 0 13px}p{margin:0 0 10px}header p,small{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:18px 0}.card{background:var(--panel);border:1px solid var(--line);padding:clamp(14px,3vw,24px);min-width:0}.card+.card.solo{margin-top:12px}label{display:grid;gap:4px;margin-bottom:10px}input,select,button{max-width:100%;min-height:42px;font:inherit;background:#0c151e;color:var(--text);border:1px solid #4a6a76;border-radius:4px;padding:6px 9px}button{background:var(--mint);color:#10251c;font-weight:720;cursor:pointer}button.secondary{background:#152934;color:var(--mint)}.row{display:grid;grid-template-columns:1fr 1fr;gap:8px}.stack{display:grid;gap:7px}.job{display:flex;justify-content:space-between;text-align:left;gap:10px;width:100%}.job span{overflow-wrap:anywhere}output{display:block;color:var(--gold);margin:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#0c151e;padding:10px;font-size:.8rem}footer{margin:18px 0}:focus-visible{outline:2px solid var(--gold);outline-offset:2px}@media(max-width:740px){.grid{grid-template-columns:1fr}}
`;
export const computePage=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nathan AI 2X+ Sovereign Supercomputer · Compute</title><style>${style}</style>
<main><header><nav><a href="/">True Cloud Computing</a><a href="/technology">Technology Stack</a><a href="/api/compute/manifest">Compute API</a><a href="/compute-platform">Sovereign job platform</a></nav>
<h1>NATHAN AI — NATHAN TABOR<br>2X+ SOVEREIGN SUPERCOMPUTER</h1>
<p>Submit an FP64 workload and inspect its verified receipt.</p></header>
<div class="grid"><section class="card"><h2>Box 0 · The Clearing Gate</h2>
<form id="job-form"><label>Project<select id="namespace"><option value="pie-pi-phi">Pie Pi Phi</option><option value="supercalifragilisticexpialidocious">Supercalifragilisticexpialidocious</option></select></label>
<label>Project token<input type="password" id="token" autocomplete="off" maxlength="256"></label>
<div class="row"><label>Seed<input type="number" id="seed" min="0" max="4294967295" value="73" required></label>
<label>Terms<input type="number" id="terms" min="64" max="4096" value="2048" required></label></div>
<div class="actions"><button>Submit job</button><button class="secondary" id="list" type="button">List project jobs</button></div></form>
</section><section class="card"><h2>Box 1 · The Compounding Engine</h2>
<label>Job ID<input id="job" maxlength="36" spellcheck="false" autocomplete="off"></label>
<div class="actions"><button id="inspect" type="button">Read job</button><button id="receipt" class="secondary" type="button">Read receipt</button><button id="cancel" class="secondary" type="button">Cancel job</button></div>
<div id="jobs" class="stack"></div></section></div>
<section class="card solo"><h2>Public benchmark</h2><p>Replay the fixed FP64 vector and verify its checksum. Timing appears when the runtime supplies a usable sample.</p>
<div class="actions"><button id="run" type="button">Run benchmark</button><button id="benchmarks" class="secondary" type="button">Read scheduled receipts</button></div></section>
<output id="notice" role="status"></output><pre id="result" hidden></pre>
<footer><a href="https://sovereign-ai-unit.nathantaboract.workers.dev/health">Sovereign AI Unit status</a></footer>
</main><script src="/compute-console.js" defer></script></html>`;

export const computeScript=`
const el=id=>document.getElementById(id);
let last=null,revision=0;
const action=async(path,options={})=>{
  const mine=++revision;
  el("notice").textContent="Working…";
  try{
    const headers={};
    if(path.startsWith("jobs")){
      const token=el("token").value.trim();
      if(!token)throw Error("Enter the project token.");
      headers.Authorization="Bearer "+token;
      headers["X-Tenant"]=el("namespace").value;
    }
    if(options.body)headers["Content-Type"]="application/json";
    if(options.key)headers["Idempotency-Key"]=options.key;
    const response=await fetch("/api/compute/"+path,{method:options.method||"GET",headers,body:options.body});
    const body=await response.json();
    if(!response.ok)throw Error(body.reason||body.error||"Request failed.");
    if(mine!==revision)return;
    if(body.id)el("job").value=body.id;
    if(body.jobs){
      const container=el("jobs");
      container.replaceChildren();
      for(const job of body.jobs){
        const row=document.createElement("button");
        row.type="button";row.className="job secondary";
        row.textContent=job.id.slice(0,8)+" · "+job.state;
        row.onclick=()=>{el("job").value=job.id;action("jobs/"+job.id);};
        container.append(row);
      }
    }
    el("result").textContent=JSON.stringify(body,null,2);
    el("result").hidden=false;
    el("notice").textContent=body.state||body.admission||"Result loaded";
  }catch(error){if(mine===revision)el("notice").textContent=error.message;}
};
el("job-form").onsubmit=event=>{
  event.preventDefault();
  const body=JSON.stringify({seed:Number(el("seed").value),terms:Number(el("terms").value)});
  const stamp=el("namespace").value+body;
  if(last?.stamp!==stamp)last={stamp,key:crypto.randomUUID()};
  action("jobs",{method:"POST",body,key:last.key});
};
el("list").onclick=()=>action("jobs");
el("run").onclick=()=>action("benchmark/probe");
el("benchmarks").onclick=()=>action("benchmarks");
for(const [id,suffix] of [["inspect",""],["receipt","/receipt"],["cancel","/cancel"]]){
  el(id).onclick=()=>action("jobs/"+encodeURIComponent(el("job").value.trim())+suffix,{method:id==="cancel"?"POST":"GET"});
}
`;

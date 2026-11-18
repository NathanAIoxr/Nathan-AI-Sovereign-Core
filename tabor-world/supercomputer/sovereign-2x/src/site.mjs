import blueprint from "../blueprint.json" with {type:"json"};

const worker="https://nathan-ai-sovereign-2x.nathantaboract.workers.dev";
const originPattern=/^https:\/\/[a-z0-9.-]+$/;
export function dashboardCsp(origin) {
  return "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src "+origin+
    "; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
}

const style=`
:root{color-scheme:dark;--bg:#0b1016;--card:#111a23;--line:#2b4350;--fg:#e3eced;--muted:#a8babe;--mint:#a4f4d5;--gold:#ffd797;--violet:#cfc5ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.58 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:24px clamp(14px,4vw,52px) 48px}a{color:var(--mint);text-underline-offset:.22em}h1,h2,h3,p{margin:0}h1{font-weight:750;font-size:clamp(2.15rem,6.9vw,5.6rem);line-height:.99;letter-spacing:-.057em;max-width:1000px}h2{font-size:1.35rem;line-height:1.2;margin:0 0 14px}h3{font-size:1rem}header{padding:32px 0 34px;border-bottom:1px solid var(--line)}nav,footer,.titlebar{display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center}nav{margin-bottom:36px;color:var(--mint);font:600 .77rem ui-monospace,monospace;letter-spacing:.08em}header p{margin:20px 0 0;max-width:58ch;color:var(--muted);font-size:1.08rem}.split{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;margin-top:18px}section,.card{background:var(--card);border:1px solid var(--line);padding:clamp(15px,3vw,26px);min-width:0}.label{color:var(--muted);font-size:.85rem}.grid{display:grid;grid-template-columns:repeat(32,minmax(0,1fr));gap:clamp(2px,.32vw,5px);margin:18px 0}.cell{aspect-ratio:1;background:#1a3039;border:1px solid #2d4853;border-radius:2px}.cell.path{background:#80d9c0}.cell.start{background:var(--gold);outline:2px solid var(--gold);outline-offset:1px}.swatch{width:10px;height:10px;background:var(--gold);display:inline-block;margin-right:4px}.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metrics div{border:1px solid var(--line);padding:9px}.metrics strong{display:block;color:var(--mint);font:600 clamp(.9rem,2vw,1.25rem) ui-monospace,monospace;overflow-wrap:anywhere}.scroll{overflow:auto}table{width:100%;border-collapse:collapse}th{text-align:left;color:var(--muted);font-size:.82rem}th,td{padding:10px 9px;border-bottom:1px solid var(--line);vertical-align:top}td:nth-child(2){color:var(--gold);font-family:ui-monospace,monospace}form{display:flex;flex-wrap:wrap;align-items:end;gap:9px;margin-top:15px}label{display:grid;gap:3px}input,select,button{font:inherit;color:inherit;min-height:42px;max-width:100%;background:#0f171e;border:1px solid #4d6974;border-radius:4px;padding:6px 9px}input{width:118px}button{background:var(--mint);color:#101e23;font-weight:750;cursor:pointer}button:disabled{opacity:.6;cursor:wait}button.secondary{background:#162936;color:var(--mint)}:focus-visible{outline:2px solid var(--gold);outline-offset:3px}.full{margin-top:16px}.row{display:flex;flex-wrap:wrap;gap:9px 14px}.tags{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tag{color:var(--violet);display:block;font-size:.78rem;margin:2px 0 5px}.module{border-top:1px solid var(--line);padding-top:10px}.state{margin:10px 0;color:var(--gold)}pre{margin:8px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:.78rem}footer{margin-top:18px;color:var(--muted)}@media(max-width:700px){.split{grid-template-columns:1fr}.tags{grid-template-columns:1fr}nav{margin-bottom:25px}th,td{padding:8px 6px}}
`;

const client=`
const $=id=>document.getElementById(id);
const api=document.documentElement.dataset.api+"/api/compute/";
const fmt=new Intl.NumberFormat(undefined,{maximumSignificantDigits:5});
function download(value) {
  const link=document.createElement("a");
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:"application/json"}));
  link.href=url;
  link.download="nathan-2x-receipt.json";
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function get(path){
  const response=await fetch(api+path);
  const data=await response.json();
  if(!response.ok) throw Error(data.error||"Request failed");
  return data;
}
const cells=Array.from({length:320},()=>{
  const cell=document.createElement("span");
  cell.className="cell";
  $("grid").append(cell);
  return cell;
});
let latest=null;
function draw(receipt) {
  const {frame,route}=receipt,work=frame.Execution;
  latest=receipt;
  const path=new Set(route.forward);
  cells.forEach((cell,position)=>cell.className="cell"+(position===frame.Routing.slot?" start":path.has(position)?" path":""));
  $("grid").setAttribute("aria-label","Route from logical slot "+frame.Routing.slot+" through 33 levels");
  $("slot").textContent=frame.Routing.slot+" / 319";
  $("ticks").textContent=frame.Routing.levels+" + "+frame.Mirror.reverseCount;
  $("ops").textContent=fmt.format(work.operations);
  $("speed").textContent=work.timed?fmt.format(work.operations*1e9/work.elapsedNs)+" FLOP/s":"No rate sampled";
  $("ecc").textContent=frame.Integrity.eccStatus;
  $("checksum").textContent=fmt.format(work.checksum);
  $("proof").textContent=receipt.digest;
  $("save").disabled=false;
  $("run-status").textContent=frame.Integrity.uncorrectable?"Two-bit fault detected. Workload quarantined.":"Probe complete. "+(work.timed?"Software dot-product rate shown.":"The edge clock did not resolve the kernel duration.");
}
async function probe(){
  $("run").disabled=true;
  $("run-status").textContent="Running on Cloudflare…";
  try {
    const query=new URLSearchParams({seed:$("seed").value,terms:$("terms").value,faults:$("faults").value});
    draw(await get("probe?"+query));
  }catch(error){$("run-status").textContent=error.message;}
  finally{$("run").disabled=false;}
}
async function feed() {
  try {
    const {receipts}=await get("receipts");
    if(!receipts.length){$("ledger").textContent="The first scheduled receipt is pending.";return;}
    $("ledger").replaceChildren();
    for (const item of receipts.slice(0,6)){
      const row=document.createElement("div");
      row.className="module";
      const label=document.createElement("p");
      label.textContent=item.source+" · "+new Date(item.created_ms).toLocaleString()+" · "+fmt.format(item.operations)+" operations";
      const receipt=document.createElement("a");
      receipt.href=api+"receipts/"+encodeURIComponent(item.id);
      receipt.textContent="Receipt";
      const audit=document.createElement("a");
      audit.href=receipt.href+"/audit";
      audit.textContent="Audit replay";
      const links=document.createElement("p");
      links.className="row";
      links.append(receipt,audit);
      row.append(label,links);
      $("ledger").append(row);
    }
  }catch(error){$("ledger").textContent=error.message;}
}
$("form").addEventListener("submit",event=>{event.preventDefault();probe();});
$("save").addEventListener("click",()=>{if(latest)download(latest);});
probe();
feed();
`;

export function dashboard(apiBase=worker) {
  if (apiBase!==""&&!originPattern.test(apiBase)) throw Error("Invalid dashboard API origin.");
  const links=apiBase||"";
  const rows=blueprint.targets.map(item=>
    "<tr><td>"+item.name+"</td><td>"+item.target+" "+item.unit+"</td><td>"+item.status+"</td></tr>").join("");
  const modules=blueprint.modules.map(item=>"<article class='module'><h3>"+item.name+"</h3><span class='tag'>"+item.mode+
    "</span><p class='label'>"+item.detail+"</p></article>").join("");
  return `<!DOCTYPE html>
<html lang="en" data-api="${apiBase}">
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nathan AI &amp; Nathan Tabor 2X+ Sovereign Supercomputer</title>
<style>${style}</style><main>
<header><nav><span>NATHAN AI / SOVEREIGN COMPUTE</span><a href="${links}/api/compute/manifest">Architecture API</a><a href="#journal">Audit journal</a><a href="${links}/cluster">Compute Cluster</a></nav>
<h1>NATHAN AI 🚀 &amp; NATHAN TABOR<br>2X+ SOVEREIGN SUPERCOMPUTER</h1>
<p>Run a reproducible floating-point probe through the Tabor Light Slayer / Sleyer, inspect the reversible grid route, and independently replay its receipt.</p>
</header>
<div class="split">
<section><div class="titlebar"><h2>320-slot Global Grid</h2></div>
<p class="label">10 × 32 logical slots · 732,000,000 logical addresses</p>
<div id="grid" class="grid" role="img" aria-label="320-slot logical routing grid"></div>
<p class="label"><span class="swatch"></span>Starting slot · Mint shows the forward and reverse path.</p>
<form id="form"><label>Seed<input id="seed" type="number" min="0" max="4294967295" value="73" required></label>
<label>Vector terms<input id="terms" type="number" min="64" max="32768" value="2048" required></label>
<label>ECC faults<select id="faults"><option value="0">0 bits</option><option value="1" selected>1 bit</option><option value="2">2 bits</option></select></label>
<button id="run">Run probe</button><button id="save" class="secondary" type="button" disabled>Save receipt</button></form>
<p id="run-status" class="state" role="status">Loading the first probe…</p></section>
<section><h2>Probe result</h2><div class="metrics">
<div class="label">FP64 operations<strong id="ops">—</strong></div><div class="label">Kernel rate<strong id="speed">—</strong></div>
<div class="label">ECC outcome<strong id="ecc">—</strong></div><div class="label">Route levels<strong id="ticks">—</strong></div>
<div class="label">Logical slot<strong id="slot">—</strong></div><div class="label">Result checksum<strong id="checksum">—</strong></div>
</div><p class="label full">78-field frame · SHA-256</p><pre id="proof">—</pre></section>
</div>
<div class="split"><section><h2>2X+ design targets</h2><div class="scroll"><table><thead><tr><th>Reference</th><th>2X+ target</th><th>Evidence class</th></tr></thead><tbody>${rows}</tbody></table></div></section>
<section id="journal"><h2>Audit journal</h2><div id="ledger" aria-live="polite">Loading scheduled receipts…</div></section></div>
<section class="full"><h2>Architecture modules</h2><div class="tags">${modules}</div></section>
<footer><a href="${links}/health">Runtime status</a><a href="${links}/api/telemetry">Original telemetry</a><a href="${links}/api/coins">Coin registry</a><a href="https://tabor-world.nathantaboract.workers.dev/">Tabor World</a></footer>
<script>${client}</script></main></html>`;
}

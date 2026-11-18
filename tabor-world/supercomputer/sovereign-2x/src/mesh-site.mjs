const style=`
:root{color-scheme:dark;--bg:#0b1016;--panel:#121c25;--line:#304555;--text:#eef1e9;--muted:#a8babc;--mint:#a4f4d5;--gold:#ffd797}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{width:min(1120px,100%);margin:auto;padding:clamp(14px,4vw,47px)}nav,.actions{display:flex;flex-wrap:wrap;gap:10px 16px}nav{margin:8px 0 26px}a{color:var(--mint);text-underline-offset:.2em}h1{font-size:clamp(2.3rem,6.6vw,5.35rem);letter-spacing:-.054em;line-height:.99;margin:0 0 14px}h2,h3,p{margin:0 0 10px}header{border-bottom:1px solid var(--line);padding-bottom:22px}header p,.muted{color:var(--muted)}.panels{display:grid;grid-template-columns:1.22fr 1fr;gap:13px;margin-top:14px}.card{border:1px solid var(--line);background:var(--panel);padding:clamp(14px,3vw,24px);min-width:0}.wide{margin-top:14px}form{display:flex;flex-wrap:wrap;align-items:end;gap:10px}label{display:grid;gap:4px}input,select,button{min-height:43px;max-width:100%;padding:6px 9px;border:1px solid #4c6571;border-radius:4px;background:#0d151c;color:var(--text);font:inherit}input{width:118px}button{background:var(--mint);color:#10231d;font-weight:720;cursor:pointer}button:disabled{opacity:.65;cursor:wait}output{display:block;margin:12px 0;color:var(--gold);overflow-wrap:anywhere}.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.metrics div{padding:8px;border:1px solid var(--line);font-size:.82rem;color:var(--muted)}.metrics strong{display:block;color:var(--mint);font:600 1.02rem ui-monospace,monospace;overflow-wrap:anywhere}.rows{padding:0;margin:8px 0 0;list-style:none}.rows li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;border-top:1px solid var(--line);padding:8px 0}.scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font:14px ui-monospace,monospace}td,th{text-align:left;border-bottom:1px solid var(--line);padding:8px 10px;white-space:nowrap}.proof{overflow-wrap:anywhere;color:var(--gold)}:focus-visible{outline:2px solid var(--gold);outline-offset:2px}@media(max-width:680px){.panels{grid-template-columns:1fr}}
`;

const script=`
const el=id=>document.getElementById(id);
const format=new Intl.NumberFormat();
let recent=null;
async function get(path){
  const r=await fetch("/api/cluster/"+path);
  const data=await r.json();
  if(!r.ok)throw Error(data.error||"Request failed");
  return data;
}
function row(list,label,links=[]){
  const item=document.createElement("li"),title=document.createElement("span");
  title.textContent=label;
  item.append(title);
  for(const [text,url] of links){
    const link=document.createElement("a");
    link.textContent=text;link.href=url;item.append(link);
  }
  list.append(item);
}
async function topology(){
  try{
    const p=await get("services");
    el("nodes").textContent=p.registered_physical_nodes??"—";
    el("services").replaceChildren();
    for(const s of p.services)row(el("services"),s.name+" · "+(s.reachable?"Reachable":"Unavailable"),s.url?[["Open",s.url]]:[]);
  } catch(error){el("services").textContent=error.message;}
}
async function journal(){
  try{
    const data=await get("receipts");
    el("ledger").replaceChildren();
    for(const r of data.receipts){
      const url="/api/cluster/receipts/"+encodeURIComponent(r.id);
      row(el("ledger"),r.source+" · "+new Date(r.created_ms).toLocaleString()+" · "+format.format(r.operations)+" operations",
        [["Receipt",url],["Replay audit",url+"/audit"]]);
    }
    if(!el("ledger").childElementCount)el("ledger").textContent="The first scheduled receipt is pending.";
  }catch(error){el("ledger").textContent=error.message;}
}
async function run(event){
  event.preventDefault();
  el("run").disabled=true;
  el("summary").textContent="Running the shards and replaying their results…";
  try{
    const data=await get("run?"+new URLSearchParams(new FormData(el("inputs"))));
    recent=data;
    const r=data.receipt;
    el("op").textContent=format.format(r.operations);
    el("checksum").textContent=format.format(r.checksum);
    el("duration").textContent=r.elapsed_ms===null?"Unavailable":r.elapsed_ms+" ms";
    el("workers").textContent=r.shard_count;
    el("hash").textContent=data.sha256;
    el("rows").replaceChildren();
    for(const shard of r.shards){
      const tr=document.createElement("tr");
      for(const value of [shard.index+1,shard.slot,shard.offset,shard.count,shard.checksum,shard.invocation.slice(0,8)]){
        const td=document.createElement("td");td.textContent=value;tr.append(td);
      }
      el("rows").append(tr);
    }
    el("download").disabled=false;
    el("summary").textContent="All shard results and the combined checksum verified.";
  }catch(error){el("summary").textContent=error.message;}
  finally{el("run").disabled=false;}
}
el("inputs").onsubmit=run;
el("download").onclick=()=>{
  if(!recent)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(recent,null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="nathan-fp64-cluster-receipt.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
topology();
journal();
`;

export const meshPage=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nathan AI 2X+ Sovereign Supercomputer · Compute Cluster</title><style>${style}</style>
<main>
<header><nav><a href="/">Supercomputer</a><a href="/api/cluster/services">Service status</a><a href="/api/cluster/receipts">Receipt API</a></nav>
<h1>NATHAN AI 🚀 &amp; NATHAN TABOR<br>2X+ SOVEREIGN SUPERCOMPUTER</h1>
<p>Split a single FP64 calculation across the Cloudflare executor and verify the combined result.</p></header>
<div class="panels"><section class="card"><h2>Compute cluster</h2>
<form id="inputs"><label>Seed<input type="number" name="seed" min="0" max="4294967295" value="73" required></label>
<label>Terms<input type="number" name="terms" min="64" max="16384" value="16384" required></label>
<label>Shards<select name="shards"><option>1</option><option>2</option><option>3</option><option selected>4</option></select></label>
<button id="run">Run workload</button><button type="button" id="download" disabled>Save receipt</button></form>
<output id="summary" role="status"></output><div class="metrics">
<div>FP64 operations<strong id="op">—</strong></div><div>Checksum<strong id="checksum">—</strong></div>
<div>Service invocations<strong id="workers">—</strong></div><div>End-to-end duration<strong id="duration">—</strong></div>
</div><p class="proof" id="hash"></p></section>
<section class="card"><h2>Connected services</h2><p class="muted">320 logical grid slots · 732,000,000 logical addresses</p>
<p class="muted">Registered physical nodes <strong id="nodes">—</strong></p><ul class="rows" id="services">Checking service bindings…</ul></section></div>
<section class="card wide"><h2>Shard results</h2><div class="scroll"><table><thead><tr><th scope="col">Shard</th><th scope="col">Slot</th><th scope="col">Offset</th><th scope="col">Terms</th><th scope="col">Checksum</th><th scope="col">Invocation</th></tr></thead><tbody id="rows"></tbody></table></div></section>
<section class="card wide"><h2>Receipt journal</h2><ul class="rows" id="ledger">Reading receipts…</ul></section>
</main><script src="/cluster.js" defer></script></html>`;

export {script as meshScript};

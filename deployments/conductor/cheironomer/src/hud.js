export const hud = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nathan AI Cheironomer</title><style>
:root{color-scheme:dark;font-family:system-ui;background:#102022;color:#e9f4eb}body{max-width:62rem;margin:0 auto;padding:2rem 1rem}h1{font-size:clamp(2rem,6vw,4.25rem);line-height:1.05;margin:.25rem 0 1rem}h2{font-size:1.15rem}nav,a{color:#80e6c3}section{border:1px solid #416662;padding:1rem;border-radius:.6rem;margin:1rem 0}label{display:block;margin:.75rem 0}button,input,select,textarea{font:inherit;padding:.6rem;max-width:100%}button{background:#a2edcf;color:#0d2825;border:0;border-radius:.3rem;margin:.2rem 0;cursor:pointer}.brake{background:#ff917a}pre,output{display:block;white-space:pre-wrap;overflow-wrap:anywhere}textarea{width:min(36rem,96%)}[hidden]{display:none!important}</style>
<header><div>Nathan AI · TAP THAT</div><h1>Cheironomer Command Deck</h1><a href="./operator/">Operator sign-in</a></header>
<section aria-label="Live clock"><h2>TIME ⇄ EMIT</h2><output id="clock" aria-live="polite">Connecting…</output></section>
<main id="controls" hidden>
<section><h2>1 + 1 = 2 · ARM</h2><button data-action="arm">Propose ARM</button> <button id="kill" class="brake">KILL · 1 − 1 = 0</button></section>
<section><h2>HOLD Zones and reader dispatch</h2>
<label>Namespace <select id="namespace"><option>omni_god</option><option>supernodes</option></select></label><label>Virtual identity <input id="identity" value="1"></label>
<button data-action="stage">Stage HOLD identity</button><label>Staged identity path <input id="path" value="hold/omni_god/1"></label>
<label>Reader <select id="source"><option>github</option><option>cloudflare</option><option>links</option></select></label>
<button data-action="dispatch">Propose bounded read</button> <button id="roots">Read terminal-root evidence</button></section>
<section><h2>DNS batch and promotion</h2><label>Zone manifest JSON <textarea id="domains" rows="3" placeholder='[{"domain":"example.com","zoneId":"…"}]'></textarea></label><button data-action="register-dns">Register HOLDING batch</button>
<label>Domain <input id="domain" autocomplete="off"></label><button data-action="holding">Propose HOLDING</button><button data-action="promote">Propose LIVE</button></section>
<section><h2>ALIEN ⇄ NEILA</h2><label>Proposal ID <input id="id" autocomplete="off"></label><label>SHA-256 proof <input id="proof" autocomplete="off"></label><button id="inspect">Inspect proposed command</button> <button id="approve">Submit independent proof</button></section>
<section><h2>Voice-to-Vault and TWEEZER-OS</h2><label>Audio <input id="audio" type="file" accept="audio/*"></label><button id="voice">Prepare voice transcript</button>
<label>Private transcript <textarea id="voiceText" rows="3"></textarea></label><button id="voiceTextSubmit">Prepare text proposal</button>
<button data-action="extract" data-tile="tap-that">TAP THAT</button> <button data-action="extract" data-tile="tweezer-os">TWEEZER-OS</button></section>
<section><h2>Risk simulation</h2>
<label>Stake units <input id="riskStake" inputmode="decimal" value="1"></label>
<label>Implied probability <input id="riskImplied" inputmode="decimal" value="0.5"></label>
<label>Estimated probability <input id="riskEstimated" inputmode="decimal" value="0.55"></label>
<label>Fee and slippage allowance <input id="riskFee" inputmode="decimal" value="0.02"></label>
<button id="riskCheck">Evaluate simulation</button><label>Simulation ID <input id="riskId" autocomplete="off"></label>
<button id="riskWin">Record simulated success</button> <button id="riskLoss">Record simulated loss</button>
</section>
<section><h2>Receipt</h2><pre id="receipt" aria-live="polite"></pre></section></main>
<script type="module" src="./hud.mjs"></script></html>`;

export const hudScript = `
const el=id=>document.getElementById(id);
const operator=location.pathname.endsWith("/operator/");
el("controls").hidden=!operator;
if (operator) document.querySelector("header a").href="../";
const base=operator?"../":"./";
async function clock(){try{const status=await (await fetch(base+"health")).json();el("clock").textContent=(status.paused?"HOLDING":"ARMED")+" · "+status.holdCapacity+" virtual identities · "+(status.audit??"waiting")+" · "+(status.lastTick?new Date(status.lastTick).toLocaleTimeString():"waking");}catch{el("clock").textContent="TIME unavailable";}}
await clock();
setInterval(clock,10000);
function show(info){el("receipt").textContent=JSON.stringify(info,null,2);if(info.mode==="SIMULATION"&&info.id)el("riskId").value=info.id;if(info.id&&info.proof){el("id").value=info.id;el("proof").value=info.proof;}}
async function post(path,body){try{const data=new Blob([JSON.stringify(body)],{type:"application/json"});show(await(await fetch("./"+path,{method:"POST",body:data})).json());await clock();}catch(e){show({error:e.message});}}
if (operator) {
  const socket=new WebSocket(new URL("./events",location.href).href.replace(/^http/,"ws"));
  socket.addEventListener("message",clock);
  document.querySelectorAll("[data-action]").forEach(button=>button.onclick=()=>{
    const action=button.dataset.action;
    let fields={};
    try {
      if(action==="stage")fields={namespace:el("namespace").value,id:el("identity").value};
      if(action==="dispatch")fields={identity:el("path").value,source:el("source").value};
      if(action==="register-dns")fields={domains:JSON.parse(el("domains").value)};
      if(action==="holding"||action==="promote")fields={domain:el("domain").value,identity:el("path").value};
      if(action==="extract")fields={tile:button.dataset.tile,payload:{gesture:"single_touch"}};
      return post("propose",{action,...fields});
    } catch(e) {show({error:e.message});}
  });
  el("riskCheck").onclick=()=>post("risk/gate",{unitStake:Number(el("riskStake").value),impliedProb:Number(el("riskImplied").value),
    trueProb:Number(el("riskEstimated").value),feeDrag:Number(el("riskFee").value)});
  el("riskWin").onclick=()=>post("risk/settle",{id:el("riskId").value,outcomeSuccess:true});
  el("riskLoss").onclick=()=>post("risk/settle",{id:el("riskId").value,outcomeSuccess:false});
  el("kill").onclick=()=>post("kill",{});
  el("inspect").onclick=async()=>{
    try {
      const data=await (await fetch("./proposal/"+encodeURIComponent(el("id").value))).json();
      if(!data.canonical)return show(data);
      const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(data.canonical));
      const proof=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
      if(proof!==data.proof)throw Error("ALIEN and NEILA hashes differ");
      show({...data,verified:true});
    } catch(e){show({error:e.message});}
  };
  el("approve").onclick=()=>post("approve",{id:el("id").value,proof:el("proof").value});
  el("roots").onclick=async()=>{try{show(await (await fetch("./roots?source="+el("source").value)).json());}catch(e){show({error:e.message});}};
  el("voiceTextSubmit").onclick=()=>post("voice/text",{transcript:el("voiceText").value});
  el("voice").onclick=async()=>{try{const file=el("audio").files[0];if(!file)throw Error("Select an audio file");show(await(await fetch("./voice",{method:"POST",body:file})).json());}catch(e){show({error:e.message});}};
}`;

export const consolePage = `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Tabor Build Loop</title>
<style>
:root{color-scheme:dark;background:#111819;color:#f4ecda;font:16px/1.55 system-ui,sans-serif;--accent:#edc98b;--line:#53635c}*{box-sizing:border-box}body{margin:0}main{width:min(58rem,100%);margin:auto;padding:clamp(16px,5vw,48px)}h1{font:clamp(44px,8vw,76px)/1 Georgia,serif;margin:.2em 0;letter-spacing:-.05em}h2{font:28px Georgia,serif;margin:.2rem 0}a{color:var(--accent)}section{background:#1d2928;padding:15px;margin-top:16px;border:1px solid var(--line)}form,label{display:grid;gap:6px}form{gap:12px}input,select,textarea,button{min-width:0;min-height:43px;max-width:100%;background:#111a1a;color:inherit;border:1px solid var(--line);border-radius:4px;padding:7px 10px;font:inherit}textarea{resize:vertical}button{cursor:pointer;color:var(--accent)}.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.row label{flex:1 1 235px}.accent{background:var(--accent);color:#131715;font-weight:700}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.85rem;background:#121b1b;padding:12px}input[type=checkbox]{min-height:0}label.checkbox{display:flex;gap:8px;align-items:center}small{color:#ced1c3}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
</style>
<main><h1>Tabor Build Loop</h1><p>Queue a build and inspect its receipt.</p><a href="/health">Public heartbeat</a>
<section><h2>Owner access</h2><label>Worker owner passphrase <input id="token" type="password" autocomplete="current-password"></label><small>Use the passphrase you set as LOOP_OWNER_TOKEN on the Worker.</small></section>
<section><h2>Queue a build</h2><form id="queue">
<label>Prompt <textarea id="prompt" maxlength="4000" required rows="4"></textarea></label>
<label>Build kind <select id="kind"><option value="module">JavaScript module</option><option value="probe">Deterministic probe</option></select></label>
<label class="checkbox"><input type="checkbox" id="publish"> Deliver to the GitHub draft branch</label>
<div class="row"><button class="accent">Queue build</button><button type="button" id="stats">Read queue status</button></div>
</form></section>
<section><h2>Check a build</h2><form id="lookup" class="row"><label>Job ID <input id="job" maxlength="36" required autocapitalize="off"></label><button>Read job and code</button><button type="button" id="deliver">Retry draft delivery</button></form>
<p id="event" role="status"></p><pre id="result" hidden></pre></section>
<script type="module" src="/console.mjs"></script></main></html>`;

export const consoleCode = `
const el = id => document.getElementById(id);
let serial = 0;
let previousRequest = null;
let lastKey = null;
async function call(name, args) {
  const owner = el("token").value.trim();
  if (!owner) throw new Error("Enter your Worker owner passphrase.");
  const result = await fetch("/mcp",{method:"POST",headers:{
    authorization:"Bearer "+owner,"content-type":"application/json",accept:"application/json, text/event-stream"
  },body:JSON.stringify({jsonrpc:"2.0",id:++serial,method:"tools/call",params:{name,arguments:args}})});
  if (result.status===401) throw new Error("The Worker did not accept that passphrase.");
  const body = await result.json();
  if (!result.ok || !body.result || body.result.isError) throw new Error(body.result?.content?.[0]?.text || "The command failed.");
  return body.result.structuredContent;
}
async function show(name,args) {
  el("event").textContent = "Working…";
  try {
    const data = await call(name,args);
    el("result").textContent = JSON.stringify(data,null,2);
    el("result").hidden = false;
    if(data.id) el("job").value = data.id;
    el("event").textContent = data.status ? "Job status · " + data.status : "Queue read";
  } catch(error) { el("event").textContent = error.message; }
}
el("queue").onsubmit = event => {
  event.preventDefault();
  const args={prompt:el("prompt").value,kind:el("kind").value,publish:el("publish").checked};
  const fingerprint = JSON.stringify(args);
  if(fingerprint!==previousRequest){previousRequest=fingerprint;lastKey=crypto.randomUUID();}
  show("queue_build",{...args,idempotency_key:lastKey});
};
el("lookup").onsubmit = event => {event.preventDefault();show("build_status",{id:el("job").value.trim(),include_code:true});};
el("stats").onclick=()=>show("build_queue_status",{});
el("deliver").onclick=()=>show("publish_build",{id:el("job").value.trim()});
`;

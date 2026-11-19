export const consolePage = `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Tabor Build Loop</title>
<style>
:root{color-scheme:dark;background:#111819;color:#f4ecda;font:16px/1.55 system-ui,sans-serif;--accent:#edc98b;--line:#53635c}*{box-sizing:border-box}body{margin:0}main{width:min(58rem,100%);margin:auto;padding:clamp(16px,5vw,48px)}h1{font:clamp(44px,8vw,76px)/1 Georgia,serif;margin:.2em 0;letter-spacing:-.05em}h2{font:28px Georgia,serif;margin:.2rem 0}a{color:var(--accent)}section{background:#1d2928;padding:15px;margin-top:16px;border:1px solid var(--line)}form,label{display:grid;gap:6px}form{gap:12px}input,select,textarea,button{min-width:0;min-height:43px;max-width:100%;background:#111a1a;color:inherit;border:1px solid var(--line);border-radius:4px;padding:7px 10px;font:inherit}textarea{resize:vertical}button{cursor:pointer;color:var(--accent)}.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.row label{flex:1 1 235px}.accent{background:var(--accent);color:#131715;font-weight:700}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.85rem;background:#121b1b;padding:12px}input[type=checkbox]{min-height:0}label.checkbox{display:flex;gap:8px;align-items:center}small{color:#ced1c3}.job-list{display:grid;gap:6px;margin:12px 0}.job-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;text-align:left;width:100%}.job-item span{overflow-wrap:anywhere}.badge{padding:2px 8px;border:1px solid var(--line);border-radius:4px;color:#d8e9d9;font-size:.86rem}.tools{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}[hidden]{display:none}:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
</style>
<main><h1>Tabor Build Loop</h1><p>Run builds, track dependencies, and inspect the generated code.</p><a href="/health">Public heartbeat</a>
<section><h2>Owner access</h2><label>Worker owner passphrase <input id="token" type="password" autocomplete="current-password"></label><small>Use the passphrase you set as LOOP_OWNER_TOKEN on the Worker.</small></section>
<section><h2>Queue a build</h2><form id="queue">
<label>Prompt <textarea id="prompt" maxlength="4000" required rows="4"></textarea></label>
<label>Build kind <select id="kind"><option value="module">JavaScript module</option><option value="probe">Deterministic probe</option></select></label>
<label class="checkbox"><input type="checkbox" id="publish"> Deliver to the GitHub draft branch</label>
<div class="row"><button class="accent">Queue build</button><button type="button" id="stats">Read queue status</button></div>
</form></section>
<section><h2>Build plan</h2>
<form id="plan">
<label>Plan title <input id="title" required maxlength="140" placeholder="Inventory tools"></label>
<label>Tasks <textarea id="tasks" rows="7" required spellcheck="false">[
  {"key":"inventory","prompt":"Export a function that totals item quantities."},
  {"key":"report","prompt":"Import the inventory function and format the total.","depends_on":["inventory"]}
]</textarea></label>
<small>Use up to 50 tasks. Each task takes a key and prompt, with optional depends_on, kind, and publish fields.</small>
<button class="accent">Queue plan</button>
</form>
<form id="find-plan" class="row tools"><label>Plan ID <input id="plan-id" maxlength="36" required spellcheck="false"></label><button>Read plan</button></form>
</section>
<section><h2>Queue controls</h2>
<form id="jobs" class="row">
<label>Job status <select id="filter"><option value="">All jobs</option><option>pending</option><option>running</option><option>waiting</option><option>blocked</option><option>generated</option><option>published</option><option>failed</option><option>cancelled</option></select></label>
<button>List jobs</button>
</form>
<div class="tools"><button type="button" id="pause">Pause new work</button><button type="button" id="resume">Resume queue</button></div>
<div id="job-list" class="job-list" aria-label="Jobs"></div>
</section>
<section><h2>Job and receipt</h2><form id="lookup" class="row"><label>Job ID <input id="job" maxlength="36" required autocapitalize="off"></label><button>Read job and code</button></form>
<div class="tools">
<button type="button" id="history">Read history</button><button type="button" id="retry">Retry job</button>
<button type="button" id="cancel">Cancel queued job</button><button type="button" id="deliver">Retry draft delivery</button>
</div></section>
<section aria-label="Result"><h2>Result</h2><p id="event" role="status">Enter your passphrase to load the queue.</p><pre id="result" hidden></pre></section>
<script type="module" src="/console.mjs"></script></main></html>`;

export const consoleCode = `
const el = id => document.getElementById(id);
let serial = 0;
const requests = new Map();
let activeResult = 0;
function repeatKey(name,args) {
  const fingerprint = JSON.stringify(args);
  const current = requests.get(name);
  if (current?.fingerprint === fingerprint) return current.key;
  const key = crypto.randomUUID();
  requests.set(name,{fingerprint,key});
  return key;
}
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
  const display = ++activeResult;
  el("event").textContent = "Working…";
  try {
    const data = await call(name,args);
    if (display !== activeResult) return;
    el("result").textContent = JSON.stringify(data,null,2);
    el("result").hidden = false;
    if (data.id && (name === "queue_build_plan" || name === "build_plan_status")) el("plan-id").value = data.id;
    else if (data.id) el("job").value = data.id;
    if (data.jobs || data.tasks) renderJobs(data.jobs || data.tasks);
    el("event").textContent = data.status ? "Job status · " + data.status :
      name === "queue_build_plan" ? "Plan queued" :
      name === "set_build_pause" ? (data.paused ? "Queue paused" : "Queue resumed") : "Result loaded";
  } catch(error) { if (display === activeResult) el("event").textContent = error.message; }
}
function renderJobs(jobs) {
  const list = el("job-list");
  list.replaceChildren();
  if (!jobs.length) list.textContent = "No matching jobs.";
  for (const job of jobs) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "job-item";
    const name = document.createElement("span");
    name.textContent = (job.task_key || job.file_path) +
      (job.depends_on?.length ? " · after " + job.depends_on.join(", ") : "");
    const status = document.createElement("span");
    status.className = "badge";
    status.textContent = job.status;
    row.append(name,status);
    row.onclick = () => {
      el("job").value = job.id;
      show("build_status",{id:job.id,include_code:true});
    };
    list.append(row);
  }
}
el("queue").onsubmit = event => {
  event.preventDefault();
  const args={prompt:el("prompt").value,kind:el("kind").value,publish:el("publish").checked};
  show("queue_build",{...args,idempotency_key:repeatKey("build",args)});
};
el("plan").onsubmit = event => {
  event.preventDefault();
  try {
    const args={title:el("title").value,tasks:JSON.parse(el("tasks").value)};
    show("queue_build_plan",{...args,idempotency_key:repeatKey("plan",args)});
  } catch { el("event").textContent = "Enter a valid JSON array of tasks."; }
};
el("find-plan").onsubmit = event => {
  event.preventDefault();
  show("build_plan_status",{id:el("plan-id").value.trim()});
};
el("jobs").onsubmit = event => {
  event.preventDefault();
  const status = el("filter").value;
  show("list_builds",status ? {status} : {});
};
el("lookup").onsubmit = event => {
  event.preventDefault();
  show("build_status",{id:el("job").value.trim(),include_code:true});
};
el("stats").onclick=()=>show("build_queue_status",{});
el("pause").onclick=()=>show("set_build_pause",{paused:true});
el("resume").onclick=()=>show("set_build_pause",{paused:false});
for (const [button,tool] of Object.entries({history:"build_history",retry:"retry_build",cancel:"cancel_build",deliver:"publish_build"})) {
  el(button).onclick=()=>show(tool,{id:el("job").value.trim()});
}
`;

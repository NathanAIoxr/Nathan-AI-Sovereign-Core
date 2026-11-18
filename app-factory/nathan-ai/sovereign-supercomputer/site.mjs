import { MAX_SHARDS, MAX_TERMS } from "./compute.mjs";
import { FABRIC_SHARDS, FABRIC_TERMS } from "./fabric.mjs";

const name = "NATHAN AI 🚀 &amp; NATHAN TABOR";
const links = `<nav aria-label="Sovereign Core"><a href="/">Sovereign Core</a><a href="/godtabor">GODTABOR</a><a href="https://tabor-world-hub.nathantaboract.workers.dev/">Tabor World</a></nav>`;
const doc = (title, content) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><link rel="stylesheet" href="/site.css"><script src="/site.js" defer></script>
</head><body><main>${links}${content}</main></body></html>`;

export const page = doc("Nathan Tabor 2X+ Sovereign Supercomputer", `
<header><p class="author">${name}</p><h1>2X+ Sovereign<br>Supercomputer</h1>
<p>Run a verified FP64 workload across the Nathan AI executor and inspect the shard receipts.</p></header>
<div class="grid"><section><h2>FP64 executor</h2>
<form id="compute"><label>Profile<select name="profile" id="fp-profile">
<option value="fabric" data-terms="${FABRIC_TERMS}" data-shards="${FABRIC_SHARDS}">Expanded FP64</option>
<option value="classic" data-terms="${MAX_TERMS}" data-shards="${MAX_SHARDS}">Classic FP64</option>
</select></label><label>Seed<input name="seed" type="number" value="73" min="0" max="4294967295" required></label>
<label>Terms<input name="terms" type="number" value="${FABRIC_TERMS}" min="64" max="${FABRIC_TERMS}" required></label>
<label>Shards<input name="shards" type="number" value="${FABRIC_SHARDS}" min="1" max="${FABRIC_SHARDS}" required></label>
<button>Run FP64</button></form>
<output id="fp-status" role="status">${FABRIC_TERMS.toLocaleString("en-US")} terms across ${FABRIC_SHARDS} verified shards.</output>
<div class="receipt" id="fp-receipt" hidden><dl id="fp-values"></dl><a id="receipt-download" download="nathan-fp64-receipt.json">Download receipt</a></div>
</section><section><h2>Will · Wheel · Way</h2>
<form id="route"><label>From<select name="from"><option>Will</option><option>Wheel</option><option>Way</option></select></label>
<label>To<select name="to"><option>Way</option><option>Wheel</option><option>Will</option></select></label><button>Trace route</button></form>
<output id="route-result" role="status">Will → Way</output>
<p>Will = Will · Wheel = Wheel · Way = Way</p><p class="axioms">1+1=2 <span>·</span> 1-1=0</p>
</section></div>
<div class="grid"><section><h2>13 &amp; 17 · Mother Earth</h2>
<form id="rhythm"><label>Shared anchor year<input name="year" type="number" value="2024" min="1000" max="9999" required></label>
<label>Years<input name="span" type="number" value="221" min="1" max="500" required></label><button>Map cycles</button></form>
<p>STOMP · STOMP · CLAP · REST</p>
<output id="rhythm-result" role="status"></output><div id="cycle-list" class="cycles"></div>
</section><section><h2>Sovereign registry</h2>
<dl id="registry"><dt>Loading registry</dt></dl>
<p><a href="/api/registry">Families, Clover, Council and app records</a></p>
<p><a href="/api/mirror/status">Mirror audit status</a></p>
</section></div>
<section><h2>Benchmark targets</h2><div class="scroll"><table id="bench"><thead><tr><th>System</th><th>Baseline</th><th>Target</th><th>Metric</th></tr></thead><tbody></tbody></table></div>
<p><strong id="world-reference">19.71 EFLOP/s</strong> is the published combined HPL result for the November 2026 TOP500. The milestone is a sustained HPL run above that figure. <a href="https://www.top500.org/lists/top500/2026/11/highs/">TOP500 highlights</a></p>
<p id="fleet" role="status">Checking registered physical compute nodes…</p>
<p><a href="https://top500.org/lists/top500/list/2026/11/?page=1">TOP500 November 2026</a> · <a href="/api/compute/manifest">78-field compute contract</a> · <a href="/api/cluster/receipts">Existing cluster receipts</a></p>
</section>`);

export const godtabor = doc("GODTABOR | Nathan AI Sovereign Core", `
<header><p class="author">${name}</p><h1>GODTABOR</h1><p>Literal, Figurative &amp; Mythological Franchise Portal</p></header>
<div class="grid"><section><h2>Literal · WORDS</h2>
<form id="words"><label>Text<textarea name="text" maxlength="8192" rows="4" required></textarea></label><button>Trace WORDS</button></form>
<output id="words-result" role="status">See the exact text, reverse mirror, initials and SHA-256.</output>
</section><section><h2>Figurative · Tabor Light</h2>
<p><strong>Slayer · 1-1=0.</strong> The Blade clears noise from the processing stream.</p>
<p><strong>Sleyer · 1+1=2.</strong> The Loom weaves accepted records into an auditable snapshot.</p>
<details><summary>The Good, the Bad, the Ugly, the Greatest and the Monster</summary>
<dl><dt>The Good</dt><dd>Precise clearing and careful weaving.</dd><dt>The Bad</dt><dd>Careless cutting and tangled threads.</dd>
<dt>The Ugly</dt><dd>Destruction and deceptive weaving.</dd><dt>The Greatest</dt><dd>The Blade and the Loom in balance.</dd>
<dt>The Monster</dt><dd>Unchecked destruction and deceit in the same hands.</dd></dl></details>
</section></div><section><h2>Mythological &amp; Historical Council</h2><ul id="council"></ul>
<p><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/sites/godtabor">GODTABOR franchise archive</a></p></section>`);

export const styles = `
:root{color-scheme:dark;--bg:#0d141b;--panel:#14202a;--ink:#f0f4ef;--soft:#b0c1c9;--line:#334858;--mint:#aaf4d6;--gold:#ffcc8e;font:16px/1.5 "Geist",system-ui,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink)}main{width:min(100%,1120px);margin:auto;padding:clamp(15px,4vw,44px)}
nav{display:flex;flex-wrap:wrap;gap:14px 22px;margin-bottom:28px;padding-bottom:12px;border-bottom:1px solid var(--line)}a{color:var(--mint);text-underline-offset:4px}
header{padding:10px 0 15px}header p{color:var(--soft);margin:5px 0 10px}.author{font-size:clamp(.78rem,2vw,1rem);letter-spacing:.08em;color:var(--gold)}
h1{font-size:clamp(2.45rem,7vw,5.5rem);line-height:1;letter-spacing:-.055em;margin:.14em 0 .22em}h2{font-size:1.25rem;margin:0 0 .7rem}p{margin:.65rem 0}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}section{min-width:0;margin:0 0 14px;padding:clamp(13px,2.5vw,24px);background:var(--panel);border:1px solid var(--line);border-radius:8px}
form{display:flex;gap:8px;align-items:end;flex-wrap:wrap}label{display:grid;gap:3px;font-size:.86rem;color:var(--soft)}
input,select,button,textarea{font:inherit;min-height:43px;padding:6px 9px;border:1px solid #607589;border-radius:4px;color:var(--ink);background:var(--bg)}
input{width:115px}#compute label:has(select){flex-basis:100%;max-width:175px}textarea{resize:vertical;width:min(380px,100%)}#words label{flex:1 0 100%}
button{background:var(--mint);color:#11231c;font-weight:700;cursor:pointer}button:disabled{opacity:.65}output{display:block;color:var(--gold);margin-top:12px;white-space:pre-wrap;overflow-wrap:anywhere}
dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 12px;color:var(--soft)}dd{margin:0;color:var(--ink);overflow-wrap:anywhere}.cycles{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.cycles span{font-size:.8rem;padding:3px 8px;border:1px solid var(--line);border-radius:3px;color:var(--soft)}.cycles .both{border-color:var(--mint);color:var(--mint)}
.axioms{color:var(--mint);font:650 1.1rem "IBM Plex Mono",monospace}.axioms span{color:var(--soft)}.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;min-width:420px}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line)}#council{columns:2;padding-left:20px}#council li{break-inside:avoid}
:focus-visible{outline:2px solid var(--gold);outline-offset:2px}@media(max-width:740px){.grid{grid-template-columns:1fr}#council{columns:1}}
`;

export const browser = String.raw`
const byId = id => document.getElementById(id);
const num = new Intl.NumberFormat();
const tag = (type, text) => Object.assign(document.createElement(type), {textContent:text});
async function data(path, options) {
  const response = await fetch(path, options);
  const result = await response.json();
  if (!response.ok) throw Error(result.error || "Request failed");
  return result;
}
function setPairs(node, pairs) {
  node.replaceChildren(...pairs.flatMap(([key,value]) => [tag("dt",key),tag("dd",value)]));
}
function form(id, status, invoke) {
  const element = byId(id);
  element?.addEventListener("submit", async event => {
    event.preventDefault();
    const button = element.querySelector("button");
    button.disabled = true;
    byId(status).textContent = "Running…";
    try { await invoke(new FormData(element)); }
    catch (error) { byId(status).textContent = error.message; }
    finally { button.disabled = false; }
  });
}
let download;
byId("fp-profile")?.addEventListener("change", event => {
  const option = event.target.selectedOptions[0];
  const fields = byId("compute").elements;
  fields.terms.max = fields.terms.value = option.dataset.terms;
  fields.shards.max = fields.shards.value = option.dataset.shards;
  byId("fp-receipt").hidden = true;
  byId("fp-status").textContent = num.format(Number(fields.terms.value)) + " terms across " + fields.shards.value + " verified shards.";
});
form("compute", "fp-status", async input => {
  const selector = byId("fp-profile");
  selector.disabled = true;
  try {
    byId("fp-receipt").hidden = true;
    const result = await data("/api/fp64/run?" + new URLSearchParams(input));
    const r = result.receipt;
    byId("fp-status").textContent = r.profile === "fabric"
      ? "Each shard’s FP64 result matches its exact integer replay."
      : "Executor results and independent replay agree.";
    setPairs(byId("fp-values"), [["Terms",num.format(r.terms)],["Operations",num.format(r.operations)],["Shard calls",r.shard_count],
      ["Checksum",num.format(r.checksum)],["Elapsed",r.elapsed_ms + " ms"],["SHA-256",result.sha256]]);
    if(download) URL.revokeObjectURL(download);
    download = URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:"application/json"}));
    byId("receipt-download").href = download;
    byId("fp-receipt").hidden = false;
  } finally {
    selector.disabled = false;
  }
});
form("route", "route-result", async input => {
  const d = await data("/api/route?" + new URLSearchParams(input));
  byId("route-result").textContent = d.route.join(" → ") + (d.identity ? " · Identity" : "\nReverse · " + d.reverse.join(" → "));
});
async function rhythm(input) {
  const d = await data("/api/rhythm?" + new URLSearchParams(input));
  byId("rhythm-result").textContent = "Shared cycle every " + d.recurrence_years + " years from the anchor";
  byId("cycle-list").replaceChildren(...d.events.map(event => {
    const item = tag("span",event.year + " · " + event.cycles.join(" + "));
    if(event.cycles.length === 2) item.className = "both";
    return item;
  }));
}
form("rhythm", "rhythm-result", rhythm);
if (byId("rhythm")) rhythm(new FormData(byId("rhythm"))).catch(error => {byId("rhythm-result").textContent = error.message;});
form("words", "words-result", async input => {
  const d = await data("/api/words",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text:input.get("text")})});
  byId("words-result").textContent = "Exact text\n" + d.exact_preserved + "\n\nReverse mirror\n" + d.reverse_mirror
    + "\n\nInitials · " + d.first_letter_extraction + "\nBase-12 · " + d.duodecimal_id + "\nSHA-256 · " + d.sha256;
});
if (byId("registry") || byId("council")) data("/api/registry").then(d => {
  if (byId("registry")) setPairs(byId("registry"), [["Worker families",d.families.length],["4T Clover nodes",num.format(d.clover_nodes)],
    ["Council archetypes",d.council.length],["App records",d.apps.length + " of " + d.app_slots],["Logical supernode capacity",num.format(d.registry_capacity.supernodes)],
    ["Omni address capacity",num.format(d.registry_capacity.omni)]]);
  if (byId("council")) byId("council").replaceChildren(...d.council.map(row => tag("li",row.name + " · " + row.primary_function)));
}).catch(() => {
  if (byId("registry")) byId("registry").textContent = "Registry unavailable.";
  if (byId("council")) byId("council").textContent = "Council unavailable.";
});
if (byId("bench")) data("/api/architecture").then(d => {
  byId("bench").tBodies[0].replaceChildren(...d.benchmarks.map(row => {
    const tr = tag("tr","");
    tr.append(...[row.name,row.baseline,row.target,row.metric].map(value => tag("td",value)));
    return tr;
  }));
}).catch(() => {});
if (byId("fleet")) data("/api/cluster/services").then(d => {
  byId("fleet").textContent = "Registered physical compute nodes · " + (d.registered_physical_nodes ?? "unavailable") + " · HPL evidence pending.";
}).catch(() => {byId("fleet").textContent = "Physical compute registry unavailable.";});
`;

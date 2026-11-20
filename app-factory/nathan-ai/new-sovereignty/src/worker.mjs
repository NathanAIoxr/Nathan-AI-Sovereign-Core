import { archive, gate, links, records, sources, trace } from "./canon.mjs";
import { digest, verifyGenesis } from "./proof.mjs";

const headers = {
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer"
};
const title = "New Sovereignty by Nathan Tabor";
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>
:root{color-scheme:dark;--paper:#f1e7cf;--ink:#171913;--surface:#22251d;--muted:#ccc7b5;--line:#4d5341;--accent:#e7c982}*{box-sizing:border-box}
body{margin:0;background:radial-gradient(ellipse at top right,#3a402a,transparent 60%),var(--ink);color:var(--paper);font:16px/1.6 system-ui,sans-serif}
main{max-width:1050px;margin:auto;padding:clamp(20px,6vw,70px) clamp(16px,5vw,42px)}
header{padding-bottom:24px;border-bottom:1px solid var(--line)}h1{font:clamp(53px,11vw,116px)/.92 Georgia,serif;letter-spacing:-.067em;margin:0 0 12px;color:var(--accent)}h2{font-size:21px;margin:0 0 8px}
p{margin:0 0 12px}.muted{color:var(--muted)}.grid{margin-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
section{min-width:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px}.wide{grid-column:1/-1}
label{display:block}select,button,input{font:inherit;max-width:100%}select,input[type=file]{margin:6px 0 10px}select{display:block;width:100%;min-width:0;background:#161a13;color:var(--paper);border:1px solid var(--line);border-radius:6px;padding:8px}
button{border:0;border-radius:6px;background:var(--accent);color:var(--ink);font-weight:700;padding:8px 12px;cursor:pointer;margin:4px 8px 8px 0}button:focus-visible,a:focus-visible,select:focus-visible{outline:2px solid #e5efb4;outline-offset:4px}button:disabled{opacity:.65}
a,summary{color:var(--accent)}summary{cursor:pointer}pre{max-width:100%;overflow:auto;padding:12px;background:#161a13;border-radius:7px}
li{margin-bottom:4px}ol,ul{padding-inline-start:22px}#facts p{margin-top:8px}
@media(max-width:630px){.grid{display:block}.grid section{margin-top:12px}}
</style><script type="module" src="./app.js"></script></head>
<body><main>
<header><h1>New Sovereignty</h1><p>by Nathan Tabor</p><p class="muted">Tabor Academy · Library of Tabor · Golden Goose</p></header>
<div class="grid">
<section class="wide"><h2>Trace it both ways</h2><label for="from">From</label><select id="from"></select><label for="to">To</label><select id="to"></select>
<button id="trace" type="button">Trace path</button><button id="reverse" type="button">Reverse direction</button><ol id="path" aria-live="polite"></ol></section>
<section><h2>Academy and project records</h2><label for="record">Open a record</label><select id="record"></select><div id="facts" aria-live="polite"></div></section>
<section><h2>Rebuild the Bitcoin genesis proof</h2><p class="muted">Work back from Golden Goose’s published result to the header, then calculate the proof from that header.</p>
<button id="proof" type="button">Run the proof</button><p id="proof-status" role="status"></p>
<details id="proof-details" hidden><summary>See header, nonce, target and hash</summary><pre id="proof-output"></pre></details></section>
<section class="wide"><h2>Verify your blueprint copy</h2><p class="muted">Compare the SHA-256 of your original text file in this browser. The file stays on your device.</p>
<label for="archive">Original blueprint file</label><input type="file" id="archive" accept=".txt,text/plain"><p id="archive-result" role="status"></p></section>
</div></main></body></html>`;

const client = `const get = id => document.getElementById(id);
const data = await fetch("./api/graph").then(response => response.json());
const byId = new Map(data.records.map(record => [record.id, record]));
for (const id of ["from", "to", "record"]) {
  for (const record of data.records) get(id).add(new Option(record.title, record.id));
}
function showRecord() {
  const record = byId.get(get("record").value);
  const root = get("facts");
  root.replaceChildren();
  for (const value of [record.detail, record.observation, record.authorInterpretation, record.historicalStatus]) {
    if (!value) continue;
    const line = document.createElement("p");
    line.textContent = value;
    root.append(line);
  }
  const citations = (record.sources ?? []).map(key => data.sources[key]);
  if (record.lab) citations.unshift({title: "Open project lab", url: record.lab});
  for (const citation of citations) {
    const link = document.createElement("a");
    link.textContent = citation.title;
    link.href = citation.url;
    const line = document.createElement("p");
    line.append(link);
    root.append(line);
  }
}
let pathRequest = 0;
async function showPath() {
  const request = ++pathRequest;
  const from = get("from").value;
  const to = get("to").value;
  const params = new URLSearchParams({from, to});
  const {path} = await fetch("./api/path?" + params).then(response => response.json());
  if (request !== pathRequest) return;
  const result = get("path");
  result.replaceChildren();
  for (const step of path) {
    const line = document.createElement("li");
    line.textContent = byId.get(step.from).title + " " + step.relation + " " + byId.get(step.to).title;
    result.append(line);
  }
  if (path.length === 0) {
    const line = document.createElement("li");
    line.textContent = byId.get(from).title;
    result.append(line);
  }
}
get("from").value = "golden-goose";
get("to").value = "tabor-academy";
get("record").value = "edubba-buddha";
get("record").addEventListener("change", showRecord);
get("trace").addEventListener("click", showPath);
get("reverse").addEventListener("click", async () => {
  const oldFrom = get("from").value;
  get("from").value = get("to").value;
  get("to").value = oldFrom;
  await showPath();
});
get("proof").addEventListener("click", async () => {
  const btn = get("proof");
  btn.disabled = true;
  get("proof-status").textContent = "Recalculating the proof from the 80-byte header.";
  try {
    const response = await fetch("./api/proof");
    if (!response.ok) throw new Error("Proof unavailable");
    const proof = await response.json();
    get("proof-status").textContent = proof.gate === "RETAIN_1"
      ? "The recalculated hash matches the published genesis hash and meets its target."
      : "The verification failed.";
    get("proof-output").textContent = JSON.stringify(proof.result, null, 2);
    get("proof-details").hidden = false;
  } catch {
    get("proof-status").textContent = "The proof could not run.";
  } finally {
    btn.disabled = false;
  }
});
get("archive").addEventListener("change", async event => {
  const [file] = event.target.files;
  const result = get("archive-result");
  if (!file) { result.textContent = ""; return; }
  if (file.size !== data.archive.bytes) {
    result.textContent = "Different byte count. This copy differs from the archived blueprint.";
    return;
  }
  const bytes = await file.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), b => b.toString(16).padStart(2, "0")).join("");
  if (event.target.files[0] !== file) return;
  result.textContent = hash === data.archive.sha256 ? "Exact copy verified." : "The SHA-256 differs from the archived blueprint.";
});
showRecord();
await showPath();
`;

function json(value, status = 200) {
  return Response.json(value, { status, headers });
}

export default {
  async fetch(request, env = {}) {
    if (request.method !== "GET") return json({ error: "Read-only" }, 405);
    const url = new URL(request.url);
    if (url.pathname === "/") return new Response(page, { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
    if (url.pathname === "/app.js") return new Response(client, { headers: { ...headers, "content-type": "text/javascript; charset=utf-8" } });
    if (url.pathname === "/api/graph") return json({ records, links, archive, sources });
    if (url.pathname === "/api/path") {
      const path = trace(url.searchParams.get("from"), url.searchParams.get("to"));
      return path ? json({ path }) : json({ error: "Unknown record" }, 404);
    }
    if (url.pathname === "/api/proof") {
      const result = await verifyGenesis();
      return json({ result, gate: gate({ consent: true, protectsInnocence: true, reproducible: result.matchesGoldenGooseEvidence && result.meetsTarget }) });
    }
    if (url.pathname === "/api/archive") {
      if (!env.BLUEPRINT_ARCHIVE) return json({ ...archive, verifiedInEnvironment: null });
      const bytes = await env.BLUEPRINT_ARCHIVE.get("sha256-" + archive.sha256, { type: "arrayBuffer" });
      const kvMatches = bytes?.byteLength === archive.bytes && await digest(bytes) === archive.sha256;
      if (!env.LIBRARY) return json({ ...archive, verifiedInEnvironment: kvMatches }, kvMatches ? 200 : 503);
      const row = await env.LIBRARY.prepare("SELECT verbatim_body FROM library_records WHERE record_id = ?")
        .bind(archive.sha256).first();
      const mirrorBytes = new TextEncoder().encode(row?.verbatim_body ?? "");
      const d1Matches = mirrorBytes.byteLength === archive.bytes && await digest(mirrorBytes) === archive.sha256;
      const verifiedInEnvironment = kvMatches && d1Matches;
      return json({ ...archive, verifiedInEnvironment, kvMatches, d1Matches }, verifiedInEnvironment ? 200 : 503);
    }
    if (url.pathname === "/api/health") {
      return json({ project: "new-sovereignty", environment: env.PROJECT_ENV ?? "local", archiveBound: Boolean(env.BLUEPRINT_ARCHIVE) });
    }
    return json({ error: "Unknown route" }, 404);
  }
};

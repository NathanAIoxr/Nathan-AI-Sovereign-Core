const APP_VERSION = "2026-11-19.2";
const APP_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#211a16">
<meta name="description" content="Browse the broadsheet archive and work through the pool ledger in a local sandbox."><title>TABORPOOL · Nathan Tabor</title>
<link rel="manifest" href="/app/manifest.webmanifest"><link rel="apple-touch-icon" href="/app/icon-192.png"><link rel="stylesheet" href="/app/style.css">
<script type="module" src="/app/main.js"></script></head>
<body><div class="top"><div class="wrap"><a class="brand" href="/">TABORPOOL</a><nav aria-label="Project"><a href="/">Magazine</a><a href="/magazine/play">Play</a><a href="/api/profile">Profile</a></nav></div></div>
<main><header class="hero"><div class="wrap"><h1>TABORPOOL</h1><p>Browse the broadsheet archive and work through the pool ledger in a local sandbox.</p><div class="tools"><a class="button" href="#archive">Browse archive</a><a class="button secondary" href="#ledger">Open ledger</a><button id="install" class="secondary" type="button" hidden>Install app</button></div><p id="install-help" class="status" aria-live="polite" hidden></p></div></header>
<div class="wrap layout">
<section id="archive" class="panel"><h2>Broadsheet archive</h2><label>Search archives<input id="search" type="search" placeholder="Title, collection, or filename"></label>
<p class="status" id="archive-status" role="status"></p><ul id="archive-list" class="archive"></ul>
<div><h3>Verify a source file</h3><p class="muted">Compare a local copy to its archived SHA-256 value.</p>
<form id="verify-file"><label>Archived version<select id="source-check"></select></label><label>Local file<input id="file-check" type="file" required></label><button>Verify checksum</button></form><p class="status" id="file-status" role="status"></p></div></section>
<section id="ledger" class="panel"><h2>Pool ledger sandbox</h2><p class="muted">Entries stay on this device. Units are for simulation.</p>
<form id="ledger-form"><label>Register<select id="register"><option value="BROADSHEET">Broadsheet</option><option value="TREASURY">Treasury</option><option value="POOL_DISTRIBUTION">Pool distribution</option></select></label>
<label>Archive record<select id="source" required></select></label><label>Units<input id="units" type="number" value="0" min="-1000000" max="1000000" step="1" required></label>
<div class="tools"><button>Add entry</button><button type="button" class="secondary" id="export">Export CSV</button><button type="button" class="secondary" id="clear-ledger">Clear entries</button></div></form>
<div class="metrics" id="balances"></div><div class="scroll" tabindex="0" aria-label="Ledger entries"><table><thead><tr><th scope="col">Register</th><th scope="col">Record</th><th scope="col">Units</th></tr></thead><tbody id="ledger-rows"></tbody></table></div>
<p class="status" role="status" id="ledger-status"></p></section></div></main><footer class="wrap">Nathan Tabor · <a href="/">Project website</a> · <a href="/health">Live status</a></footer></body></html>
`;
const APP_CSS = `:root{color-scheme:dark;--paper:#edf1ef;--soft:#b5c0c1;--line:#34404a;--base:#10191f;--panel:#17242b;--field:#111b21;font:16px/1.55 "Instrument Sans",system-ui,sans-serif;background:var(--base);color:var(--paper)}
*{box-sizing:border-box}body{margin:0}a{color:var(--accent);text-underline-offset:.22em}a:hover{text-decoration-thickness:2px}
a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.wrap{width:min(72rem,calc(100% - 2.5rem));margin:auto}.top{position:relative;z-index:1;border-bottom:1px solid var(--line);background:var(--base)}
.top .wrap{display:flex;justify-content:space-between;align-items:center;gap:1rem;min-height:4.5rem}.brand{color:var(--paper);font-weight:800;letter-spacing:.12em;text-decoration:none}.top nav{display:flex;gap:1rem;flex-wrap:wrap}
header.hero{border-bottom:1px solid var(--line);background:radial-gradient(ellipse at 90% 5%,var(--glow),transparent 56%),var(--base)}
.hero .wrap{padding:clamp(2.5rem,8vw,6rem) 0 clamp(2rem,6vw,4rem)}.hero p{max-width:38rem;color:var(--soft);margin:0 0 1.4rem}
h1,h2,h3{font-family:"Instrument Sans",system-ui,sans-serif;line-height:1.05;letter-spacing:-.04em}
h1{font-size:clamp(3rem,11vw,7rem);margin:0 0 .7rem}h2{font-size:clamp(1.65rem,4vw,2.25rem);margin:0 0 1rem}h3{font-size:1.2rem;margin:.2rem 0 .6rem}
.tools{display:flex;gap:.65rem;flex-wrap:wrap;align-items:center}.button,button{cursor:pointer;border:1px solid var(--accent);background:var(--accent);color:var(--base);border-radius:.38rem;padding:.65rem .85rem;font:inherit;font-weight:700;text-decoration:none;min-height:44px}
button.secondary,.button.secondary{border-color:var(--line);background:var(--field);color:var(--paper)}button:disabled{opacity:.5;cursor:default}
.layout{display:grid;grid-template-columns:repeat(12,1fr);gap:1rem;padding:1rem 0 2.5rem}.panel{grid-column:span 6;min-width:0;border:1px solid var(--line);border-radius:.65rem;background:var(--panel);padding:clamp(1rem,3vw,1.75rem);scroll-margin-top:1rem}.wide{grid-column:1/-1}
p{margin:.45rem 0 1rem}.muted,small{color:var(--soft)}label{display:grid;gap:.3rem;font-weight:650;margin-bottom:.8rem}
input,select{width:100%;min-width:0;min-height:44px;padding:.55rem .7rem;background:var(--field);color:var(--paper);border:1px solid var(--line);border-radius:.35rem;font:inherit}
input[type=file]{font-size:.93rem}code{font-family:ui-monospace,monospace;overflow-wrap:anywhere}.readout{color:var(--accent);font-size:1.45rem;font-weight:700;line-height:1.1}.metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;margin:1rem 0}.metric{padding:.75rem;background:var(--field);border-radius:.4rem}.metric small{display:block;margin-top:.25rem}.status{min-height:1.55em;margin:.75rem 0 0;color:var(--accent)}
.slots,.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 .7rem}.field-diagram{display:block;width:100%;border:1px solid var(--line);border-radius:.45rem;background:var(--field);margin:.75rem 0;aspect-ratio:2 / 1}.stage{min-height:2.8em}.archive{list-style:none;padding:0;margin:0}.archive li{padding:.7rem 0;border-top:1px solid var(--line)}.archive h3{margin:0}.archive p{margin:.35rem 0}.archive small{display:block;overflow-wrap:anywhere}.scroll{overflow-x:auto}.scroll:focus-visible{outline:2px solid var(--accent)}
table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;padding:.45rem;border-bottom:1px solid var(--line);white-space:nowrap}footer.wrap{border-top:1px solid var(--line);padding:1.2rem 0 2.4rem;color:var(--soft)}
@media(max-width:730px){.panel{grid-column:1/-1}.wrap{width:calc(100% - 1.5rem)}.top nav{gap:.7rem;font-size:.9rem}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}

:root{--base:#211a16;--field:#272019;--panel:#31271f;--accent:#f1c98c;--glow:#623f29;--line:#594638;--paper:#f6eee4;--soft:#d6c4ac}
[hidden]{display:none!important}
`;
const APP_CLIENT = `const byId = id => document.getElementById(id);
const install = byId("install");
let installPrompt;
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  install.hidden = false;
});
install.addEventListener("click", async () => {
  if (!installPrompt) return;
  try {
    await installPrompt.prompt();
  } finally {
    installPrompt = undefined;
    install.hidden = true;
  }
});
const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
if (ios && navigator.standalone !== true && !matchMedia("(display-mode: standalone)").matches) {
  const hint = byId("install-help");
  hint.textContent = "In Safari, use Share → Add to Home Screen.";
  hint.hidden = false;
}
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/app/sw.js").catch(() => {});
}

function loadSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
function metric(value, label) {
  const item = document.createElement("div");
  item.className = "metric";
  const number = document.createElement("div");
  number.className = "readout";
  number.textContent = value;
  const detail = document.createElement("small");
  detail.textContent = label;
  item.append(number, detail);
  return item;
}

const RECORDS = [
  {
    "id": "codex-1.txt",
    "title": "Codex 1",
    "category": "TABOR source",
    "summary": "TaborUniverse, The Living Threshold and historic print zones.",
    "sha256": "e98e6f84ec6fda3a983929a8a9049f4d2ff6e3e52b47c119a08899bbaa0c07c8"
  },
  {
    "id": "taborpool-source-manifesto.txt",
    "title": "The TABORPOOL Manifesto",
    "category": "TABOR source",
    "summary": "Recovered source transcription and operating principles.",
    "sha256": "3460a2e00de8aca4b0426836dee38d15b2b35ff5fab42ef4326807c144a90eb1"
  },
  {
    "id": "taborpool_engine.py",
    "title": "TABORPOOL archetype engine",
    "category": "TABOR source",
    "summary": "Recovered Python simulation.",
    "sha256": "a940e4a4cfc220a10a8b5c3c71f7197da70cbddee4862066405829459209b9bf"
  },
  {
    "id": "taborpool_demo.json",
    "title": "TABORPOOL simulation demo",
    "category": "TABOR source",
    "summary": "Recovered JSON output for a local simulation.",
    "sha256": "7c7f7cd97d21457a76f6c8cf6174d0908d513eeaa1b849a94a45a9e15cb3b600"
  },
  {
    "id": "chronicling-america",
    "title": "Chronicling America",
    "category": "Public collection",
    "summary": "Historic American newspapers at the Library of Congress.",
    "url": "https://www.loc.gov/collections/chronicling-america/"
  }
];
const LABELS = {BROADSHEET:"Broadsheet",TREASURY:"Treasury",POOL_DISTRIBUTION:"Pool distribution"};
const LEDGER_KEY = "taborpool:ledger:v1";
const eligible = RECORDS.filter(record => !record.url);
const recordsById = new Map(RECORDS.map(record => [record.id,record]));
const doc = byId("source");
const check = byId("source-check");
for (const record of eligible) {
  doc.add(new Option(record.title,record.id));
  check.add(new Option(record.title,record.id));
}
function showArchive() {
  const term = byId("search").value.trim().toLocaleLowerCase();
  const matches = RECORDS.filter(record => [record.id,record.title,record.category,record.summary].join(" ").toLocaleLowerCase().includes(term));
  byId("archive-status").textContent = matches.length ? matches.length + (matches.length === 1 ? " record" : " records") : "No matching records.";
  byId("archive-list").replaceChildren(...matches.map(record => {
    const item = document.createElement("li");
    const heading = document.createElement("h3");
    if (record.url) {
      const link = document.createElement("a");
      link.href = record.url;
      link.textContent = record.title;
      heading.append(link);
    } else heading.textContent = record.title;
    const summary = document.createElement("p");
    summary.textContent = record.summary;
    const info = document.createElement("small");
    info.textContent = record.sha256 ? record.id + " · SHA-256 " + record.sha256 : record.category;
    item.append(heading,summary,info);
    return item;
  }));
}
byId("search").addEventListener("input",showArchive);
showArchive();

const fileField = byId("file-check");
let checkSerial = 0;
byId("verify-file").addEventListener("submit",async event => {
  event.preventDefault();
  const status = byId("file-status");
  const file = fileField.files[0];
  const selected = recordsById.get(check.value);
  const attempt = ++checkSerial;
  if (!file || !selected?.sha256 || file.size > 50 * 1024 * 1024) {
    status.textContent = "Select a source file under 50 MB.";
    return;
  }
  status.textContent = "Checking SHA-256…";
  try {
    const digest = await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
    const hex = Array.from(new Uint8Array(digest),byte => byte.toString(16).padStart(2,"0")).join("");
    if (attempt === checkSerial) status.textContent = hex === selected.sha256 ? "SHA-256 matches " + selected.id + "." : "SHA-256 differs from " + selected.id + ".";
  } catch {
    if (attempt === checkSerial) status.textContent = "This file could not be verified.";
  }
});
for (const field of [fileField,check]) field.addEventListener("change",() => { checkSerial += 1; byId("file-status").textContent = ""; });

function validEntry(entry) {
  return entry && Object.hasOwn(LABELS,entry.register) && eligible.some(record => record.id === entry.source) &&
    Number.isInteger(entry.units) && Math.abs(entry.units) <= 1000000 && (entry.register !== "BROADSHEET" || entry.units === 0);
}
const saved = loadSaved(LEDGER_KEY,[]);
let entries = Array.isArray(saved) ? saved.filter(validEntry).slice(0,200) : [];
const register = byId("register");
const units = byId("units");
const ledgerStatus = byId("ledger-status");
function lockUnits() {
  const isBroadsheet = register.value === "BROADSHEET";
  if (isBroadsheet) units.value = 0;
  units.disabled = isBroadsheet;
}
function render() {
  const totals = Object.fromEntries(Object.keys(LABELS).map(key => [key,0]));
  const counts = {...totals};
  for (const entry of entries) {
    totals[entry.register] += entry.units;
    counts[entry.register] += 1;
  }
  byId("balances").replaceChildren(metric(counts.BROADSHEET,"Broadsheet entries"),
    metric(totals.TREASURY,"Treasury units"),metric(totals.POOL_DISTRIBUTION,"Pool distribution units"),metric(entries.length,"Total entries"));
  byId("ledger-rows").replaceChildren(...entries.slice().reverse().map(entry => {
    const row = document.createElement("tr");
    for (const value of [LABELS[entry.register],recordsById.get(entry.source).title,entry.units]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  }));
  byId("export").disabled = entries.length === 0;
  byId("clear-ledger").disabled = entries.length === 0;
}
register.addEventListener("change",lockUnits);
byId("ledger-form").addEventListener("submit",event => {
  event.preventDefault();
  if (entries.length >= 200) {
    ledgerStatus.textContent = "This sandbox holds 200 entries. Export and clear to start a new ledger.";
    return;
  }
  const entry = {register:register.value,source:doc.value,units:units.valueAsNumber};
  if (!validEntry(entry)) {
    ledgerStatus.textContent = "Select a record and enter a whole number within the range.";
    return;
  }
  entries.push(entry);
  ledgerStatus.textContent = saveLocal(LEDGER_KEY,entries) ? "Entry saved on this device." : "Entry added for this session. Browser storage is unavailable.";
  render();
});
byId("clear-ledger").addEventListener("click",() => {
  if (!window.confirm("Clear this browser’s TABORPOOL ledger?")) return;
  if (!saveLocal(LEDGER_KEY,[])) {
    ledgerStatus.textContent = "This browser could not clear the saved ledger.";
    return;
  }
  entries = [];
  render();
  ledgerStatus.textContent = "Ledger cleared.";
});
byId("export").addEventListener("click",() => {
  const csv = ["register,source,units",...entries.map(entry => [entry.register,entry.source,entry.units].join(","))].join("\\r\\n");
  const url = URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = "taborpool-simulation-ledger.csv";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
lockUnits();
render();
`;
const APP_MANIFEST = {
  "id": "/app/",
  "name": "TABORPOOL",
  "short_name": "TABORPOOL",
  "start_url": "/app/",
  "scope": "/app/",
  "display": "standalone",
  "background_color": "#211a16",
  "theme_color": "#211a16",
  "icons": [
    {
      "src": "/app/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/app/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
};
const APP_SW = `const NAME = "taborpool-app-";
const CACHE = NAME + "2026-11-19.2";
const SHELL = ["/app/","/app/style.css","/app/main.js","/app/manifest.webmanifest","/app/icon-192.png","/app/icon-512.png"];
self.addEventListener("install",event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate",event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(NAME) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch",event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || !SHELL.includes(url.pathname)) return;
  event.respondWith(fetch(event.request).catch(async () => {
    const cache = await caches.open(CACHE);
    return await cache.match(url.pathname) || Response.error();
  }));
});
`;
const APP_ICONS = {
  "192": "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAADdvvtQAAAD7ElEQVR42u3dS2wUdRzA8Zml9rG0VInbl6QtKWAoFZGYYjwoFxO1JtqT4UAIp5rokUDQA3KkF73ixRjigcSkhPA4qIRoYqyJCRUkkV4oJrRSfFDSItVkvXiR7HZhdXdm/n4+19nt7ky/+/vPPrIbr+/piKBaOYcAASEgBISAQEAICAEhIBAQAkJACAgEhIAQEAICASEgBISAEBAICAEhIAQEAkJACAgBgYAQEKnTkJ67cmFiv//Hfdo2Op6SexKn4RvKpJPdkhIOSDpZzyixgKQTRkY59QQjkaOaU4+GshSQegI7wjn1aCh750AEIxfkw4K6HW0TiCwEZPyEOoRMIFIfkPET8BAygRAQAkJACAgEhIAQEAICASEgBISAQEAICAEhIBAQAkJACAgBgYAQEAJCQCAgBISAEBAIiJpoyPS9333g2MUrszX642eOjvV0tD/oDcVxlG9pbMs3rWlt2dRf2DzQNfxE78a+goC4L8VitLi0vLi0PHfz9pWrN06d/z6KoqGN3btGto88v8USRjUuTc++8/7psXePz80vCIgqTU7N7Dn48fUbtwRElX76+fbYoeN3fv9DQFTpx7nfPpyYdBKdCseO7F75Am+/d+rMF5dLbvr2k32rVv3bx093Yc3ZD974xxn0nbvTM/Mnz1068fl3xWLpa3104ps9rw2vbmk0gbj3OXxrvumpzesOvfni+L5Xc3Fc8mJ3l/+cnJqxhLGSF559fGRn2eftX09dFRAVvPzcYLlNczcXBEQFvd2PlNv0y60lAVFBMSqucLYkICq4dv3XcpvWtq8WEBWc/fJyuU2dj7YJiJV8+tUPp8+XDeiZrf1h7KZ34/9ji0vL09fmT567OPFZ2RcSmxobdjzZJyCi2fmFbaPjD3qtYF6GtoQlYF3nw3tHdwSzOwKqq8La1qOHX29pfiiYPbKE1c/TQ72H33rpsc72kHZKQPUwONC1a2T7KzuHgnn9UEC1EsdRvrmxNd/U3ta8obcwONA1vLVvU78P1VPKPZ8H+h9yEo2AEBACQkAgIASEgBAQCAgBkWLx+p6OWt/GhYn9DnRSqvjApAmEJQwBISAQEAJCQAgIBISAEBACAgEhIASEgBAQCAgBISAEBAJCQAgIAYGAEBACQkAgIASEgBAQAqqtWn9JFgkeeRMIARF8QFaxINcvE4jsBGQIhTd+TCD1ZCogQ8gSpiHjJ+klTEMhHdt6/FZGSX5AI4yHZWIBySiMoZ5wQDLK+vlAKgKSUXbPI1MUEJ7GIyAQEAJCQAgIBISAEBACAgEhIASEgEBACAgBISAEBAJCQAgIAYGAEBACQkAgIASEgBAQ/O0v9JXW1vajNokAAAAASUVORK5CYII=",
  "512": "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"
};

const CONTENT_TYPES = {
  "/app/": "text/html; charset=utf-8",
  "/app/style.css": "text/css; charset=utf-8",
  "/app/main.js": "text/javascript; charset=utf-8",
  "/app/sw.js": "text/javascript; charset=utf-8",
  "/app/manifest.webmanifest": "application/manifest+json; charset=utf-8"
};
const APP_RESOURCES = {
  "/app/": APP_HTML,
  "/app/style.css": APP_CSS,
  "/app/main.js": APP_CLIENT,
  "/app/sw.js": APP_SW,
  "/app/manifest.webmanifest": JSON.stringify(APP_MANIFEST)
};
const APP_CSP = "default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";

export function webResponse(request, url) {
  if (!["GET","HEAD"].includes(request.method)) return null;
  const path = url.pathname;
  if (path === "/app") return Response.redirect(new URL("/app/",url),308);
  if (path === "/app/version") return Response.json({entity:"TABORPOOL",version:APP_VERSION},{headers:{"cache-control":"no-store"}});
  const headers = {"cache-control":"no-cache","x-content-type-options":"nosniff"};
  if (Object.hasOwn(APP_RESOURCES,path)) {
    headers["content-type"] = CONTENT_TYPES[path];
    if (path === "/app/") headers["content-security-policy"] = APP_CSP;
    return new Response(request.method === "HEAD" ? null : APP_RESOURCES[path],{headers});
  }
  const icon = /^\/app\/icon-(192|512)\.png$/.exec(path)?.[1];
  if (!icon) return null;
  headers["content-type"] = "image/png";
  const image = request.method === "HEAD" ? null : Uint8Array.from(atob(APP_ICONS[icon]), letter => letter.charCodeAt(0));
  return new Response(image,{headers});
}

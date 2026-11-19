const APP_VERSION = "2026-11-19.2";
const APP_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#101b23">
<meta name="description" content="The Identity Blank, motion analysis and Tabor Sideline Bait."><title>TABORBOY · Nathan Tabor</title>
<link rel="manifest" href="/app/manifest.webmanifest"><link rel="apple-touch-icon" href="/app/icon-192.png"><link rel="stylesheet" href="/app/style.css">
<script type="module" src="/app/main.js"></script></head>
<body><div class="top"><div class="wrap"><a class="brand" href="/">TABORBOY</a><nav aria-label="Project"><a href="/">Website</a><a href="/api/profile">Profile</a></nav></div></div>
<main><header class="hero"><div class="wrap"><h1>TABORBOY</h1><p>The Identity Blank, motion analysis and Tabor Sideline Bait.</p><div class="tools"><a class="button" href="#identity">Identity Blank</a><a class="button secondary" href="#motion">Motion lab</a><a class="button secondary" href="#sideline">Sideline Bait</a><button id="install" class="secondary" type="button" hidden>Install app</button></div><p id="install-help" class="status" aria-live="polite" hidden></p></div></header>
<div class="wrap layout">
<section id="identity" class="panel"><h2>Identity Blank</h2><p class="muted">Your saved words stay in this browser.</p>
<form id="identity-form"><label>Mode<select id="mode"><option value="I_AM">I AM</option><option value="I_AM_BECOMING">I AM BECOMING</option><option value="STACKED">STACKED</option></select></label>
<div class="slots"><label>Blank 1<input name="blank" maxlength="80" autocomplete="off" spellcheck="true"></label><label>Blank 2<input name="blank" maxlength="80" autocomplete="off" spellcheck="true"></label><label>Blank 3<input name="blank" maxlength="80" autocomplete="off" spellcheck="true"></label><label>Blank 4<input name="blank" maxlength="80" autocomplete="off" spellcheck="true"></label><label>Blank 5<input name="blank" maxlength="80" autocomplete="off" spellcheck="true"></label><label>Blank 6<input name="blank" maxlength="80" autocomplete="off" spellcheck="true"></label></div>
<div class="tools"><button>Save draft</button><button class="secondary" id="clear-identity" type="button">Clear draft</button></div></form><p class="status" id="identity-status" role="status"></p></section>
<section id="motion" class="panel"><h2>Motion lab</h2><p class="muted">Analyze an inertial sensor recording here without uploading it.</p>
<label>Motion CSV<input id="motion-file" accept=".csv,text/csv" type="file"></label><div class="tools"><button type="button" id="sample">Analyze sample</button></div>
<p><small>CSV columns <code>t_ms,gx,gy,gz,ax,ay,az</code>. Gyroscope in rad/s and accelerometer in m/s².</small></p>
<div class="metrics" id="motion-metrics" hidden></div><p class="status" id="motion-status" role="status"></p></section>
<section id="sideline" class="panel wide"><h2>Tabor Sideline Bait — TABORBOY</h2><p>ORIGINAL PLAY DESIGN CREDIT: NATHAN TABOR</p>
<canvas class="field-diagram" id="field" width="800" height="400" aria-label="Top-down field diagram of Tabor Sideline Bait"></canvas>
<p class="stage" id="stage" aria-live="polite"></p><div class="tools"><button id="previous" class="secondary" type="button">Previous</button><button id="next" type="button">Next step</button></div></section></div></main><footer class="wrap">Nathan Tabor · <a href="/">Project website</a> · <a href="/health">Live status</a></footer></body></html>
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

:root{--base:#101b23;--field:#122128;--panel:#172932;--accent:#8ce7d6;--glow:#1e514e}
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

const BLANK_KEY = "taborboy:identity:v1";
const inputs = [...document.querySelectorAll('[name="blank"]')];
const mode = byId("mode");
const identityStatus = byId("identity-status");
const draft = loadSaved(BLANK_KEY,{});
if (["I_AM","I_AM_BECOMING","STACKED"].includes(draft?.mode)) mode.value = draft.mode;
if (Array.isArray(draft?.slots)) inputs.forEach((input,i) => {
  if (typeof draft.slots[i] === "string") input.value = draft.slots[i].slice(0,80);
});
byId("identity-form").addEventListener("submit",event => {
  event.preventDefault();
  const saved = saveLocal(BLANK_KEY,{mode:mode.value,slots:inputs.map(input => input.value)});
  identityStatus.textContent = saved ? "Draft saved on this device." : "Browser storage is unavailable.";
});
byId("clear-identity").addEventListener("click",() => {
  try { localStorage.removeItem(BLANK_KEY); }
  catch { identityStatus.textContent = "Browser storage is unavailable."; return; }
  byId("identity-form").reset();
  identityStatus.textContent = "Draft cleared.";
  inputs[0].focus();
});

const EXPECTED_COLUMNS = "t_ms,gx,gy,gz,ax,ay,az";

function analyzeMotion(csv) {
  const lines = csv.trim().split(/\\r?\\n/);
  const header = lines[0].split(",").map(cell => cell.trim()).join(",");
  if (header !== EXPECTED_COLUMNS) throw new Error("Use the seven columns shown above.");
  const count = lines.length - 1;
  if (count < 2 || count > 10000) throw new Error("The recording must contain 2 to 10,000 samples.");
  let begin, last, peakAngular = 0, peakAcceleration = 0, peakAt = 0;
  for (let row = 1; row < lines.length; row += 1) {
    const cells = lines[row].split(",").map(cell => cell.trim());
    const values = cells.map(Number);
    if (cells.length !== 7 || cells.some(cell => !/^[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?$/i.test(cell)) ||
        values.some(value => !Number.isFinite(value) || Math.abs(value) > 1e12)) {
      throw new Error("Invalid sample on line " + (row + 1) + ".");
    }
    const [t,gx,gy,gz,ax,ay,az] = values;
    if (last !== undefined && t <= last) throw new Error("Timestamps must strictly increase.");
    begin ??= t;
    last = t;
    const speed = Math.hypot(gx,gy,gz);
    if (speed > peakAngular) {
      peakAngular = speed;
      peakAt = t - begin;
    }
    peakAcceleration = Math.max(peakAcceleration, Math.hypot(ax,ay,az));
  }
  const elapsed = last - begin;
  return {count,elapsed,peakAngular,peakAcceleration,peakAt,rate:(count - 1) * 1000 / elapsed};
}

const motionFile = byId("motion-file");
const metrics = byId("motion-metrics");
const motionStatus = byId("motion-status");
function showMotion(csv) {
  try {
    const data = analyzeMotion(csv);
    const format = value => new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(value);
    metrics.replaceChildren(metric(format(data.peakAngular) + " rad/s","Peak angular speed"),
      metric(format(data.peakAcceleration) + " m/s²","Peak acceleration magnitude"),
      metric(format(data.peakAt) + " ms","Time to peak angular speed"),
      metric(format(data.rate) + " Hz","Average sample rate"));
    metrics.hidden = false;
    motionStatus.textContent = data.count + " samples over " + format(data.elapsed) + " ms.";
  } catch (error) {
    metrics.hidden = true;
    motionStatus.textContent = error.message;
  }
}
let motionLoad = 0;
byId("sample").addEventListener("click",() => {
  motionLoad += 1;
  motionFile.value = "";
  const sample = Array.from({length:51},(_,i) => {
    const swing = Math.sin(i / 50 * Math.PI) ** 3;
    return [i * 20, (4 * swing).toFixed(3), (2 * swing).toFixed(3), 0, (3 * swing).toFixed(3), 0, 9.81].join(",");
  });
  showMotion([EXPECTED_COLUMNS,...sample].join("\\n"));
});
motionFile.addEventListener("change",async () => {
  const attempt = ++motionLoad;
  const file = motionFile.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    metrics.hidden = true;
    motionStatus.textContent = "Choose a CSV under 1 MB.";
    return;
  }
  try {
    const csv = await file.text();
    if (attempt === motionLoad) showMotion(csv);
  } catch {
    if (attempt === motionLoad) {
      metrics.hidden = true;
      motionStatus.textContent = "This recording could not be read.";
    }
  }
});

const stages = [
  {label:"1 of 3 · The quarterback sells a throw to the sideline.",point:[250,140],route:[[190,164],[250,140]],ball:null},
  {label:"2 of 3 · The receiver sells the toe-tap near the boundary, stays inbounds and plants.",point:[360,68],route:[[190,164],[250,140],[360,68]],ball:null},
  {label:"3 of 3 · The receiver breaks upfield. The quarterback makes the real throw.",point:[650,95],route:[[190,164],[250,140],[360,68],[390,78],[650,95]],ball:[[143,279],[650,95]]}
];
let step = 0;
const field = byId("field").getContext("2d");
function path(points,color,dash = []) {
  field.strokeStyle = color;
  field.lineWidth = 5;
  field.setLineDash(dash);
  field.beginPath();
  field.moveTo(...points[0]);
  for (const point of points.slice(1)) field.lineTo(...point);
  field.stroke();
  field.setLineDash([]);
}
function marker(point, label, color) {
  field.fillStyle = color;
  field.beginPath();
  field.arc(...point,16,0,2*Math.PI);
  field.fill();
  field.font = "700 16px system-ui";
  field.fillStyle = "#101b23";
  field.textAlign = "center";
  field.fillText(label,point[0],point[1]+5);
}
function drawPlay() {
  const phase = stages[step];
  if (field) {
    field.fillStyle = "#173f3a";
    field.fillRect(0,0,800,400);
    field.strokeStyle = "#a8c9bba0";
    field.lineWidth = 2;
    field.strokeRect(26,48,748,304);
    for (let x = 106; x < 774; x += 78) {
      field.beginPath();
      field.moveTo(x,48);
      field.lineTo(x,352);
      field.stroke();
    }
    field.font = "600 18px system-ui";
    field.fillStyle = "#d7efe6";
    field.textAlign = "left";
    field.fillText("SIDELINE",34,33);
    path(phase.route,"#91f1d4");
    if (phase.ball) path(phase.ball,"#f1ce8b",[10,8]);
    marker([143,279],"QB","#f1ce8b");
    marker(phase.point,"WR","#91f1d4");
  }
  byId("stage").textContent = phase.label;
  byId("previous").disabled = step === 0;
  byId("next").textContent = step === stages.length - 1 ? "Replay" : "Next step";
}
byId("previous").addEventListener("click",() => { step = Math.max(0,step-1); drawPlay(); });
byId("next").addEventListener("click",() => { step = (step+1) % stages.length; drawPlay(); });
drawPlay();
`;
const APP_MANIFEST = {
  "id": "/app/",
  "name": "TABORBOY",
  "short_name": "TABORBOY",
  "start_url": "/app/",
  "scope": "/app/",
  "display": "standalone",
  "background_color": "#101b23",
  "theme_color": "#101b23",
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
const APP_SW = `const NAME = "taborboy-app-";
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
  "192": "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAIAAADdvvtQAAAEvElEQVR42u3dS2wUdRzA8dltuy20lBZKoVBQ24IaMIrQRAxi4gM8QPQkxkeEGBIOKD6IB4MHTeVA9OLBYGKDMdEg1QRtVI4Y4wNsjaY9SA2PNm6wwJaXpbIg9SAHo7OtXWh3d/L5HDsbujN89/f/T7vpxqrmNAaQrbhLgIAQEAJCQCAgBISAEBAICAEhIAQEAkJACAgBgYAQEAJCQAgIBISAEBACAgEhIASEgEBACIi8U5w/T2VrR7v/j/+pZemaPHkmsXz4C2XSKdySchyQdAo9o5wFJJ1oZBRXT2Tk5KrG1aOhQgpIPRG7wnH1aKjw9kBERjySLwsm7GqbQBRCQMZPVIeQCUTeB2T8RHgImUAICAEhIAQEAkJACAgBgYAQEAJCQCAgBISAEBAICAEhIASEgEBACAgBISAQEAJCQAgIBMS4KC7oZ79z3ZZk98Fx+sc3fdpaNbt2TN8oFo+XlJUmJpUlyidX18+aNnf2zBtvaLpzSUXNNAExuuHLl9Pnh9Lnh4LUqYG+5KGgMwiCIBabs2jBXU+tbVrebAkji6yGk10Hdz376u4XWi7+cUFAZKnny/27Nr8yfHlYQGSpt7Or46PPBET2Drz/iU10vlj/7usjP2DPy290f7Ev9NBL+/fEi4qu8glMrat9ur31H5vo4XMnU8d7jnzV+mGyK/yu7VTytxOH+2Y0zDOB+O9tfKyytqZpefO61u3XLbkl08NSR3+1hDFySfHmtaszHR0cOC0gRlE5a0bm+3qbaEZzrv9kxp1T5rYExJXddEfb5+FXvLi4/tab3IURvjj9njrV/8vRr3e29f3QHfqQRatWTKqcIiCCIAjOHDs+pg/bnlI7/d7N66N0BSxhE6emYe4TO7aVT6uK0kmZQBOk+ZE19z2zvihRErHzMoEmyPe72ndveW2gLykgsnTom853Hn/uyIEfBUSW0ueH2rZsi9KvMuyBrsq/fpkaBMGldPrc8VRvZ/e3732c6k2GNrR3+47H3moxgQh7RSYS1fV1tz14/4YP3py3eGHoY44c+Km/57CAGLGk0sQDL27MdPTgvu8ExChq519fMb069NCxnw8JiNGVTa0I/fpg6rSAGN3Q6bOhXx+Oyls6BDSO+nsODw6cCT1UXj1VQIzk0oX03u1vZ7z/j8pbgvwc6Br7M33x7IlUb0dXpp8D/a1h2e0CYsxv57iys66saLhjsSWMLN2z6cmSslIBkY2FK1csfmhVZE7HEjZxYvHY0odXr3x+QyweExBjUFRS3Lhsyd0bH525oCFipyagaz5nYiWlicTkstLyydX1dTUN8+pubpq/fGlpRXk0T7dqTuN4f4+tHe26ypUsbhJtonEXhoAQEAgIASEgBAQCQkAICAGBgBAQAkJACAgEhIAQEAICASEgBISAQEAICAEhIBAQAkJACAgBja/x/iNZ5PDKm0AIiMgHZBWL5PplAlE4ARlC0Rs/JpB6CiogQ8gSpiHjJ9dLmIaidG0n4rMyQvkAjWi8LHMWkIyiMdRzHJCMCn0/kBcByahw95F5FBBu4xEQCAgBISAEBAJCQAgIAYGAEBACQkAgIASEgBAQAgIBISAEhIBAQAgIASEgEBACQkAICK74CzWIKa8WvtuvAAAAAElFTkSuQmCC",
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
  if (path === "/app/version") return Response.json({entity:"TABORBOY",version:APP_VERSION},{headers:{"cache-control":"no-store"}});
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

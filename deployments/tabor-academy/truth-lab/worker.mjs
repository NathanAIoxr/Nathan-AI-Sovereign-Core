import cases from "./cases.mjs";

const mount = "/tabor-academy/truth-lab";
const humanities = "/tabor-academy/way/humanities/";
const sourceIndex = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/docs/academy/truth-vs-the-made-up-truth.md";

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Trace a historical claim, compare its evidence, and make a record someone else can verify.">
<title>Truth vs. the Made-Up Truth · Tabor Academy</title><link rel="stylesheet" href="${mount}/styles.css"><script type="module" src="${mount}/reader.js"></script></head>
<body>
<a class="skip" href="#case-title">Skip to case</a>
<header class="site-header"><a class="brand" href="/tabor-academy/">Tabor Academy</a><nav aria-label="Academy"><a href="${humanities}">Humanities</a><a href="${sourceIndex}">Source index</a></nav></header>
<main>
<section class="hero"><div><p class="byline">By Nathan Tabor</p><h1>Truth vs. the<br>Made-Up Truth</h1><p>Trace what happened, what people later said happened, and how to tell the difference.</p></div><div class="clock" aria-label="The Nathan Tabor Way"><span><b>12</b> Build</span><span><b>3</b> Flip and clear</span><span><b>6</b> Integrate</span><span><b>9</b> Verify</span></div></section>
<div class="workspace">
<aside class="index" aria-label="Case index"><h2>Case index</h2><label for="search">Find a case</label><input id="search" type="search" placeholder="Try Dinetah, a place, or a year"><div class="filter"><div><label for="theme">Topic</label><select id="theme"><option value="">All topics</option></select></div><div><label for="direction">Reading order</label><select id="direction"><option value="forward">Forward</option><option value="reverse">Reverse</option></select></div></div><label class="check"><input id="saved-only" type="checkbox"> Show saved cases</label><p id="count" class="muted" aria-live="polite"></p><ul id="cases" class="cases"></ul></aside>
<div class="reading" id="reading">
<article class="card" aria-labelledby="case-title"><div class="case-meta"><p id="case-date" class="date"></p><button id="save" type="button" aria-pressed="false">Save case</button></div><h2 id="case-title" tabindex="-1">Loading cases…</h2><p id="case-status" class="status"></p>
<div class="evidence"><section><h3>What the record shows</h3><p id="evidence"></p></section><section><h3>How the story can change</h3><p id="retelling"></p></section></div>
<section class="sources"><h3>Open the sources</h3><ul id="source-list"></ul><a id="lesson" href="${humanities}">Open the Academy lesson</a></section>
<nav class="steps" aria-label="Timeline controls"><button id="previous" type="button">← Previous case</button><button id="next" type="button">Next case →</button></nav></article>
<details class="card"><summary>Compare with another case</summary><label for="compare">Second case</label><select id="compare"><option value="">Choose a second case</option></select><div id="comparison" aria-live="polite"></div></details>
<details class="card"><summary>Build your proof sheet</summary><p id="task"></p><fieldset><legend>Which is a sound starting point?</legend><label class="check"><input type="radio" name="answer" value="primary"> Check the account against its source, date and audience.</label><label class="check"><input type="radio" name="answer" value="repeat"> Count each repetition of the claim as independent evidence.</label><button id="check-answer" type="button">Check answer</button><p id="feedback" aria-live="polite"></p></fieldset><label for="notes">Your notes for this case</label><textarea id="notes" rows="4" placeholder="Claim, evidence, and what would change your conclusion"></textarea><p class="muted">Notes and saved cases stay in this browser.</p><button id="download" type="button">Download proof sheet</button></details>
</div></div>
<noscript><p>Open the <a href="${sourceIndex}">source and evidence index</a> to read all of the cases without JavaScript.</p></noscript></main>
<footer><a href="${humanities}truth-vs-the-made-up-truth/">Return to the original Academy guide</a></footer></body></html>`;

const css = `:root{color-scheme:light;font-family:"DM Sans",system-ui,sans-serif;color:#182b29;background:#f5f2e8;line-height:1.55;--ink:#182b29;--muted:#4a605c;--edge:#d2d9ce;--green:#0f5048;--paper:#fffdf6}
*{box-sizing:border-box}body{margin:0}button,input,select,textarea{font:inherit;color:inherit}a{color:#14594e;text-underline-offset:.18em}a:hover{text-decoration-thickness:.15em}button{cursor:pointer}button:disabled{cursor:default;opacity:.52}button,input,select,textarea{border:1px solid #879e93;border-radius:.38rem;background:white;padding:.47rem .62rem}button:hover:not(:disabled){background:#dfeee6}button[aria-pressed=true]{background:#135b4f;color:white}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid #bc530d;outline-offset:3px}.skip{position:absolute;left:1rem;top:-5rem;background:white;padding:.6rem;z-index:4}.skip:focus{top:.8rem}
.site-header{padding:.85rem clamp(1rem,5vw,5rem);display:flex;justify-content:space-between;gap:1rem;align-items:center;background:#123b37;color:white;flex-wrap:wrap}.site-header a{color:#fbfff6}.brand{font-weight:750;text-decoration:none}.site-header nav{display:flex;gap:1.35rem;font-size:.93rem}main,footer{width:min(1360px,100%);margin:auto;padding-inline:clamp(.85rem,4vw,4rem)}.hero{display:grid;grid-template-columns:1fr auto;align-items:end;gap:1.5rem;border-bottom:1px solid #adc0b1;padding:2rem 0 1.55rem}.hero h1{font-family:"Instrument Serif",Georgia,serif;font-size:clamp(2.55rem,6.1vw,5.9rem);font-weight:400;line-height:.93;letter-spacing:-.036em;margin:.25rem 0 1rem}.hero p{margin:.35rem 0;max-width:40rem}.byline,.date,.muted{color:var(--muted)}.byline,.date{font-size:.91rem;font-weight:650}.clock{display:grid;gap:.25rem .9rem;grid-template-columns:repeat(2,max-content);padding:.75rem .95rem;border:1px solid var(--edge);background:#ebece0}.clock span{font-size:.87rem}.clock b{color:var(--green);margin-right:.13rem}
.workspace{display:grid;grid-template-columns:minmax(235px,330px) minmax(0,1fr);gap:1.3rem;margin-block:1.3rem}.index,.card{min-width:0;background:var(--paper);border:1px solid var(--edge);border-radius:.55rem;padding:1rem 1.1rem}.card{margin-bottom:.8rem}.index h2,.card h2{margin:.2rem 0 .55rem;line-height:1.15}.card h2{font-family:"Instrument Serif",Georgia,serif;font-size:clamp(1.7rem,4vw,3rem);font-weight:400}.index h2{font-size:1.25rem}label{display:block;font-size:.88rem;font-weight:620;margin-top:.5rem}input[type=search],select,textarea{width:100%;min-width:0}.filter{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.5rem}.check{display:flex;align-items:flex-start;gap:.45rem;font-weight:500}.check input{margin-top:.3rem;flex:none}.muted{font-size:.86rem}.cases{list-style:none;margin:0;padding:0;max-height:35rem;overflow:auto;overscroll-behavior:contain}.cases li+li{border-top:1px solid var(--edge)}.case-link{display:block;padding:.58rem .4rem;text-decoration:none;font-size:.92rem;line-height:1.3}.case-link[aria-current=true]{background:#dcece2;color:#13352c;font-weight:700}.case-link span{display:block;font-size:.76rem;color:var(--muted);margin-top:.25rem}.case-meta{display:flex;gap:.7rem;justify-content:space-between;align-items:center}.case-meta button{font-size:.86rem;flex:none}.status{font-size:.91rem;color:#30574c;margin:.35rem 0 1rem}.evidence{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem}.evidence section{padding:.8rem;background:#e8f1e8;border-top:3px solid #2c7666}.evidence section+section{background:#f5e8df;border-color:#985438}.evidence h3,.sources h3{font-size:1rem;margin:0 0 .28rem}.evidence p,.sources ul{margin:.24rem 0}.sources{margin-top:1rem}.sources ul{padding-left:1.2rem;margin-bottom:.7rem}.steps{border-top:1px solid var(--edge);margin-top:1rem;padding-top:.65rem;display:flex;justify-content:space-between;gap:.65rem}summary{cursor:pointer;font-weight:700}fieldset{border:1px solid var(--edge);margin:1rem 0;padding:.75rem}fieldset button{margin-top:.6rem}#feedback{margin:.4rem 0}footer{padding-block:.65rem 1.6rem;font-size:.93rem}#comparison h3{margin:.75rem 0 .2rem}#comparison p{margin:.25rem 0}main,article{overflow-wrap:anywhere}
@media(max-width:800px){.hero{grid-template-columns:1fr;align-items:start;gap:.45rem}.clock{width:max-content;max-width:100%}.workspace{grid-template-columns:minmax(0,1fr);gap:.7rem}.cases{max-height:13.2rem}.card{padding:.8rem}.index{padding:.8rem}.evidence{grid-template-columns:1fr}.case-meta{align-items:flex-start}.site-header nav{gap:.8rem}.steps button{font-size:.88rem}}@media(max-width:380px){.clock{grid-template-columns:1fr 1fr;width:100%;column-gap:.35rem}.filter{grid-template-columns:1fr}.case-meta button{max-width:6rem}}`;

async function reader() {
  const byId = id => document.getElementById(id);
  let response;
  try {
    response = await fetch("./cases.json");
    if (!response.ok) throw new Error("Could not load cases");
  } catch {
    byId("case-title").textContent = "The case list could not load";
    return;
  }
  const { cases: all } = await response.json();
  const inventory = new Map(all.map(item => [item.id, item]));
  const themes = [...new Set(all.map(item => item.theme))].sort();
  const search = byId("search");
  const topic = byId("theme");
  const direction = byId("direction");
  const savedOnly = byId("saved-only");
  const caseList = byId("cases");
  const compare = byId("compare");
  const notes = byId("notes");
  const storageKey = "tabor-academy-truth-lab:v1";
  let notebook = {};
  try { notebook = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { /* private browsing */ }
  let saved = new Set(Array.isArray(notebook?.saved) ? notebook.saved : []);
  let savedNotes = new Map(Object.entries(notebook?.notes ?? {}));
  let active = inventory.get(location.hash.slice(1)) ?? inventory.get("ohkay-owingeh") ?? all[0];
  let visible = all;

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify({saved: [...saved], notes: Object.fromEntries(savedNotes)})); } catch { /* storage unavailable */ }
  }
  function create(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function sourceLinks(item) {
    return item.sources.map(source => {
      const li = create("li");
      const link = create("a", source.title);
      link.href = source.url;
      li.append(link);
      return li;
    });
  }
  function renderList() {
    const searchable = value => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
    const term = searchable(search.value.trim());
    visible = all.filter(item => (!topic.value || item.theme === topic.value)
      && (!savedOnly.checked || saved.has(item.id))
      && (!term || searchable([item.title, item.date, item.theme, item.evidence, item.retelling].join(" ")).includes(term)));
    if (direction.value === "reverse") visible = [...visible].reverse();
    caseList.replaceChildren(...visible.map(item => {
      const entry = create("li");
      const link = create("a", item.title, "case-link");
      link.href = `#${item.id}`;
      if (item.id === active.id) link.setAttribute("aria-current", "true");
      link.append(create("span", item.date));
      link.addEventListener("click", event => { event.preventDefault(); show(item, true); });
      entry.append(link);
      return entry;
    }));
    byId("count").textContent = visible.length ? `${visible.length} of ${all.length} cases` : "No cases match. Clear a filter or try another word.";
    const index = visible.indexOf(active);
    byId("previous").disabled = index < 1;
    byId("next").disabled = !visible.length || index >= visible.length - 1;
  }
  function renderCompare() {
    const panel = byId("comparison");
    const second = inventory.get(compare.value);
    if (!second || second.id === active.id) { panel.replaceChildren(); return; }
    const heading = create("h3", second.title);
    const date = create("p", second.date, "date");
    const record = create("p", second.evidence);
    const telling = create("p", second.retelling);
    const sources = create("ul");
    sources.append(...sourceLinks(second));
    panel.replaceChildren(heading, date, create("h4", "What the record shows"), record, create("h4", "How the story can change"), telling, sources);
  }
  function show(item, userAction = false) {
    if (!item) return;
    active = item;
    for (const [id, value] of [["case-date",item.date],["case-title",item.title],["case-status",item.status],["evidence",item.evidence],["retelling",item.retelling],["task",item.task]]) byId(id).textContent = value;
    byId("source-list").replaceChildren(...sourceLinks(item));
    byId("lesson").href = `/tabor-academy/way/humanities/truth-map-${item.id}/`;
    byId("save").setAttribute("aria-pressed", String(saved.has(item.id)));
    byId("save").textContent = saved.has(item.id) ? "Saved" : "Save case";
    const oldCompare = compare.value;
    compare.replaceChildren(new Option("Choose a second case", ""), ...all.filter(candidate => candidate.id !== item.id).map(candidate => new Option(candidate.title, candidate.id)));
    if (oldCompare !== item.id && inventory.has(oldCompare)) compare.value = oldCompare;
    notes.value = savedNotes.get(item.id) ?? "";
    document.querySelectorAll('input[name="answer"]').forEach(input => { input.checked = false; });
    byId("feedback").textContent = "";
    renderList();
    renderCompare();
    if (userAction) {
      if (location.hash !== `#${item.id}`) history.pushState(null, "", `#${item.id}`);
      byId("case-title").focus();
    }
  }

  topic.append(...themes.map(theme => new Option(theme, theme)));
  search.addEventListener("input", renderList);
  [topic, direction, savedOnly].forEach(control => control.addEventListener("change", renderList));
  compare.addEventListener("change", renderCompare);
  byId("next").addEventListener("click", () => show(visible[visible.indexOf(active) + 1], true));
  byId("previous").addEventListener("click", () => show(visible[visible.indexOf(active) - 1], true));
  window.addEventListener("popstate", () => show(inventory.get(location.hash.slice(1)) ?? inventory.get("ohkay-owingeh") ?? all[0]));
  byId("save").addEventListener("click", () => {
    if (saved.has(active.id)) saved.delete(active.id); else saved.add(active.id);
    persist();
    byId("save").setAttribute("aria-pressed", String(saved.has(active.id)));
    byId("save").textContent = saved.has(active.id) ? "Saved" : "Save case";
    renderList();
  });
  notes.addEventListener("input", () => { savedNotes.set(active.id, notes.value); persist(); });
  byId("check-answer").addEventListener("click", () => {
    const answer = document.querySelector('input[name="answer"]:checked')?.value;
    byId("feedback").textContent = answer === "primary" ? "Correct. Check provenance before counting witnesses." : answer === "repeat" ? "Try again. Several retellings can come from the same account." : "Choose an answer first.";
  });
  byId("download").addEventListener("click", () => {
    const text = `${active.title}\n${active.date}\n\nWhat the record shows\n${active.evidence}\n\nHow the story can change\n${active.retelling}\n\nMy notes\n${notes.value}\n\nSources\n${active.sources.map(source => `${source.title}: ${source.url}`).join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], {type:"text/plain;charset=utf-8"}));
    const save = create("a");
    save.href = url;
    save.download = `proof-sheet-${active.id}.txt`;
    save.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  show(active);
}

const headers = {
  "Content-Security-Policy": "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

export function serveTruthLab(request, release = "local") {
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, {status:405, headers:{...headers,Allow:"GET, HEAD"}});
  }
  function reply(body, type, status = 200) {
    return new Response(request.method === "HEAD" ? null : body, {
      status,
      headers:{...headers,"Content-Type":`${type}; charset=utf-8`,"Cache-Control":"no-cache"}
    });
  }
  const path = url.pathname.replace(/^\/tabor-academy/, "");
  switch (path) {
    case "/truth-lab": return new Response(null, {status:308,headers:{Location:mount+"/"}});
    case "/truth-lab/": return reply(html,"text/html");
    case "/truth-lab/styles.css": return reply(css,"text/css");
    case "/truth-lab/reader.js": return reply(`(${reader.toString()})();`,"text/javascript");
    case "/truth-lab/cases.json": return reply(JSON.stringify({cases}),"application/json");
    case "/truth-lab/healthz": return reply(JSON.stringify({ready:true,service:"tabor-academy-truth-lab",release,cases:cases.length}),"application/json");
    default: return reply("Case explorer route not found.","text/plain",404);
  }
}

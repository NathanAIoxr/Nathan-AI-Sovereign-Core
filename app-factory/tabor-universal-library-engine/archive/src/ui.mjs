import { classNames, editionFormats, materials, providers, states, vaults } from "./model.mjs";

export const css = `
:root{color-scheme:light;--ink:#25211b;--accent:#006058;--paper:#f8f5ed;--line:#d8d0c1;--muted:#534e42;font-family:system-ui,sans-serif}*{box-sizing:border-box}body{background:var(--paper);color:var(--ink);margin:0}a{color:var(--accent);text-underline-offset:.18em}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #ad6900;outline-offset:3px}header,main,footer{padding-inline:clamp(1rem,5vw,4rem)}header>div,main,footer>div{max-width:78rem;margin:auto}header{background:#142b29;color:#f8f2df}header a{color:inherit}header>div{min-height:4.75rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding-block:.8rem}.brand{font:700 1.25rem Georgia,serif}nav{display:flex;flex-wrap:wrap;gap:.65rem 1.15rem}main{padding-block:clamp(1.25rem,4vw,3.4rem) 4rem}h1,h2,h3{font-family:Georgia,serif;line-height:1.08}h1{font-size:clamp(2.4rem,7.2vw,5rem);letter-spacing:-.045em;margin:.1em 0 .23em}h2{font-size:clamp(1.45rem,3vw,2.2rem)}h3{font-size:1.3rem}p,li,dt,dd{line-height:1.55}.intro{max-width:60ch;font-size:1.13rem}form{padding:1.2rem;background:#eee7d8;border:1px solid var(--line);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:end;gap:.65rem;margin-block:2rem}label{display:grid;gap:.25rem;font-weight:650}button,input,select{min-height:2.8rem;border:1px solid #746e60;border-radius:.25rem;background:white;color:var(--ink);font:inherit;padding:.45rem .6rem;width:100%;min-width:0}button{color:white;background:var(--accent);border-color:var(--accent);font-weight:700}.cards{padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:.9rem;list-style:none}.cards>li,.panel{border:1px solid var(--line);background:#fffcf5;padding:1.15rem}.cards h2,.cards h3{margin:.4rem 0 .55rem}.cards p{margin:.35rem 0}.meta{color:var(--muted);font-size:.9rem}.section{border-top:1px solid var(--line);margin-top:1.7rem;padding-top:.8rem}dl{display:grid;grid-template-columns:minmax(7rem,auto) 1fr;gap:.5rem 1rem}dt{font-weight:700}dd{margin:0;min-width:0;overflow-wrap:anywhere}code{overflow-wrap:anywhere}.links{display:flex;gap:.6rem 1.2rem;flex-wrap:wrap}.page-nav{margin-top:1.4rem}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;background:#fffcf5;text-align:left}th,td{padding:.55rem .7rem;border:1px solid var(--line)}footer{border-top:1px solid var(--line);padding-block:1.25rem}.lead{margin-top:0}.class-list{columns:2;list-style:none;padding:0}.class-list li{break-inside:avoid;padding:.2rem 0}.fulltext{white-space:pre-wrap;overflow-wrap:anywhere;font:1rem/1.65 Georgia,serif;max-width:80ch}@media(max-width:850px){form{grid-template-columns:repeat(2,minmax(0,1fr))}form label:first-child{grid-column:1/-1}}@media(max-width:500px){form{grid-template-columns:1fr}.class-list{columns:1}dl{grid-template-columns:1fr;gap:.25rem}dd{margin-bottom:.55rem}}
`;

const escapeMap = {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
export const html = value => String(value ?? "").replace(/[&<>"']/g, char => escapeMap[char]);

const source = (url, label) => {
  try {
    const target = new URL(url);
    if (target.protocol === "https:" && !target.username && !target.password) return `<a href="${html(target.href)}">${html(label)}</a>`;
  } catch { /* Retain the label for malformed catalog URLs. */ }
  return html(label);
};

export function shell(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${html(title)} · Library of Tabor</title><link rel="stylesheet" href="/archive.css"></head><body>
<header><div><a class="brand" href="/">Library of Tabor</a><nav aria-label="Archive navigation"><a href="/">Reading Room</a><a href="/shelves">Subject shelves</a><a href="/architecture">Sovereign architecture</a><a href="https://tabor-universal-library-engine.nathantaboract.workers.dev/library/">Playable Library</a></nav></div></header>
<main id="main">${body}</main><footer><div>Library of Tabor by Nathan Tabor · <a href="https://www.loc.gov/catdir/cpso/lcco/">Library of Congress Classification</a> · <a href="/api/health">Release receipt</a></div></footer></body></html>`;
}

function select(name, label, choices, selected) {
  return `<label>${label}<select name="${name}"><option value="">${label === "Subject shelf" ? "All subjects" : "All"}</option>${Object.entries(choices).map(([value,text]) =>
    `<option value="${html(value)}"${selected === value ? " selected" : ""}>${html(text)}</option>`).join("")}</select></label>`;
}

function pageHref(filters, page) {
  const params = new URLSearchParams(Object.entries({q:filters.query,class:filters.shelf,vault:filters.vault,state:filters.state,material:filters.material,provider:filters.provider,page:String(page)}).filter(([,value])=>value));
  return "/?" + html(params.toString());
}

export function readingRoom(results, filters) {
  const items = results.entries.map(w => `<li><p class="meta">${html(w.material ? materials[w.material] : states[w.state])} · ${html(w.class)}</p><h3><a href="/works/${html(w.id)}">${html(w.title)}</a></h3><p>${html(w.author)}</p><p>${html(w.description)}</p></li>`);
  return shell("Reading Room", `<h1>Library of Tabor</h1><p class="intro">Find books, clay tablets, papyri, scrolls and manuscripts. Open the holding institution’s record or read an archived edition, transliteration or transcription.</p>
<nav class="links" aria-label="Browse by material">${Object.entries(materials).map(([id,label])=>`<a href="/?material=${id}">${html(label)}</a>`).join("")}</nav>
<form action="/" method="get" role="search"><label>Search the archive<input name="q" maxlength="120" value="${html(filters.query)}" placeholder="Title, author, institution, or reference"></label>
${select("class","Subject shelf",classNames,filters.shelf)}${select("vault","Vault",vaults,filters.vault)}${select("state","Record type",states,filters.state)}${select("material","Material or form",materials,filters.material)}${select("provider","Source collection",providers,filters.provider)}<button type="submit">Search</button></form>
<section aria-labelledby="catalog-heading"><h2 id="catalog-heading">Catalog</h2>${items.length ? '<ul class="cards">'+items.join("")+"</ul>" : "<p>No records match these filters.</p>"}</section>
<nav class="page-nav" aria-label="Catalog pages">${results.page > 1 ? `<a href="${pageHref(filters,results.page-1)}">Previous page</a>` : ""}${results.hasNext ? `<a href="${pageHref(filters,results.page+1)}">Next page</a>` : ""}</nav>`);
}

export function workPage(work) {
  const editions = work.editions.map(e => `<li class="panel"><h3>${html(e.label)}</h3><dl><dt>SHA-256</dt><dd><code>${html(e.sha256)}</code></dd><dt>Size</dt><dd>${Number(e.bytes).toLocaleString("en-US")} bytes</dd><dt>Captured (UTC)</dt><dd>${html(e.captured_utc)}</dd></dl><p>${html(e.rights_note)}</p><p class="links"><a href="${html(e.text)}">${html(e.format ? "Open "+editionFormats[e.format] : "Read verbatim text")}</a><a href="${html(e.verification)}">Verify SHA-256</a>${source(e.source_url,"Source file or corpus")}</p></li>`);
  const original=work.source;
  const origin=original ? Object.entries({"Source collection":providers[original.provider],"Material or form":materials[original.material],
    "Holding institution":original.holding,"Date or period":original.dating,"Shelfmark":original.shelfmark,"Original identifier":original.external_id,
    "Source snapshot":original.snapshot}).filter(([,v])=>v).map(([label,value])=>`<dt>${html(label)}</dt><dd>${html(value)}</dd>`).join("") : "";
  const witnesses = work.witnesses.map(w => `<li><h3>${html(w.label)}</h3><p class="meta">${html(w.type)} · ${html(w.locator)}</p><p>${html(w.claim)}</p>${source(w.source_url,"View witness source")}</li>`);
  return shell(work.title,`<p><a href="/">Reading Room</a> / <a href="/?class=${html(work.class)}">${html(classNames[work.class])}</a></p><h1>${html(work.title)}</h1>
<p class="lead">${html(work.author)} · ${html(states[work.state])}</p><p class="intro">${html(work.description)}</p>
<dl><dt>Vault</dt><dd>${html(vaults[work.vault])}</dd><dt>Language</dt><dd>${html(work.language)}</dd><dt>Source</dt><dd>${source(work.source_url,work.source_reference)}</dd><dt>Rights</dt><dd>${html(work.rights_note)}</dd>${origin}<dt>Sovereign URI</dt><dd><code>${html(work.uri)}</code></dd></dl>
<section class="section"><h2>Preserved editions</h2>${editions.length ? '<ul class="cards">'+editions.join("")+"</ul>" : "<p>The catalog links to the holding institution. A local edition has yet to be published.</p>"}</section>
${witnesses.length ? '<section class="section"><h2>Evidence and witnesses</h2><ul class="cards">'+witnesses.join("")+"</ul></section>" : ""}`);
}

export function shelvesPage() {
  const shelves = Object.entries(classNames).map(([code,name])=>`<li><a href="/?class=${code}">${code} · ${html(name)}</a></li>`);
  const rooms = Object.entries(vaults).map(([id,name])=>`<li><a href="/?vault=${id}">${html(name)}</a></li>`);
  return shell("Subject shelves",`<h1>Subject shelves</h1><h2>Library of Congress Classification</h2><ul class="class-list">${shelves.join("")}</ul><section class="section"><h2>Historical vaults</h2><ul>${rooms.join("")}</ul></section>`);
}

export function architecturePage(info, counts) {
  const rows = info.layers.map((row,i)=>`<tr><th scope="row">${i+1}. ${html(row[0])}</th>${row.slice(1).map(x=>`<td>${html(x)}</td>`).join("")}</tr>`);
  const gates = info.gates.map(([id,title,rule])=>`<li><strong>${html(title)}</strong> · ${html(id)}<br>${html(rule)}</li>`);
  const tiers = info.archiveTiers.map(name=>`<li>${html(name)}</li>`);
  return shell(info.principle,`<h1>${html(info.principle)}</h1><p class="intro">The Library of Tabor connects the public archive to the existing Sovereign Edge OS and ACT graph. The register tracks ${counts.modules} module IDs, ${counts.nodes} ACT nodes, and ${info.layers.length} documented trilingual layers.</p>
  <p class="links"><a href="/api/architecture">Architecture JSON</a><a href="/api/registry/modules">Module registry</a><a href="/api/registry/act">ACT graph</a></p><h2>Trilingual hierarchy</h2><div class="scroll"><table><thead><tr><th scope="col">Layer</th><th scope="col">Greek / Latin / Hebrew</th><th scope="col">KJV office and anchor</th><th scope="col">Literary analogue</th><th scope="col">Archive implementation</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
  <section class="section"><h2>Gates and portals</h2><ul>${gates.join("")}</ul></section><section class="section"><h2>Archive tiers</h2><ol start="0">${tiers.join("")}</ol></section>`);
}

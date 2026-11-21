import { catalog, fleet, officialHost, prefix, release, sourceLabels } from "./registry.mjs";

const escaping={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};
const e=value=>String(value??"").replace(/[&<>"']/g,character=>escaping[character]);

export const css=`
:root{color-scheme:light;--bg:#f2f3ef;--ink:#172920;--muted:#465d52;--accent:#125737;--line:#c4d0c6;font:16px/1.55 system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink)}header{background:#15392b;color:#f4f8f0}header a{color:inherit}header>div,main,footer>div{max-width:73rem;margin:auto;padding:1rem clamp(1rem,4vw,3rem)}header>div{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.8rem}.brand{font-weight:750}nav{display:flex;flex-wrap:wrap;gap:.4rem 1rem}a{color:var(--accent);text-underline-offset:.2em}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #936600;outline-offset:3px}main{padding-block:2.8rem 4rem}h1,h2,h3{line-height:1.13}h1{font-size:clamp(2.1rem,6vw,4.25rem);letter-spacing:-.055em;margin:.2em 0}h2{font-size:clamp(1.35rem,3vw,2rem)}h3{font-size:1.2rem;margin:.4em 0}p{max-width:72ch}.intro{font-size:1.1rem}.meta{color:var(--muted);font-size:.9rem}form{margin:1.4rem 0;display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:.6rem;align-items:end;border:1px solid var(--line);background:#dde8de;padding:1rem}form.utility{grid-template-columns:1fr;max-width:55rem}label{display:grid;gap:.33rem;font-weight:650}input,select,button,textarea{font:inherit;min-width:0;width:100%;padding:.6rem;background:white;border:1px solid #638174;border-radius:.25rem;color:var(--ink)}button{background:var(--accent);color:white;font-weight:700}textarea{min-height:8rem}.items{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:.72rem}.items li{background:#fdfffb;border:1px solid var(--line);padding:1rem}.items p{margin:.4rem 0}.block{padding-top:.85rem;border-top:1px solid var(--line);margin-top:2rem}code{overflow-wrap:anywhere}footer{border-top:1px solid var(--line)}.nodes{padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:.6rem}.nodes li{background:white;border:1px solid var(--line);padding:.5rem}.pager{margin-top:1.25rem}@media(max-width:900px){form{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){form{grid-template-columns:1fr}}
`;

function shell(title,content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} · Tabor Worker Catalog</title><link rel="stylesheet" href="${prefix}/catalog.css"></head><body><header><div><a class="brand" href="${prefix}/">Tabor Worker Catalog</a><nav aria-label="Worker catalog"><a href="${prefix}/nodes">Federation slots</a><a href="https://library-of-tabor-archive.nathantaboract.workers.dev/">Library of Tabor</a><a href="https://tabor-world.nathantaboract.workers.dev/">Tabor World</a></nav></div></header><main>${content}</main><footer><div><a href="${prefix}/catalog.json">Catalog JSON</a> · <a href="${prefix}/receipt">Release receipt</a> · <a href="${officialHost}${prefix}/api/replicas">Replica inventory</a></div></footer></body></html>`;
}

function options(items,selected) {
  return items.map(([value,label])=>`<option value="${e(value)}"${String(selected)===String(value)?" selected":""}>${e(label)}</option>`).join("");
}

export function home({term,group,state,items,page,last}){
  const cards=items.map(item=>`<li><p class="meta">#${String(item.id).padStart(3,"0")} · ${e(sourceLabels[item.source.status])}</p><h3><a href="${prefix}/projects/${String(item.id).padStart(3,"0")}">${e(item.name)}</a></h3><p>${e(item.description)}</p>${item.localUtility?"<p>Runnable Tabor utility available</p>":""}</li>`).join("");
  function link(num,label){
    const search=new URLSearchParams({q:term,category:group,status:state,page:String(num)});
    return `<a href="${prefix}/?${e(search)}">${label}</a>`;
  }
  return shell("Browse",`<h1>Tabor Worker Catalog</h1><p class="intro">Browse the 101 submitted Workers and examples. Each entry preserves its submitted description and shows the upstream source evidence. Three local utilities are available to run.</p>
<form action="${prefix}/" method="get" role="search"><label>Search<input name="q" value="${e(term)}" maxlength="100" placeholder="Worker name, title, or number"></label>
<label>Collection<select name="category"><option value="">All nine collections</option>${options(catalog.categories.map(x=>[x.id,x.title]),group)}</select></label>
<label>Source evidence<select name="status"><option value="">All source statuses</option>${options(Object.entries(sourceLabels),state)}</select></label><button type="submit">Search</button></form>
<section aria-labelledby="results"><h2 id="results">Workers and examples</h2>${cards?'<ul class="items">'+cards+"</ul>":"<p>No entries match these filters.</p>"}</section>
<nav class="pager" aria-label="Results pages">${page>1?link(page-1,"Previous page"):""}${page<last?link(page+1,"Next page"):""}</nav>`);
}

function utilityForm(item) {
  if(!item.localUtility)return "";
  const fields={
    hash:'<label>Algorithm<select name="algorithm"><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option><option>SHA-1</option></select></label><label>Text<textarea name="text" maxlength="16000" required></textarea></label>',
    "strip-tracking":'<label>URL<input name="url" type="url" maxlength="6000" required></label>',
    opengraph:'<label>HTML source<textarea name="html" maxlength="45000" required></textarea></label>'
  };
  return `<section class="block"><h2>Run the Tabor utility</h2><form class="utility" method="post" action="${prefix}/tools/${item.localUtility}">${fields[item.localUtility]}<button type="submit">Run and view JSON</button></form></section>`;
}

export function detail(item) {
  const category=catalog.categories[item.category-1];
  const source=item.source.url?`<a href="${e(item.source.url)}">Open upstream source</a>`:"Source link pending.";
  const evidence=sourceLabels[item.source.status];
  return shell(item.name,`<p class="meta">#${String(item.id).padStart(3,"0")} · <a href="${prefix}/?category=${category.id}">${e(category.title)}</a></p><h1>${e(item.name)}</h1><p class="intro">${e(item.description)}</p>
<section class="block"><h2>Source evidence</h2><p>${e(evidence)}. ${source}</p>${item.submittedReference?`<p>Submitted reference <code>${e(item.submittedReference)}</code></p>`:""}${item.source.license?`<p>Upstream license identifier <code>${e(item.source.license)}</code></p>`:""}</section>${utilityForm(item)}`);
}

export function slotsPage(offset,limit){
  const selected=fleet.slots.slice(offset,offset+limit);
  return shell("Federation slots",`<h1>Federation catalog copies</h1><p class="intro">${fleet.slots.length.toLocaleString("en-US")} registered slots in <code>${e(fleet.cohort)}</code>. Each slot has its own catalog file and checksum.</p>
  <p><a href="${e(fleet.source)}">Federation registry</a> · <a href="${officialHost}${prefix}/api/replicas">Storage inventory</a></p><ul class="nodes">${selected.map(id=>`<li><a href="https://tabor-supercomputer-federation.nathantaboract.workers.dev/v1/nodes/${id}/worker-catalog">${id}</a></li>`).join("")}</ul>
  <nav class="pager" aria-label="Fleet pages">${offset>0?`<a href="${prefix}/nodes?offset=${Math.max(0,offset-limit)}">Previous slots</a>`:""}${offset+limit<fleet.slots.length?`<a href="${prefix}/nodes?offset=${offset+limit}">Next slots</a>`:""}</nav>
  <p class="meta">Release ${e(catalog.release)} · <code>${e(release.sha256)}</code></p>`);
}

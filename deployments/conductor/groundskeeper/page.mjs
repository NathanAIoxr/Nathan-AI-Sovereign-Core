const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const time = value => value == null ? '—' : new Date(value).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');

export function render({mount, subject, domains, report}) {
  const ready = report.services.filter(row => row.state === 'ready').length;
  const {continuity} = report;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Groundskeeper AI · Nathan AI Conductor</title>
<style>
:root{color-scheme:dark;--ink:#edf1e8;--muted:#aebdb1;--line:#405348;--surface:#111d17;--mint:#abefba;--amber:#ffd191}
*{box-sizing:border-box}body{margin:0;background:#0a130e;color:var(--ink);font:1rem/1.55 Inter,system-ui,sans-serif}
a{color:var(--mint);text-underline-offset:.24em}a:focus-visible{outline:2px solid var(--mint);outline-offset:5px}
main{width:min(100% - 2rem,68rem);margin:auto}nav{display:flex;flex-wrap:wrap;gap:.5rem 1.35rem;margin:1.3rem 0 2.25rem}
header{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:2.5rem 0 1.65rem}
h1{font-size:clamp(2.8rem,10vw,6rem);letter-spacing:-.07em;line-height:1;margin:0}header p{color:var(--mint);margin:.6rem 0 0}
section{margin:2rem 0}h2{font-size:clamp(1.18rem,4.6vw,1.75rem);letter-spacing:-.02em;margin:0 0 .75rem}
.stack{display:grid;gap:1rem;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}.panel{min-width:0;background:var(--surface);border:1px solid var(--line);padding:1.1rem;border-radius:.6rem}
table{width:100%;border-collapse:collapse}th{text-align:left}th,td{padding:.53rem .3rem;border-bottom:1px solid var(--line)}td:last-child,th:last-child{text-align:right}
code,.mono{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:.88em}.good{color:var(--mint)}.attention{color:var(--amber)}
dl{margin:0}dt{color:var(--muted);font-size:.86rem}dd{margin:0 0 .7rem;overflow-wrap:anywhere}
.meta{color:var(--muted)}ul.domains{display:flex;flex-wrap:wrap;padding:0;gap:.48rem;list-style:none}
.domains li{border:1px solid var(--line);padding:.25rem .6rem;border-radius:.3rem}footer{border-top:1px solid var(--line);padding:1rem 0 2rem}
@media(max-width:47rem){.stack{grid-template-columns:1fr}nav a{display:inline-block;padding:.2rem 0}header{padding-top:1.55rem}}
</style>
</head><body><main>
<nav aria-label="Operations"><a href="/tabor-sites/conductor">Nathan AI Conductor</a><a href="${mount}">Refresh checks</a>
<a href="${mount}/api/status">Status JSON</a><a href="${mount}/api/stage">Stage report for review</a></nav>
<header><h1>Groundskeeper AI</h1><p>${escape(subject)} · The Groundskeeper</p></header>
<section class="stack" aria-label="Service readiness and continuity">
<article class="panel"><h2>DOES THE SYSTEM WORK?</h2><p class="meta">${ready} of ${report.services.length} service checks verified</p>
<table><thead><tr><th scope="col">Service</th><th scope="col">State</th></tr></thead><tbody>
${report.services.map(row => `<tr><th scope="row">${escape(row.label)}</th><td class="${row.state === 'ready' ? 'good' : 'attention'}">${escape(row.state)}</td></tr>`).join('')}
</tbody></table></article>
<article class="panel"><h2>WILL IT KEEP WORKING?</h2><dl>
<dt>Conductor TIME</dt><dd class="${continuity.state === 'current' ? 'good' : 'attention'}">${escape(continuity.state)}</dd>
<dt>Last recorded check</dt><dd class="mono">${escape(time(continuity.last))}</dd>
<dt>Next scheduled check</dt><dd class="mono">${escape(time(continuity.next))}</dd>
<dt>Zone checks passed</dt><dd>${continuity.passed == null ? '—' : escape(continuity.passed + ' of ' + continuity.total)}</dd>
</dl></article></section>
<section><h2>Infrastructure + Technology</h2><ul class="domains">${domains.map(label => `<li>${escape(label)}</li>`).join('')}</ul></section>
<footer><div class="meta">Observed <span class="mono">${escape(time(report.observedAt))}</span></div>
<a href="/tabor-sites/conductor/api/release-gate/health">Lasso of Truth release gate</a></footer>
</main></body></html>`;
}

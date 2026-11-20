const miningBase = "/tabor-academy/mining/";
const miningTitle = "Cryptocurrency Mining";
const miningEscape = value => String(value).replace(/[&<>"']/g, character =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const miningHref = module => miningBase + "zones/" + module.id + "/";
const miningNamespace = module => "tabor-academy-mining-" + module.id;

function miningPage(title, body, back) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${miningEscape(title)} · Tabor Academy</title>
  <style>
  :root{color-scheme:dark;background:#10140f;color:#f9f3e4;font:1rem/1.6 system-ui,sans-serif}
  *{box-sizing:border-box}body{margin:0}main{width:min(100%,70rem);margin:auto;padding:clamp(1rem,5vw,4rem)}
  a{color:#e6cf87;text-underline-offset:.2em} a:focus-visible,summary:focus-visible{outline:2px solid #e6cf87;outline-offset:.3em}
  nav{display:flex;gap:.5rem 1.3rem;flex-wrap:wrap;font-size:.92rem} header{margin:2rem 0}
  h1,h2{font-family:Georgia,serif;line-height:1.13}h1{font-size:clamp(2.3rem,7vw,4.8rem);margin:.18em 0}
  h2{font-size:clamp(1.45rem,3.5vw,2rem);margin:.4em 0}p{margin:.35em 0 1em} li+li{margin-top:.55rem}
  section,details{border-block-start:1px solid #778360;padding:1.1rem 0;margin:1rem 0}
  .outcome{background:#263220;padding:1rem 1.2rem;border-inline-start:.25rem solid #e6cf87}
  .catalog{list-style:none;padding:0;display:grid;gap:.9rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))}
  .catalog li{margin:0;border:1px solid #778360;background:#171e13;padding:1rem}
  .catalog a,summary,dt{font-weight:700} summary{cursor:pointer} dd{margin:.2em 0 .9em}
  .module section,.module details{max-width:48rem}footer{margin:1.5rem 0}html{overflow-wrap:anywhere}
  @media print{:root{color-scheme:light;background:white;color:black}a{color:black}nav,footer,.screen-only{display:none}
  main{padding:0}.outcome,.catalog li{background:white}section,.catalog li{break-inside:avoid}h1{font-size:28pt}}
  </style></head><body><main class="${back ? "module" : "course"}">
  <nav aria-label="Tabor Academy"><a href="/tabor-academy/">Tabor Academy</a><a href="/tabor-academy/workbench/">Workbench</a>
  ${back ? `<a href="${miningBase}">${miningTitle}</a>` : ""}</nav>
  <header><h1>${miningEscape(title)}</h1></header>${body}</main></body></html>`;
}

function miningCatalog(modules) {
  const list = modules.map(module => `<li><a href="${miningHref(module)}">${miningEscape(module.title)}</a>
    <p>${miningEscape(module.outcome)}</p></li>`).join("");
  return miningPage(miningTitle, `<p>Start with the finished outcome, then show it, replicate it, and verify it.</p>
    <ol class="catalog">${list}</ol><footer><a href="${miningBase}modules.json">Module directory JSON</a></footer>`, false);
}

function miningLesson(module) {
  const concepts = module.concepts.map(([term, meaning]) =>
    `<dt>${miningEscape(term)}</dt><dd>${miningEscape(meaning)}</dd>`).join("");
  const steps = module.replicate.map(step => `<li>${miningEscape(step)}</li>`).join("");
  const sources = module.sources.map(([title, href]) =>
    `<li><a href="${miningEscape(href)}">${miningEscape(title)}</a></li>`).join("");
  const [question, answer] = module.check;
  return miningPage(module.title, `<section class="outcome"><h2>Z · Finished outcome</h2><p>${miningEscape(module.outcome)}</p></section>
    <section><h2>Show it</h2><p>${miningEscape(module.show)}</p><dl>${concepts}</dl></section>
    <section><h2>A · Replicate and verify</h2><ol>${steps}</ol>
    <p><strong>Self-check</strong> · ${miningEscape(question)}</p>
    <details><summary>Check your answer</summary><p>${miningEscape(answer)}</p></details></section>
    <section><h2>Sources</h2><ul>${sources}</ul></section>`, true);
}

function miningResponse(request, value, type, status = 200, extra = {}) {
  return new Response(request.method === "HEAD" ? null : value, {
    status,
    headers: {
      "Content-Type": type + "; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      ...extra,
    },
  });
}

function miningServe(request, modules, zone = false) {
  const path = new URL(request.url).pathname;
  const text = (message, status, extra) => miningResponse(request, message, "text/plain", status, extra);
  const json = data => miningResponse(request, JSON.stringify(data), "application/json");
  const html = page => miningResponse(request, page, "text/html");
  if (request.method !== "GET" && request.method !== "HEAD") {
    return text("Method not allowed", 405, { Allow: "GET, HEAD" });
  }
  if (zone) {
    const [module] = modules;
    if (path === "/healthz") return json({ status: "ok", id: module.id, namespace: miningNamespace(module) });
    if (path === "/module.json") return json(module);
    return path === "/" ? html(miningLesson(module)) : text("Module not found", 404);
  }
  if (path === "/mining" || path === "/mining/") return html(miningCatalog(modules));
  if (path === "/mining/modules.json") {
    return json({ course: miningTitle, modules: modules.map(module => ({
      id: module.id, title: module.title, path: miningHref(module), developmentZone: miningNamespace(module),
    })) });
  }
  const match = /^\/mining\/zones\/([a-z0-9-]+)\/?$/.exec(path);
  const module = match && modules.find(entry => entry.id === match[1]);
  return module ? html(miningLesson(module)) : text("Module not found", 404);
}

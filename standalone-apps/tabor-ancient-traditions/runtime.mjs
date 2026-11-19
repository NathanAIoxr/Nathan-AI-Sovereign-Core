const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

const css = `
:root{color-scheme:dark;--ink:#f9f5e9;--muted:#bcb6aa;--line:#3d3a32}
*{box-sizing:border-box}html{background:#141310;color:var(--ink);font:17px/1.55 system-ui,sans-serif}
body{margin:0}main{max-width:64rem;margin:auto;padding:clamp(1.1rem,5vw,4rem)}
a{color:var(--accent);text-underline-offset:.18em}a:hover{color:#fff}a:focus-visible,input:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
h1,h2{font-family:Georgia,serif;font-weight:normal;line-height:1.12}h1{font-size:clamp(2.4rem,7vw,5.2rem);margin:.45rem 0 1.1rem;max-width:21ch}
h2{font-size:clamp(1.6rem,4vw,2.35rem)}p{max-width:68ch}.credit{color:var(--muted);margin-bottom:.5rem}
header{border-bottom:1px solid var(--line);padding-bottom:1.5rem}nav{display:flex;gap:.9rem 1.3rem;flex-wrap:wrap}
section{margin:2.5rem 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:.8rem;padding:0;list-style:none}
.tile{display:block;min-height:3.25rem;padding:.8rem 1rem;border:1px solid var(--line);border-radius:.3rem;background:#1b1915}
input,button{font:inherit;border:1px solid #776d5a;color:var(--ink);background:#211e19;border-radius:.3rem;padding:.62rem .78rem}
input{width:min(31rem,100%)}button{cursor:pointer}.options{display:flex;gap:.5rem;flex-wrap:wrap}.note{color:var(--muted)}
article[data-record]{padding:.55rem 0;border-top:1px solid var(--line)}h3{font-size:1.05rem;margin:.25rem 0}.record-meta{color:var(--muted);margin:.12rem 0}
pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:1.1rem;border:1px solid var(--line);margin:1rem 0;font:inherit}
@media(max-width:30rem){main{padding:1.1rem}.options{flex-direction:column;align-items:stretch}}
`;

const script = `
const filter = document.querySelector("#filter");
const records = [...document.querySelectorAll("[data-record]")];
if (filter) filter.addEventListener("input", () => {
  const words = filter.value.toLocaleLowerCase().trim().split(/\\s+/);
  let count = 0;
  for (const row of records) {
    const text = row.textContent.toLocaleLowerCase();
    row.hidden = !words.every(word => text.includes(word));
    if (!row.hidden) count++;
  }
  document.querySelector("#result").textContent = count + (count === 1 ? " match" : " matches");
});
const buttons = [...document.querySelectorAll(".options button")];
for (const button of buttons) button.addEventListener("click", () => {
  const correct = button.dataset.answer === "yes";
  document.querySelector("#feedback").textContent = correct ? "Correct." : "Try another answer.";
  if (correct) for (const option of buttons) option.disabled = true;
});
`;

function escape(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function reply(body, contentType, init = {}) {
  return new Response(body, {
    ...init,
    headers: { ...privateHeaders, "Content-Type": contentType, ...init.headers },
  });
}

function html(body) {
  return reply(body, "text/html; charset=utf-8", { headers: {
    "Content-Security-Policy": "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  } });
}

function sourcePath(source) {
  return "/original/" + encodeURIComponent(source.name);
}

function link(label, href) {
  return `<a href="${escape(href)}">${escape(label)}</a>`;
}

function navigation(app, edition) {
  const result = [["Sources", "/"], ["Book", "/book"], ["Game", "/game"]];
  if (edition.play) result.push(["Original interactive", "/play"]);
  if (app.id !== "index") result.push(["All editions", edition.indexUrl]);
  return `<nav aria-label="Edition views">${result.map(([title, href]) => link(title, href)).join("")}</nav>`;
}

function frame(app, edition, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(app.title)}</title><link rel="stylesheet" href="/theme.css"><script src="/ui.js" defer></script></head><body><main style="--accent:${escape(app.accent)}"><header><p class="credit">By ${escape(app.creator)}</p><h1>${escape(app.title)}</h1><p>${escape(app.description)}</p>${navigation(app, edition)}</header>${body}</main></body></html>`;
}

function home(app, edition) {
  const apps = edition.apps?.length
    ? `<section><h2>Independent editions</h2><ul class="grid">${edition.apps.map((entry) =>
      `<li class="tile">${link(entry.title, entry.url)}</li>`).join("")}</ul></section>`
    : "";
  const files = edition.sources ?? [];
  const referenced = (edition.references ?? []).map((record) =>
    `<article data-record><h3>${escape(record.title)}</h3><p class="record-meta">${escape(record.detail)}</p></article>`).join("");
  const originals = files.map((source) =>
    `<article data-record><h3>${link(source.label || source.name, sourcePath(source))}</h3><p class="record-meta">${escape(source.detail || source.group)} · ${Number(source.size).toLocaleString("en-US")} bytes</p></article>`).join("");
  const links = (edition.links ?? []).map(([title, url]) =>
    `<li>${link(title, url)}</li>`).join("");
  const count = files.length + (edition.references?.length ?? 0);
  return frame(app, edition, `${apps}<section><h2>Sources</h2><label for="filter">Search this edition</label><br><input id="filter" type="search" autocomplete="off"><p id="result" class="note" aria-live="polite">${count} records</p>${originals}${referenced}</section>${links ? `<section><h2>Related sources</h2><ul>${links}</ul></section>` : ""}`);
}

async function readBook(app, edition, env) {
  const source = edition.sources?.find((item) => item.name === edition.book);
  const book = source && await env.SOURCES.get(source.key);
  if (!book) return html(frame(app, edition, "<section><h2>Reading notes</h2><p>Open the source files for this edition.</p></section>"));
  if (book.size > 500_000) return html(frame(app, edition, `<section><h2>Book</h2>${link("Download book", sourcePath(source))}</section>`));
  return html(frame(app, edition, `<section><h2>Book</h2>${link("Download source text", sourcePath(source))}<pre>${escape(await book.text())}</pre></section>`));
}

function game(app, edition) {
  const [question, correct, ...others] = app.quiz;
  if (!question) return html(frame(app, edition, "<section><h2>Explore the editions</h2><p>Each topic has its own activity.</p></section>"));
  const options = [correct, ...others].sort((a, b) => a.localeCompare(b)).map((option) =>
    `<button type="button" data-answer="${option === correct ? "yes" : "no"}">${escape(option)}</button>`).join("");
  return html(frame(app, edition, `<section><h2>Source check</h2><p>${escape(question)}</p><div class="options">${options}</div><p id="feedback" aria-live="polite"></p></section>`));
}

async function serveOriginal(source, env, play = false) {
  if (!source) return reply("Source not found", "text/plain", { status: 404 });
  const object = await env.SOURCES.get(source.key);
  if (!object) return reply("Source unavailable", "text/plain", { status: 404 });
  const headers = {
    "Content-Length": String(object.size),
    "X-Source-SHA256": object.customMetadata?.sha256 ?? source.sha256 ?? "",
  };
  if (play) {
    headers["Content-Security-Policy"] = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'";
  } else {
    headers["Content-Disposition"] = "attachment; filename*=UTF-8''" + encodeURIComponent(source.name).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16));
  }
  return reply(object.body, play ? "text/html; charset=utf-8" : "application/octet-stream", { headers });
}

export function createWorker(app, edition) {
  return {
    async fetch(request, env, context) {
      const url = new URL(request.url);
      if (request.method !== "GET" && request.method !== "HEAD") {
        return reply(null, "text/plain", { status: 405, headers: { Allow: "GET, HEAD" } });
      }
      if (url.pathname === "/healthz") {
        return reply(JSON.stringify({ worker: app.worker, release: app.release }), "application/json");
      }
      let identity;
      try {
        if (context.access && context.access.aud === env.OWNER_AUDIENCE) identity = await context.access.getIdentity();
      } catch {
        return reply("Sign-in verification unavailable", "text/plain", { status: 503 });
      }
      if (!identity?.email || identity.email.toLowerCase() !== env.OWNER_EMAIL?.toLowerCase()) {
        return reply("Owner sign-in required", "text/plain", { status: 403 });
      }
      let response;
      if (url.pathname === "/") response = html(home(app, edition));
      else if (url.pathname === "/book") response = await readBook(app, edition, env);
      else if (url.pathname === "/game") response = game(app, edition);
      else if (url.pathname === "/play") response = await serveOriginal(edition.sources?.find((source) => source.name === edition.play), env, true);
      else if (url.pathname === "/theme.css") response = reply(css, "text/css; charset=utf-8");
      else if (url.pathname === "/ui.js") response = reply(script, "text/javascript; charset=utf-8");
      else if (url.pathname === "/api/sources") response = reply(JSON.stringify({ app, ...edition }), "application/json");
      else if (url.pathname.startsWith("/original/")) {
        let name = "";
        try { name = decodeURIComponent(url.pathname.slice(10)); } catch { /* Unknown source. */ }
        response = await serveOriginal(edition.sources?.find((source) => source.name === name), env);
      } else if (url.pathname === "/backup-key" && app.id === "index" && env.BACKUP_KEY) {
        response = reply(env.BACKUP_KEY + "\n", "text/plain", { headers: { "Content-Disposition": 'attachment; filename="tabor-ancient-archive-key.txt"' } });
      } else response = reply("Not found", "text/plain", { status: 404 });
      return request.method === "HEAD"
        ? new Response(null, { status: response.status, headers: response.headers })
        : response;
    },
  };
}

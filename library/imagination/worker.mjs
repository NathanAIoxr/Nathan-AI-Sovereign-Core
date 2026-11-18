const headers = {
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

const htmlEscape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

const css = `
  :root{color-scheme:light;--ink:#25213d;--paper:#f8f5ed;--line:#ded8ca;--accent:#3d3479;--live:#17674c}
  *{box-sizing:border-box} body{margin:0;background:var(--paper);color:var(--ink);font:1rem/1.6 system-ui,sans-serif}
  a{color:var(--accent);text-underline-offset:.23em} a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #6251ad;outline-offset:3px}
  main,.band{max-width:74rem;margin:auto;padding-inline:clamp(1.2rem,5vw,4.5rem)}
  header{background:#25213d;color:#fff5ce;border-bottom:5px solid #d3a758;padding:3.75rem 0 3.2rem}
  header a{color:#f4d487} .brand{font-size:.85rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
  h1,h2{font-family:Georgia,serif;font-weight:500;line-height:1.06}
  h1{font-size:clamp(2.8rem,8.4vw,6rem);margin:.65rem 0 1rem;letter-spacing:-.055em;overflow-wrap:anywhere}
  h2{font-size:clamp(1.65rem,4vw,2.5rem);margin:2.5rem 0 1rem}.intro{max-width:45rem;margin:0;color:#e3dce8}
  main{padding-block:2rem 4rem} footer{border-top:1px solid var(--line);padding-block:1.3rem 2rem;color:#5d5570}
  .filter{display:flex;gap:.8rem;align-items:flex-end;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:1.55rem}
  label{display:flex;flex-direction:column;font-size:.84rem;font-weight:700;min-width:min(100%,14rem);flex:1}
  input,select,button{min-height:2.8rem;font:inherit;font-size:1rem;border-radius:.45rem;padding:.52rem .68rem}
  input,select{width:100%;background:#fffdf7;color:var(--ink);border:1px solid #a49bb2}
  button,.action{background:var(--accent);color:#fff;text-decoration:none;border:0;cursor:pointer;font-weight:650;padding:.62rem 1rem;border-radius:.45rem;display:inline-block}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,19.5rem),1fr));gap:.85rem}
  article{background:#fffdf7;border:1px solid var(--line);border-radius:.65rem;padding:1.05rem 1.15rem}
  h3{font-size:1.16rem;line-height:1.32;margin:.52rem 0}.meta{color:#5d5570;font-size:.87rem;margin:0}
  .id{font:700 .82rem ui-monospace,monospace;color:var(--accent)} .live{color:var(--live);font-weight:700}
  article p{margin:.65rem 0 0} .engine{max-width:48rem} .engine p{margin-bottom:1.1rem;font-size:1.08rem}
`;

function page(title, subtitle, body, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${htmlEscape(title)} · Library of Tabor</title><style>${css}</style></head><body><header><div class="band"><a class="brand" href="/">Library of Tabor</a><h1>${htmlEscape(title)}</h1><p class="intro">${htmlEscape(subtitle)}</p></div></header><main>${body}</main><footer><div class="band"><a href="/api/catalog.json">Download catalog JSON</a> · <a href="https://library-of-tabor-archive.nathantaboract.workers.dev/">Library archive</a></div></footer></body></html>`, {
    status, headers: { ...headers, "content-type": "text/html; charset=utf-8" },
  });
}

function json(body, status = 200, additionalHeaders = {}) {
  return Response.json(body, { status, headers: { ...headers, ...additionalHeaders } });
}

async function catalog(env) {
  const { results } = await env.ARCHIVE_DB.prepare(
    `SELECT r.categories, e.entry FROM tabor_imagination_releases r
      JOIN tabor_imagination_engines e ON r.sha256 = e.release_sha256
      WHERE r.sha256 = ? ORDER BY e.number`,
  ).bind(env.RELEASE_SHA256).all();
  if (results.length !== 101) throw new Error("Incomplete catalog");
  return {
    categories: JSON.parse(results[0].categories),
    engines: results.map(({ entry }) => JSON.parse(entry)),
  };
}

function card(entry) {
  return `<article><p class="meta"><span class="id">${entry.id}</span> · ${entry.demo ? '<span class="live">Demo available</span>' : 'Catalog entry'}</p><h3><a href="/engines/${entry.id}">${htmlEscape(entry.title)}</a></h3><p>${htmlEscape(entry.description)}</p></article>`;
}

function index(data, url) {
  const term = (url.searchParams.get("q") || "").trim().slice(0, 120);
  const group = Number(url.searchParams.get("category")) || 0;
  const demos = url.searchParams.get("demos") === "1";
  const query = term.toLowerCase();
  const entries = data.engines.filter((entry) =>
    (!group || entry.category === group) && (!demos || entry.demo) &&
    (!query || [entry.id, entry.number, entry.title, entry.description].some((value) => String(value).toLowerCase().includes(query))),
  );
  const choices = data.categories.map((category) =>
    `<option value="${category.id}"${group === category.id ? " selected" : ""}>${htmlEscape(category.title)}</option>`).join("");
  const sections = data.categories.map((category) => {
    const cards = entries.filter((entry) => entry.category === category.id);
    return cards.length ? `<section><h2>${htmlEscape(category.title)}</h2><div class="grid">${cards.map(card).join("")}</div></section>` : "";
  }).join("");
  return page("Imagination Engines", "101 engines across eight collections. Explore dragons, unicorns, the Land of Illa, and more.", `
    <form class="filter" action="/"><label>Search<input name="q" value="${htmlEscape(term)}" maxlength="120" placeholder="Dragon, phonics, IMAG-045"></label>
    <label>Collection<select name="category"><option value="0">All collections</option>${choices}</select></label>
    <label>Availability<select name="demos"><option value="0">All entries</option><option value="1"${demos ? " selected" : ""}>Demo available</option></select></label><button>Filter</button></form>
    <p class="meta">${entries.length} of ${data.engines.length} engines</p>${sections || "<p>No engines match these filters.</p>"}`);
}

async function demo(entry, env) {
  const service = env[entry.id.replace("-", "_")];
  if (!entry.demo || !service) return json({ error: "Demo unavailable" }, 404);
  const url = new URL(entry.demo.path, "https://imagination.internal");
  const response = await service.fetch(new Request(url, entry.number === 93 ? {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "STAR LIBRARY", shift: 3 }),
  } : undefined));
  const type = (response.headers.get("content-type") || "").split(";")[0];
  if (!response.ok || !["image/svg+xml", "application/json"].includes(type)) {
    return json({ error: "The engine demo is temporarily unavailable" }, 502);
  }
  return new Response(response.body, { headers: { ...headers, "content-type": type } });
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return json({ error: "GET required" }, 405, { allow: "GET" });
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/health" || path === "/api/catalog.json") {
        const release = await env.ARCHIVE_DB.prepare(
          `SELECT r.object_key, r.bytes, COUNT(e.number) AS engine_count
           FROM tabor_imagination_releases r LEFT JOIN tabor_imagination_engines e
           ON r.sha256 = e.release_sha256 WHERE r.sha256 = ?
           GROUP BY r.sha256`,
        ).bind(env.RELEASE_SHA256).first();
        if (release?.engine_count !== 101) return json({ status: "unavailable" }, 503);
        const object = path === "/health" ? await env.ARCHIVE_BLOB.head(release.object_key) :
          await env.ARCHIVE_BLOB.get(release.object_key);
        if (!object || object.size !== release.bytes) return json({ status: "unavailable" }, 503);
        if (path === "/health") {
          return json({ status: "ok", entries: release.engine_count, sha256: env.RELEASE_SHA256 });
        }
        return new Response(object.body, { headers: {
          ...headers,
          "content-type": "application/json; charset=utf-8",
          "content-disposition": 'attachment; filename="tabor-imagination-catalog.json"',
        } });
      }
      if (path === "/") return index(await catalog(env), url);
      const match = /^\/(engines|demo)\/(IMAG-\d{3})\/?$/.exec(path);
      if (!match) return json({ error: "Page not found" }, 404);
      const entryRow = await env.ARCHIVE_DB.prepare(
        "SELECT entry FROM tabor_imagination_engines WHERE release_sha256 = ? AND number = ?",
      ).bind(env.RELEASE_SHA256, Number(match[2].slice(5))).first();
      if (!entryRow) return json({ error: "Engine not found" }, 404);
      const entry = JSON.parse(entryRow.entry);
      if (match[1] === "demo") return await demo(entry, env);
      const action = entry.demo
        ? `<a class="action" href="/demo/${entry.id}">Open demo · ${htmlEscape(entry.demo.label)}</a>`
        : '<p class="meta">Catalog entry</p>';
      return page(entry.title, entry.id, `<div class="engine"><p>${htmlEscape(entry.description)}</p>${action}<p><a href="/">All engines</a></p></div>`);
    } catch {
      return json({ error: "The catalog service is temporarily unavailable" }, 503);
    }
  },
};

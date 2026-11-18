import catalog from "./catalog.json" with { type: "json" };
import { ancientHandlers } from "./ancient.mjs";
import { embeddings, languageHandlers, scriptProfile } from "./language.mjs";
import { authorize, gated, modelHandlers } from "./models.mjs";
import { researchHandlers } from "./research.mjs";
import { escapeHtml, readBytes, RequestError, string, webHeaders } from "./shared.mjs";
import { toolHandlers } from "./tools.mjs";

const workerName = "tabor-polyglot-knowledge-gateway";
const library = "https://tabor-universal-library-engine.nathantaboract.workers.dev/library/";
const labels = {
  live: "Available", limited: "Available in part", provider: "Uses an external service",
  owner: "Owner configuration required", upstream_reference: "Upstream source", requires_build: "Build pending",
};

const handlers = { ...ancientHandlers, ...languageHandlers, ...modelHandlers, ...researchHandlers, ...toolHandlers,
  101: ({ text, language }) => {
    const value = string(text, "text", 8000);
    const scripts = scriptProfile(value);
    const related = {
      Egyptian_Hieroglyphs: [34,35,36,37,38], Linear_B:[19], Cuneiform:[17,21], Ugaritic:[31],
      Anatolian_Hieroglyphs:[41], Hebrew:[22,52,74], Arabic:[51,57], Phoenician:[20,99],
      Ogham:[26], Han:[55,98], Old_Italic:[30], Ethiopic:[29], Syriac:[53], Mongolian:[54],
    };
    const recommended = [...new Set(Object.keys(scripts.counts).flatMap(script => related[script] ?? []))];
    return { scripts, direction: embeddings(value), language: language === undefined ? null : languageHandlers[5]({code: language}),
      related: recommended.map(id => { const {title,status,route} = catalog.entries[id-1]; return {id,title,status,route}; }),
      library_connection: "/api/library", library,
    };
  },
};
const routes = new Map(catalog.entries.map(row => [String(row.id).padStart(3,"0"), row]));
const counts = Object.fromEntries(Object.keys(labels).map(status => [
  status, catalog.entries.filter(row => row.status === status).length,
]));
const source = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/tabor-world/language-workers";

const browserScript = `
  const search = document.querySelector('#search');
  const rows = [...document.querySelectorAll('[data-entry]')];
  const counter = document.querySelector('#results');
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    for (const row of rows) row.hidden = !row.textContent.toLowerCase().includes(query);
    for (const group of document.querySelectorAll('[data-group]')) group.hidden = !group.querySelector('[data-entry]:not([hidden])');
    counter.textContent = rows.filter(row => !row.hidden).length + ' entries';
  });
  for (const form of document.querySelectorAll('form[data-tool]')) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const result = form.querySelector('output');
      const button = form.querySelector('button');
      button.disabled = true;
      result.textContent = 'Running…';
      try {
        const response = await fetch(form.dataset.tool, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify(JSON.parse(form.querySelector('textarea').value)),
        });
        const type = response.headers.get('content-type') || '';
        if (response.ok && (type.startsWith('audio/') || type.startsWith('font/') || type.startsWith('image/'))) {
          if (form.dataset.blob) URL.revokeObjectURL(form.dataset.blob);
          const link = document.createElement('a');
          form.dataset.blob = URL.createObjectURL(await response.blob());
          link.href = form.dataset.blob;
          link.download = 'tabor-' + form.dataset.tool.split('/').pop() + '.' + (type.startsWith('font/') ? 'ttf' : type.startsWith('image/') ? 'svg' : 'wav');
          link.textContent = 'Download result';
          result.replaceChildren(link);
        } else {
          result.textContent = type.includes('application/json') ? JSON.stringify(await response.json(), null, 2) : await response.text();
        }
      } catch (error) {
        result.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  }
`;

function home() {
  const groups = catalog.groups.map(group => `<section data-group><h2>${escapeHtml(group.title)}</h2>
    ${catalog.entries.filter(row => row.group === group.id).map(row => {
      const key = String(row.id).padStart(3,"0");
      const links = [
        row.upstream?.url && [row.upstream.note, row.upstream.url],
        row.upstream?.demo && ["Open upstream interpreter", row.upstream.demo],
        row.source_documentation && ["Documentation", row.source_documentation],
      ].filter(Boolean).map(([label,url]) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`).join(" · ");
      return `<details id="tool-${key}" data-entry>
        <summary><span>${key} · ${escapeHtml(row.title)}</span><small>${labels[row.status]}</small></summary>
        <p>${escapeHtml(row.available_scope ?? row.next_dependency)}</p>
        ${row.route ? `<p><code>POST ${row.route}</code></p>` : ""}
        ${links ? `<p>${links}</p>` : ""}
        ${row.example && row.status !== "owner" ? `<form data-tool="${row.route}">
          <label for="input-${key}">JSON input</label><textarea id="input-${key}" rows="4" spellcheck="false">${escapeHtml(JSON.stringify(row.example,null,2))}</textarea>
          <button>Run ${key}</button><output aria-live="polite"></output></form>` : ""}
      </details>`;
    }).join("")}
  </section>`).join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Language Workers · Library of Tabor</title>
    <style>
      :root{color-scheme:light;--ink:#262015;--paper:#fbf7ec;--gold:#d9c291;--accent:#6b351d}
      *{box-sizing:border-box}body{margin:0;font:16px/1.5 system-ui,sans-serif;background:var(--paper);color:var(--ink)}
      header{background:#2b2117;color:#fff0d3;padding:clamp(26px,6vw,70px) 22px}
      header div, main{max-width:1040px;margin:auto}header p{margin:0}.top{font-weight:650}h1,h2{font-family:Georgia,serif;line-height:1.13}
      h1{font-size:clamp(38px,7vw,74px);margin:.17em 0 .24em}h2{font-size:clamp(21px,3vw,30px);margin:1.6em 0 .55em}
      a{color:var(--accent);text-underline-offset:3px}header a{color:#f0d49b}nav{display:flex;gap:14px 24px;flex-wrap:wrap;margin-top:16px}
      main{padding:25px 22px 55px}label{display:block;font-weight:650;margin-bottom:6px}
      input,textarea{display:block;width:100%;border:1px solid #9d8a64;border-radius:5px;padding:10px;color:var(--ink);background:#fffdf6;font:inherit}
      #results{margin:8px 0;font-size:.92rem}details{border-top:1px solid var(--gold);padding:10px 0}
      details:last-child{border-bottom:1px solid var(--gold)}details p,details form{margin:10px 0 10px 22px}
      summary{cursor:pointer;font-weight:650}small{font-weight:500;color:#52351f;display:inline-block;margin-left:8px}
      textarea,code,output{font-family:ui-monospace,monospace}button{border:0;border-radius:4px;background:#653923;color:white;font:inherit;padding:7px 16px;margin-top:8px;cursor:pointer}
      output{display:block;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:6px;max-height:24rem;overflow:auto}
      [hidden]{display:none!important}:focus-visible{outline:3px solid #a05924;outline-offset:3px}
    </style>
    <header><div><a class="top" href="${library}">Library of Tabor</a><h1>Language Workers</h1>
      <p>101 entries across eight collections</p>
      <nav aria-label="Project links"><a href="/api/catalog">Catalog JSON</a><a href="/api/health">Service status</a><a href="/api/library">Library connection</a><a href="${source}">GitHub source</a></nav>
    </div></header><main><label for="search">Find a language, script, tool, or ID</label>
      <input id="search" type="search" autocomplete="off"><p id="results" aria-live="polite">101 entries</p>${groups}</main>
    <script src="/catalog.js" defer></script></html>`;
}

const sharedCsp = "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const json = (data, status = 200) => Response.json(data, { status, headers:webHeaders });
const method = allowed => new Response("Method not allowed", { status:405, headers:{...webHeaders, allow:allowed} });

async function libraryHealth(env) {
  if (!env.LIBRARY) throw new RequestError("Library service binding is unavailable", 503);
  try {
    const response = await env.LIBRARY.fetch("https://library.internal/library/api/health");
    if (!response.ok) throw new Error("Library returned an error");
    const health = await response.json();
    if (!health.ok) throw new Error("Library did not report healthy status");
    return { library, ok: true, release: health.release, entries: health.entries, shelves: health.shelves };
  } catch {
    throw new RequestError("Library health check failed", 502);
  }
}

async function route(request, env) {
  const {pathname} = new URL(request.url);
  const tool = /^\/api\/tools\/(\d{3})$/.exec(pathname);
  if (!tool && request.method !== "GET") return method("GET");
  if (pathname === "/") return new Response(home(), { headers: {
    ...webHeaders, "content-type":"text/html; charset=utf-8", "content-security-policy":sharedCsp,
  } });
  if (pathname === "/catalog.js") return new Response(browserScript, { headers:{...webHeaders,"content-type":"text/javascript; charset=utf-8"} });
  if (pathname === "/api/catalog") return json(catalog);
  if (pathname === "/api/library") return json(await libraryHealth(env));
  if (pathname === "/api/health") return json({
    ok: true, service:workerName, schema:catalog.schema, groups:catalog.groups.length, registered:catalog.entries.length,
    handlers:Object.keys(handlers).length, public_handlers:Object.keys(handlers).length-gated.size,
    scopes:counts, library_binding:Boolean(env.LIBRARY), owner_ai_enabled:Boolean(env.AI && env.POLYGLOT_AI_KEY),
  });
  const match = /^\/api\/catalog\/(\d{3})$/.exec(pathname);
  const row = routes.get((tool ?? match)?.[1]);
  if (!row) return json({error:"Entry or route not found"},404);
  if (match) return json(row);
  if (request.method !== "POST") return method("POST");
  if (!handlers[row.id]) return json({error:"This entry has no runnable handler", entry:row},501);
  if (gated.has(row.id)) await authorize(request, env);
  const type = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  const context = { env, request };
  let input = {};
  if (type === "application/json" && row.id !== 4) {
    const bytes = await readBytes(request.body, 175000);
    try {
      input = JSON.parse(new TextDecoder("utf-8", {fatal:true}).decode(bytes));
      if (!input || Array.isArray(input) || typeof input !== "object") throw new Error();
    } catch {
      throw new RequestError("A valid JSON object is required");
    }
  } else if ((row.id === 4 && type?.startsWith("audio/")) || (row.id === 95 && type === "application/octet-stream")) {
    context.bytes = await readBytes(request.body, row.id === 4 ? 2000000 : 1048576);
  } else {
    throw new RequestError(row.id === 4 ? "Content-Type audio/* is required" : "Content-Type application/json is required",415);
  }
  const output = await handlers[row.id](input, context);
  return output instanceof Response ? output : json(output);
}

async function serve(request, env = {}) {
  if (request.method === "HEAD") {
    const response = await serve(new Request(request, { method:"GET" }), env);
    return new Response(null, response);
  }
  try {
    return await route(request, env);
  } catch (error) {
    if (error instanceof RequestError) return json({error:error.message},error.status);
    console.error("Polyglot route failure", new URL(request.url).pathname, error?.name);
    return json({error:"Internal route failure"},500);
  }
}

export default {fetch:serve};

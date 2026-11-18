import { getQuery, routes } from "./routes.mjs";

const service = "tabor-sovereign-crown";
const limit = 64 * 1024;
const headers = {
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

function reply(request, data, status = 200, more = {}) {
  return new Response(request.method === "HEAD" ? null : JSON.stringify(data), {
    status, headers: {...headers, "content-type": "application/json; charset=utf-8", ...more},
  });
}

function methodError(request, allowed) {
  return reply(request, {error:"method_not_allowed"}, 405, {allow:allowed});
}

async function boundedJson(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return {error:"application_json_required", status:415};
  }
  if (Number(request.headers.get("content-length")) > limit) return {error:"body_too_large", status:413};
  if (!request.body) return {error:"json_object_required", status:400};
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", {fatal:true});
  let length = 0;
  let text = "";
  try {
    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) return {error:"body_too_large", status:413};
      text += decoder.decode(value, {stream:true});
    }
    const payload = JSON.parse(text + decoder.decode());
    if (payload && typeof payload === "object" && !Array.isArray(payload)) return {payload};
  } catch {
    return {error:"invalid_json", status:400};
  } finally {
    await reader.cancel().catch(() => {});
  }
  return {error:"json_object_required", status:400};
}

async function dispatch(request, env, id, url) {
  const route = routes[id];
  if (!route) return reply(request, {error:"capability_not_routed", id}, 404);
  if (request.method !== route.method) return methodError(request, route.method);
  if (!env[route.binding]) return reply(request, {error:"binding_unavailable", id}, 503);
  const target = new URL(route.path, "https://" + route.service + ".internal");
  const options = {method:route.method, redirect:"manual"};
  if (route.method === "POST") {
    if (url.search) return reply(request, {error:"unexpected_query_parameters", id}, 400);
    const {payload, error, status} = await boundedJson(request);
    if (error) return reply(request, {error, id}, status);
    options.body = JSON.stringify(payload);
    options.headers = {"content-type":"application/json"};
  } else {
    const params = getQuery(id, url.searchParams);
    if (params === null) return reply(request, {error:"invalid_query_parameters", id}, 400);
    target.search = params.toString();
  }
  try {
    const response = await env[route.binding].fetch(target.href, options);
    const type = response.headers.get("content-type") ?? "";
    if (response.status >= 300 && response.status < 400) {
      return reply(request, {error:"unexpected_upstream_redirect", id}, 502);
    }
    if (!type.startsWith("application/json") && !(id === 485 && type.startsWith("image/svg+xml"))) {
      return reply(request, {error:"unexpected_upstream_response", id}, 502);
    }
    return new Response(response.body, {
      status:response.status, headers:{...headers, "content-type":type},
    });
  } catch {
    return reply(request, {error:"capability_unavailable", id}, 502);
  }
}

function decorate(row, env) {
  const route = routes[row.id];
  return {
    ...row,
    dispatch:route && env[route.binding] ? {
      path:`/api/dispatch/${row.id}`, method:route.method, example:route.example,
    } : null,
    implemented_here:[504, 505].includes(row.id),
  };
}

const entryFields = "id, batch_id, local_id, title, description, category, source_state, source_ref, worker_name";
const countsSql = `SELECT b.id, b.title, b.source_ref, COUNT(e.id) AS slots,
  SUM(e.source_state = 'catalog') AS cataloged, SUM(e.source_state = 'worker_name') AS worker_only,
  SUM(e.source_state = 'awaiting_source') AS awaiting_source, COUNT(e.worker_name) AS mapped
  FROM fleet_batch b JOIN fleet_entry e ON e.batch_id=b.id GROUP BY b.id ORDER BY b.id`;

async function catalog(env, url) {
  const batch = url.searchParams.get("batch") ?? "";
  const query = (url.searchParams.get("q") ?? "").trim();
  const after = url.searchParams.get("after") ?? "0";
  if ((batch && !/^[1-5]$/.test(batch)) || query.length > 120 || !/^\d{1,3}$/.test(after) || Number(after) > 505) return null;
  const terms = ["id > ?"];
  const args = [Number(after)];
  if (batch) {
    terms.push("batch_id = ?");
    args.push(Number(batch));
  }
  if (query) {
    terms.push("instr(lower(COALESCE(title,'') || ' ' || COALESCE(category,'') || ' ' || COALESCE(worker_name,'')), lower(?)) > 0");
    args.push(query);
  }
  const entries = await env.FLEET.prepare(`SELECT ${entryFields} FROM fleet_entry WHERE ${terms.join(" AND ")} ORDER BY id LIMIT 26`).bind(...args).all();
  const page = entries.results.slice(0, 25).map(row => decorate(row, env));
  return {batch, query, next:entries.results.length > 25 ? page.at(-1).id : null, entries:page};
}

const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);

function home(request, data, counts) {
  const page = new URL(request.url);
  page.searchParams.set("after", data.next ?? 0);
  const entries = data.entries.map(row => `<li><strong><a href="/api/fleet/${row.id}">#${row.id} ${escape(row.title ?? "Source pending")}</a></strong><p>${escape(row.description ?? row.worker_name ?? "")}</p>${row.dispatch ? `<small>${row.dispatch.method} ${row.dispatch.path}</small>` : ""}</li>`).join("");
  const options = counts.map(row => `<option value="${row.id}" ${String(row.id) === data.batch ? "selected" : ""}>${row.id}. ${escape(row.title)}</option>`).join("");
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sovereign Crown · Library of Tabor</title>
<style>
:root{color-scheme:dark;font:17px/1.55 system-ui;background:#101a17;color:#edf1e9}body{margin:0}main{max-width:56rem;margin:auto;padding:2rem 1.2rem 4rem}h1{font:3rem/1.05 Georgia,serif;margin:.6rem 0;letter-spacing:-.035em}a{color:#a9dec3}small,p,label{color:#c5d1c8}form{display:grid;gap:.8rem;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;margin:1.6rem 0}label{display:grid;gap:.2rem}input,select,button{width:100%;box-sizing:border-box;background:#1b2b23;border:1px solid #627b6a;border-radius:.4rem;color:inherit;font:inherit;padding:.5rem}button{align-self:end;background:#a9dec3;color:#132219;cursor:pointer}ol{list-style:none;padding:0}li{border-top:1px solid #3a5144;padding:.9rem 0}li p{margin:.14rem 0}nav{display:flex;flex-wrap:wrap;gap:.9rem}@media(max-width:640px){h1{font-size:2.35rem}form{grid-template-columns:1fr}}
</style><main><header><small>Library of Tabor</small><h1>Sovereign Crown</h1>
<p>${counts.reduce((sum, row) => sum + row.slots, 0)} fleet slots · ${counts.reduce((sum, row) => sum + row.cataloged, 0)} cataloged · ${counts.reduce((sum, row) => sum + row.worker_only, 0)} identified by Worker name</p>
<nav aria-label="Related resources"><a href="/api/health">Fleet status</a><a href="/api/capabilities">Callable tools</a><a href="https://tabor-universal-library-engine.nathantaboract.workers.dev/library/">Universal Library Engine</a></nav></header>
<form><label>Search<input type="search" name="q" maxlength="120" value="${escape(data.query)}"></label><label>Batch<select name="batch"><option value="">All batches</option>${options}</select></label><button>Search</button></form>
${entries ? `<ol>${entries}</ol>` : "<p>No matching fleet entries.</p>"}${data.next ? `<a href="${escape(page.pathname + page.search)}">Next 25 entries</a>` : ""}</main></html>`;
  return new Response(request.method === "HEAD" ? null : html, {
    headers:{...headers,"content-type":"text/html; charset=utf-8"},
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const action = /^\/api\/dispatch\/([1-9]\d{0,2})$/.exec(url.pathname);
    if (action) return dispatch(request, env, Number(action[1]), url);
    if (!["GET","HEAD"].includes(request.method)) return methodError(request, "GET, HEAD");
    if (url.pathname === "/api/capabilities") {
      const capabilities = Object.entries(routes).filter(([, route]) => env[route.binding]).map(([id, route]) => ({
        id:Number(id), path:`/api/dispatch/${id}`, method:route.method, example:route.example,
      }));
      return reply(request, {service, capabilities});
    }
    try {
      if (url.pathname === "/api/health") {
        const {results:batches} = await env.FLEET.prepare(countsSql).all();
        const slots = batches.reduce((count, batch) => count + batch.slots, 0);
        const bound = Object.values(routes).filter(route => env[route.binding]).length;
        return reply(request, {service, status:slots === 505 ? "ready" : "incomplete", slots, bound, batches}, slots === 505 ? 200 : 503);
      }
      const entry = /^\/api\/fleet\/([1-9]\d{0,2})$/.exec(url.pathname);
      if (entry) {
        const row = await env.FLEET.prepare(`SELECT ${entryFields} FROM fleet_entry WHERE id = ?`).bind(Number(entry[1])).first();
        return row ? reply(request, decorate(row, env)) : reply(request, {error:"fleet_entry_not_found"}, 404);
      }
      if (url.pathname === "/api/fleet" || url.pathname === "/") {
        const data = await catalog(env, url);
        if (!data) return reply(request, {error:"invalid_catalog_filters"}, 400);
        if (url.pathname === "/api/fleet") return reply(request, data);
        const {results} = await env.FLEET.prepare(countsSql).all();
        return home(request, data, results);
      }
      return reply(request, {error:"not_found"}, 404);
    } catch {
      return reply(request, {error:"registry_unavailable"}, 503);
    }
  },
};

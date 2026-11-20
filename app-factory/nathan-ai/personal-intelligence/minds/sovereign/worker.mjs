const base = "/sovereign-minds/";
const conductorUrl = "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor";
const academyUrl = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/minds/";
const binaryWorkers = { zero: "tabor-mind-zero", one: "tabor-mind-one" };
const fields = ["mind", "body", "eyes", "soul", "spirit", "shadow"];
const categories = { binary: "Zero and One", atlas: "Mind of Minds", box: "Sovereign Boxes",
  chat: "Minds Chat", mirror: "Mirror specifications", lasso: "Lasso profiles",
  council: "OMNI My Council", fleet: "Existing Mind Workers" };
const identifier = /^[a-zA-Z0-9_:.-]{1,220}$/;
const escape = value => String(value ?? "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const sourceRules = [
  "Keep the original record and its identity intact. Record relationships as separate links.",
  "Use only the approved source corpus for this Mind. Separate direct wording, attributed reports, interpretation and unknown.",
  "For every direct quote, preserve the exact wording, identify the actual speaker or author, and give an approved source locator.",
  "Keep unsupported or later attributions out of the subject’s voice. Retain their separate review status.",
  "Say what the record cannot establish. Mark competing sources and uncertainty explicitly.",
  "Mind, Body, Eyes, Soul, Spirit and Shadow are Nathan Tabor’s design roles. Describe historical figures as sourced study perspectives.",
];

let decoded;
async function catalog() {
  if (decoded) return decoded;
  const bytes = Uint8Array.from(atob(packedCatalog), char => char.charCodeAt(0));
  const body = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const minds = await new Response(body).json();
  decoded = { minds, byId: new Map(minds.map(item => [item.id, item])) };
  return decoded;
}

const urlFor = id => Object.hasOwn(binaryWorkers, id) ? base + id + "/" : base + "mind/" + encodeURIComponent(id);

function promptFor(item) {
  const identity = item.symbol === undefined ? "Study record" : "Symbolic digit design " + item.symbol;
  const specifics = detail(item);
  return [
    `Nathan AI · ${item.name} · ${item.id}`,
    identity + ". " + item.purpose,
    "Sovereign box: " + item.id,
    ...fields.map(facet => facet[0].toUpperCase() + facet.slice(1) + ": " + specifics[facet]),
    "Primary source: " + item.source,
    "Lasso of Truth",
    conductorPrompts.system,
    ...sourceRules,
    ...Object.entries(conductorPrompts.prompts).map(([step, instruction]) => step + ": " + instruction),
    "Return the source and attribution status with each quote or factual claim.",
  ].join("\n");
}

function detail(item) {
  return item.facets || {
    mind: item.purpose,
    body: "Independent catalog record " + item.catalogId + " in " + categories[item.origin] + ".",
    eyes: "Read the catalog entry and trace its source before asserting what the subject said or did.",
    soul: "Identity recorded as " + item.name + ". Further source-backed characterization is open.",
    spirit: "Apply the documented purpose only within its type and evidence.",
    shadow: "Flag later attributions, conflicts, unverified material, and missing evidence.",
  };
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

function page(title, body) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escape(title)} · Nathan AI</title><style>
  :root{color-scheme:dark;background:#101827;color:#eef1f7;font:1rem/1.55 system-ui,sans-serif}
  main{max-width:70rem;margin:auto;padding:clamp(.75rem,5vw,3.5rem)}a{color:#f0d28a}nav{display:flex;gap:.5rem 1rem;flex-wrap:wrap}
  h1,h2{font-family:Georgia,serif;line-height:1.12}h1{font-size:clamp(2.3rem,8vw,4.8rem);margin:.5em 0}
  .pair,.facets{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem;margin:1rem 0}
  article,dl div,section{background:#19253a;border:1px solid #59647a;padding:1rem}section{margin:1.5rem 0}
  dt{font-weight:700}dd{margin:0}form{display:flex;flex-wrap:wrap;gap:.65rem;align-items:end;margin:1rem 0}
  label{display:grid;gap:.25rem}input,select,button,textarea{font:inherit;min-height:44px}textarea{width:min(38rem,75vw)}
  ul{padding-inline-start:1.5em}li{margin:.3rem 0}code,pre{white-space:pre-wrap;overflow-wrap:anywhere}
  .digit{font-size:1.3em;line-height:1em;display:inline-block;border:1px solid #e5c980;padding:.12em .35em;margin-right:.3em}
  </style><main><nav aria-label="Nathan AI"><a href="${base}">Sovereign Minds</a><a href="${academyUrl}">Tabor Academy Minds</a>
  <a href="${conductorUrl}">Cloudflare Master Conductor</a></nav>
  <h1>${escape(title)}</h1>${body}</main></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" },
  });
}

function listing(items, url) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 160);
  const filter = url.searchParams.get("origin") || "";
  const origin = Object.hasOwn(categories, filter) ? filter : "";
  const offsetRaw = url.searchParams.get("offset") || "";
  const offset = /^\d{1,5}$/.test(offsetRaw) ? Number(offsetRaw) : 0;
  const found = items.filter(item => (!origin || item.origin === origin) &&
    [item.name, item.catalogId, item.type, item.group].join(" ").toLowerCase().includes(q.toLowerCase()));
  return { q, origin, offset, total: found.length, records: found.slice(offset, offset + 30) };
}

function directory(items, url) {
  const result = listing(items, url);
  const next = new URLSearchParams({ q: result.q, origin: result.origin, offset: String(result.offset + 30) });
  const previous = new URLSearchParams({ q: result.q, origin: result.origin, offset: String(Math.max(0, result.offset - 30)) });
  return page("Sovereign Minds", `<div class="pair"><article><h2><a href="${base}zero/"><span class="digit">0</span>Zero</a></h2>
  <p>Clear a state and preserve its receipt.</p></article><article><h2><a href="${base}one/"><span class="digit">1</span>One</a></h2>
  <p>Build from one independent unit and record its relationships.</p></article></div>
  <p>${items.length.toLocaleString("en-US")} separately addressable records. <a href="${base}api/conductors">Conductor status</a></p>
  <form action="${base}"><label>Find a Mind <input type="search" name="q" maxlength="160" value="${escape(result.q)}"></label>
  <label>Source <select name="origin"><option value="">Every source</option>
  ${Object.entries(categories).map(([id, name]) => `<option value="${id}"${id === result.origin ? " selected" : ""}>${name}</option>`).join("")}
  </select></label><button>Search</button></form>
  <p>${result.total.toLocaleString("en-US")} matches</p>
  <ul>${result.records.map(item => `<li><a href="${urlFor(item.id)}">${escape(item.name)}</a> · ${escape(categories[item.origin])}</li>`).join("")}</ul>
  <nav>${result.offset > 0 ? `<a href="${base}?${escape(previous)}">Previous page</a>` : ""}
  ${result.offset + 30 < result.total ? `<a href="${base}?${escape(next)}">Next page</a>` : ""}</nav>`);
}

function mindPage(item, finding) {
  const slots = detail(item);
  return page(item.name, `<p>${item.symbol === undefined ? "" : `<span class="digit">${item.symbol}</span>`}
    Own box <code>${escape(item.id)}</code> · ${escape(item.type)}</p>
    <dl class="facets">${fields.map(facet =>
      `<div><dt>${facet[0].toUpperCase() + facet.slice(1)}</dt><dd>${escape(slots[facet])}</dd></div>`).join("")}</dl>
    <p>${escape(item.provenance)} · <a href="${escape(item.source)}">Source record</a></p>
    <section><h2>Lasso of Truth</h2><p>Check a proposed quote against this Mind’s reviewed source excerpts.</p>
    ${item.sourceQuote ? `<p>Nathan Tabor’s exact source wording <q>${escape(item.sourceQuote)}</q></p>` : ""}
    ${item.evidence.length ? `<details><summary>Reviewed evidence</summary><ul>${item.evidence.map(record =>
      `<li>${escape(record.text)} <a href="${escape(record.url)}">${escape(record.source)}</a> · ${escape(record.status)}</li>`
    ).join("")}</ul></details>` : ""}
    ${finding ? `<p role="status"><strong>${escape(finding.message)}</strong></p>
    ${finding.proposal ? `<details><summary>Review the proposed wording</summary><pre>${escape(finding.proposal)}</pre></details>` : ""}` : ""}
    <form action="${item.symbol === undefined ? base + "lasso" : urlFor(item.id) + "lasso"}" method="post">
    <input type="hidden" name="id" value="${escape(item.id)}">
    <label>Proposed exact wording <textarea name="quote" maxlength="2000" rows="3" required></textarea></label>
    <button>Check attribution</button></form></section>
    <details><summary>Conductor prompt</summary><pre>${escape(promptFor(item))}</pre>
    <a href="${urlFor(item.id)}${item.symbol === undefined ? "/prompt" : "prompt"}">Open prompt as text</a></details>`);
}

function verifyQuote(item, quote) {
  if (item.sourceQuote && item.sourceQuote === quote) {
    return { status: "exact-creator-source", attributedTo: "Nathan Tabor", source: item.source,
      message: "Exact match to Nathan Tabor’s source wording." };
  }
  const reviewed = item.evidence.find(record => record.text === quote &&
    ((record.kind === "own-words" && record.status === "verbatim-author") ||
      (record.kind === "recorded-words" && record.status === "textual-attribution")));
  if (reviewed) return {
    status: reviewed.status === "verbatim-author" ? "exact-creator-source" : "exact-textual-attribution",
    attributedTo: reviewed.status === "verbatim-author" ? conductorPrompts.author : null,
    source: reviewed.url, locator: reviewed.source,
    message: "Exact match in " + reviewed.source + ".",
  };
  return { status: "withheld-unverified", attributedTo: null, proposal: quote,
    message: "No exact approved source match. Attribution withheld from this Mind’s voice." };
}

async function checkLasso(request, records, selected) {
  const type = request.headers.get("Content-Type")?.split(";")[0];
  if (type !== "application/json" && type !== "application/x-www-form-urlencoded") return json({ error: "unsupported_content_type" }, 415);
  const reader = request.body?.getReader();
  if (!reader) return json({ error: "body_required" }, 400);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let body = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 24000) {
        await reader.cancel();
        return json({ error: "body_too_large" }, 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    const data = type === "application/json" ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
    if (typeof data?.id !== "string" || !identifier.test(data.id) ||
        typeof data.quote !== "string" || data.quote.length < 1 || data.quote.length > 2000) {
      return json({ error: "invalid_mind_or_quote" }, 400);
    }
    const item = records.byId.get(data.id);
    if (!item || (selected && item.id !== selected)) return json({ error: "mind_not_found" }, 404);
    const finding = verifyQuote(item, data.quote);
    return type === "application/json" ? json(finding) : mindPage(item, finding);
  } catch {
    return json({ error: "invalid_body" }, 400);
  } finally {
    reader.releaseLock();
  }
}

async function serveConductorStatus(env) {
  const sources = { master: "nathan-ai-conductor", zero: binaryWorkers.zero, one: binaryWorkers.one };
  const observed = await Promise.allSettled(Object.entries(sources).map(async ([key, name]) => {
    const result = await env.PLATFORM.get(name).fetch("https://internal/" + (key === "master" ? "api/health" : "health"),
      { signal: AbortSignal.timeout(5000) });
    if (!result.ok) throw Error(key);
    const status = await result.json();
    if (key === "master" ? status.service !== name || status.ready !== true : status.id !== key || status.count !== 1) throw Error(key);
    return { ready: true, release: status.release };
  }));
  return json({
    gitHubRelease: env.RELEASE_SHA ?? null, sourceRevision: packageInfo.sourceRevision,
    ...Object.fromEntries(Object.keys(sources).map((key, index) =>
      [key, observed[index].status === "fulfilled" ? observed[index].value : { ready: false }])),
  });
}

async function forwardBinary(request, binding, part, rest) {
  try {
    const target = binding.get(binaryWorkers[part]);
    return await target.fetch(new Request("https://internal/" + rest, request));
  } catch {
    return json({ error: "mind_worker_unavailable", mind: part }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/sovereign-minds(?=\/|$)/, "") || "/";
    if (request.method === "GET" && path === "/health") return json({ ...packageInfo, release: env.RELEASE_SHA ?? null });
    if (packageInfo.id === "registry") {
      const binary = /^\/(zero|one)(?:\/(.*))?$/.exec(path);
      if (binary && binary[2] === undefined && request.method === "GET") return Response.redirect(new URL(urlFor(binary[1]), url), 308);
      if (binary) return forwardBinary(request, env.PLATFORM, binary[1], binary[2] || "");
      if (request.method === "GET" && path === "/api/conductors") return serveConductorStatus(env);
      if (request.method === "GET" && path === "/api/prompts") return json(conductorPrompts);
    }
    const records = await catalog();
    if (request.method === "POST" && path === "/lasso") {
      return checkLasso(request, records, packageInfo.id === "registry" ? null : packageInfo.id);
    }
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
    if (path === "/") return packageInfo.id === "registry" ? directory(records.minds, url) : mindPage(records.minds[0]);
    if (path === "/prompt" && packageInfo.id !== "registry") return new Response(promptFor(records.minds[0]));
    if (path === "/api/minds" && packageInfo.id === "registry") return json(listing(records.minds, url));
    if (path === "/api/mind" && packageInfo.id !== "registry") {
      const item = records.minds[0];
      return json({ ...item, facets: detail(item), prompt: promptFor(item) });
    }
    const match = /^\/(api\/minds|mind)\/([^/]+)(\/prompt)?$/.exec(path);
    if (match && packageInfo.id === "registry") {
      let id;
      try { id = decodeURIComponent(match[2]); } catch { return json({ error: "invalid_id" }, 400); }
      if (!records.byId.has(id)) return json({ error: "mind_not_found" }, 404);
      const item = records.byId.get(id);
      if (match[3]) return new Response(promptFor(item));
      return match[1] === "mind" ? mindPage(item) : json({ ...item, facets: detail(item), prompt: promptFor(item) });
    }
    return json({ error: "not_found" }, 404);
  },
};

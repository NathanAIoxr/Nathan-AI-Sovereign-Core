import { dispatchTaborSite } from "../../../app-factory/tabor-website-builder/src/public-dispatch.mjs";

const SOURCES = {
  "tabor-global-import-catalog": "GLOBAL_DB",
  "tabor-fleet-registry": "FLEET_DB",
  "nathan-ai-global-catalog": "MASTER_DB",
};
const NAMESPACE = "nathan-tabor-platforms";
const REPO = "NathanAIoxr/Nathan-AI-Sovereign-Core";
const WORKFLOW = "unified-cockpit-sync.yml";
const PAGE_SIZE = 250;
const json = (data, status = 200) => Response.json(data, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const now = () => new Date().toISOString();
const encoder = new TextEncoder();

function authorized(request, env) {
  const supplied = request.headers.get("Authorization") || "";
  if (!env.COCKPIT_KEY || !supplied.startsWith("Bearer ")) return false;
  const actual = encoder.encode(supplied.slice(7));
  const expected = encoder.encode(env.COCKPIT_KEY);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < actual.length; index++) diff |= actual[index] ^ expected[index];
  return diff === 0;
}

async function discover(env) {
  const batches = await Promise.all(Object.entries(SOURCES).map(async ([source, binding]) => {
    const { results } = await env[binding].prepare(
      "SELECT name, sql FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*' AND name != 'd1_migrations' ORDER BY name"
    ).all();
    if (!results.length) throw new Error("Source contains no application tables: " + source);
    return results.map(({ name, sql }) => ({ source, name, sql, binding }));
  }));
  return batches.flat();
}

function identity(table, keys, row, rowId) {
  if (!keys.length || keys.some(key => row[key] === null)) return "rowid:" + rowId;
  if (keys.length === 1) return String(row[keys[0]]);
  const values = keys.map(key => row[key]);
  if (table === "global_atlas_owner_resources" && values.every(value => !String(value).includes("|"))) {
    return values.join("|");
  }
  return JSON.stringify(values);
}

function record(table, keys, row, rowId) {
  const id = identity(table.name, keys, row, rowId);
  const candidate = row.repo_url ?? row.url ?? row.source_url ?? row.public_url ?? row.source_ref;
  const status = row.status ?? row.state ?? row.source_state ?? row.deployment_state ?? row.stage ?? row.contents_state ?? null;
  return {
    uid: [table.source, table.name, id].join(":"),
    id,
    label: String(row.name ?? row.title ?? row.resource_name ?? row.repo ?? row.worker_name ?? row.node_id ?? id),
    category: String(row.category ?? row.layer ?? table.name),
    url: typeof candidate === "string" && candidate.startsWith("https://") ? candidate : null,
    status: status === null ? null : String(status),
    license: row.license ?? null,
    observed: row.observed_at ?? row.updated_at ?? row.last_checked ?? row.created_at ?? null,
    original: row,
  };
}

const previous = `FROM json_each(?1) AS item
  WHERE true`;
const addRestored = `INSERT INTO restored_resources_v1
  (uid,source_db,source_table,source_id,resource_kind,custody,label,source_url,declared_status,operational_state,license_declared,original_record_json,observed_at,restored_at)
  SELECT item.value->>'uid',?2,?3,item.value->>'id','catalog_record','catalog_reference',
         item.value->>'label',item.value->>'url',item.value->>'status','INDEXED',
         item.value->>'license',item.value->'original',item.value->>'observed',?4
  ${previous} ON CONFLICT(uid) DO NOTHING`;
const addUnified = `INSERT INTO unified_catalog
  (uid,source_db,source_table,source_id,name,category,repo_url,source_status,updated_at)
  SELECT item.value->>'uid',?2,?3,item.value->>'id',item.value->>'label',
         item.value->>'category',item.value->>'url',COALESCE(item.value->>'status','REFERENCE'),?4
  ${previous} ON CONFLICT DO NOTHING`;

async function reconcile(env, table, stamp) {
  const { name, source } = table;
  const db = env[table.binding].withSession("first-primary");
  const destination = env.DB.withSession("first-primary");
  const { results: columns } = await db.prepare("PRAGMA table_info(" + quote(name) + ")").all();
  if (!columns.length) throw new Error("Table schema unavailable");
  const keys = columns.filter(col => col.pk).sort((a, b) => a.pk - b.pk).map(col => col.name);
  const names = new Set(columns.map(col => col.name.toLowerCase()));
  const rowId = /\bWITHOUT\s+ROWID\s*[,;]?\s*(?:STRICT\s*)?$/i.test(table.sql ?? "") ? null :
    ["rowid", "_rowid_", "oid"].find(key => !names.has(key));
  if (!keys.length && !rowId) throw new Error("No stable row identity");
  let alias = "__cockpit_rowid";
  while (names.has(alias)) alias += "_";
  const order = [...keys.map(quote), ...(rowId ? [quote(rowId)] : [])].join(",");
  const select = "SELECT " + (rowId ? quote(rowId) + " AS " + quote(alias) + ", " : "") +
    "* FROM " + quote(name) + " ORDER BY " + order + " LIMIT ? OFFSET ?";
  const scope = [source, name, stamp];
  let count = 0;
  let added = 0;
  for (;;) {
    const { results } = await db.prepare(select).bind(PAGE_SIZE, count).all();
    if (!results.length) break;
    const records = results.map(({ [alias]: physicalId, ...row }) => {
      if (physicalId === undefined && keys.some(key => row[key] === null)) throw new Error("Null source identity");
      return record(table, keys, row, physicalId);
    });
    const payload = JSON.stringify(records);
    const [restored] = await destination.batch([
      destination.prepare(addRestored).bind(payload, ...scope),
      destination.prepare(addUnified).bind(payload, ...scope),
    ]);
    count += records.length;
    added += restored.meta.changes;
    if (records.length < PAGE_SIZE) break;
  }
  const current = await db.prepare("SELECT COUNT(*) AS n FROM " + quote(name)).first("n");
  if (current !== count) throw new Error("Source changed during reconciliation");
  await destination.prepare(`UPDATE cockpit_source_checks
    SET live_rows=?, checked_at=?, error=NULL WHERE source_db=? AND source_table=? AND last_attempt=?`)
    .bind(count, now(), source, name, stamp).run();
  return { source, table: name, rows: count, added };
}

async function save(env, key, value) {
  await env.DB.prepare(`INSERT INTO cockpit_runtime (key,value,checked_at) VALUES (?,?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,checked_at=excluded.checked_at
    WHERE cockpit_runtime.checked_at <= excluded.checked_at`).bind(key, JSON.stringify(value), now()).run();
}

async function runImport(env, only) {
  const inventory = await discover(env);
  const stamp = now();
  await save(env, "source-inventory", inventory.map(({ source, name }) => [source, name]));
  const checks = (await env.DB.prepare(
    "SELECT source_db,source_table,last_attempt FROM cockpit_source_checks"
  ).all()).results;
  const attempts = new Map(checks.map(row => [JSON.stringify([row.source_db, row.source_table]), row.last_attempt]));
  const byAge = item => attempts.get(JSON.stringify([item.source, item.name])) || "";
  const targets = only ? inventory.filter(item => item.source === only.source && item.name === only.table) :
    inventory.sort((a, b) => byAge(a).localeCompare(byAge(b))).slice(0, 2);
  if (!targets.length) return [];
  return Promise.all(targets.map(async table => {
    const scope = [table.source, table.name];
    const lease = await env.DB.prepare(`INSERT INTO cockpit_source_checks(source_db,source_table,last_attempt)
      VALUES (?,?,?) ON CONFLICT(source_db,source_table) DO UPDATE SET last_attempt=excluded.last_attempt
      WHERE checked_at>=last_attempt OR last_attempt IS NULL OR last_attempt < ? OR error IS NOT NULL`)
      .bind(...scope, stamp, new Date(Date.parse(stamp) - 240_000).toISOString()).run();
    if (!lease.meta.changes) return { source: table.source, table: table.name, state: "busy" };
    try {
      return await reconcile(env, table, stamp);
    } catch (error) {
      console.error("Catalog reconciliation failed", ...scope, String(error));
      await env.DB.prepare("UPDATE cockpit_source_checks SET error=? WHERE source_db=? AND source_table=? AND last_attempt=?")
        .bind(String(error).slice(0, 500), ...scope, stamp).run();
      return { source: table.source, table: table.name, state: "failed" };
    }
  }));
}

async function syncGitHub(env) {
  const endpoint = "https://api.github.com/repos/" + REPO + "/actions/workflows/" + WORKFLOW +
    "/runs?branch=main&status=completed&per_page=10";
  const response = await fetch(endpoint, {
    headers: { "User-Agent": "Nathan-AI-Unified-Operations-Cockpit", Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    if (response.status === 404) return { state: "awaiting_workflow" };
    throw new Error("GitHub run lookup returned HTTP " + response.status);
  }
  const { workflow_runs: runs } = await response.json();
  const run = runs.find(item => item.head_branch === "main" &&
    ["push", "schedule", "workflow_dispatch", "repository_dispatch"].includes(item.event) &&
    Number.isSafeInteger(item.id) &&
    item.path?.split("@")[0] === ".github/workflows/" + WORKFLOW &&
    String(item.repository?.full_name).toLowerCase() === REPO.toLowerCase());
  if (!run) return { state: "awaiting_completed_run" };
  const receipt = { state: run.conclusion, run_id: run.id, finished_at: run.updated_at };
  await save(env, "github-receipt", receipt);
  return receipt;
}

async function report(env) {
  const statements = [
    env.DB.prepare("SELECT key,value,checked_at FROM cockpit_runtime"),
    env.DB.prepare("SELECT source_db,source_table,live_rows,checked_at,error FROM cockpit_source_checks"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM restored_resources_v1"),
  ];
  const [runtime, checks, ledger] = await env.DB.batch(statements);
  const optional = Object.fromEntries(runtime.results.map(row => [row.key, { ...row, value: JSON.parse(row.value) }]));
  const inventory = optional["source-inventory"]?.value || [];
  const active = new Set(inventory.map(entry => JSON.stringify(entry)));
  const verified = checks.results.filter(row => row.checked_at && !row.error &&
    Date.parse(row.checked_at) >= Date.now() - 7_200_000 &&
    active.has(JSON.stringify([row.source_db, row.source_table])));
  const dispatch = optional["platform-inventory"];
  const github = optional["github-receipt"]?.value;
  return {
    service: "unified-operations-cockpit",
    schema: 2,
    ready: inventory.length > 0 && verified.length === inventory.length,
    source_databases: Object.keys(SOURCES).length,
    source_tables: inventory.length,
    verified_tables: verified.length,
    live_source_rows: verified.reduce((total, row) => total + row.live_rows, 0),
    archived_records: ledger.results[0].n,
    platforms: {
      namespace: NAMESPACE,
      binding_present: Boolean(env.PLATFORMS),
      scripts_observed: dispatch?.value.count ?? null,
      observed_at: dispatch?.checked_at ?? null,
    },
    github: github?.run_id ? { ...github, url: "https://github.com/" + REPO + "/actions/runs/" + github.run_id } : { state: "pending" },
    checked_at: optional["source-inventory"]?.checked_at ?? null,
  };
}

function dashboard(status) {
  const nonce = crypto.randomUUID();
  const escape = value => String(value).replace(/[&<>"']/g, char =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const metric = (label, value) => "<div><dt>" + escape(label) + "</dt><dd>" + escape(value) + "</dd></div>";
  const number = value => new Intl.NumberFormat("en-US").format(value);
  const metrics = [
    metric("Source tables checked", status.verified_tables + " / " + status.source_tables),
    metric("Rows in checked source tables", number(status.live_source_rows)),
    metric("Archived records", number(status.archived_records)),
    metric("Namespace scripts observed", status.platforms.scripts_observed === null ? "Pending" : number(status.platforms.scripts_observed)),
  ].join("");
  const github = status.github.url ? '<a href="' + escape(status.github.url) + '">' + escape(status.github.state) + "</a>" :
    "Awaiting first run";
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unified Operations Cockpit</title>
  <style>body{margin:0;background:#101919;color:#f3f4ea;font:16px system-ui,sans-serif}main{max-width:920px;margin:auto;padding:clamp(28px,8vw,100px) 24px}h1{font-size:clamp(32px,7vw,66px);line-height:1;letter-spacing:-.04em;margin:0 0 22px}h2{font-size:20px}p,dt{color:#b6c8c3}dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:32px 0}dl div{border:1px solid #456058;background:#192723;padding:16px 18px}dd{margin:8px 0 0;font-size:28px;font-weight:700}a{color:#a9e2c9}aside,section{border-top:1px solid #456058;padding-top:12px;margin-top:24px}input,button{font:inherit;box-sizing:border-box;padding:9px 12px;margin:6px 6px 6px 0;border:1px solid #76948b;border-radius:4px}input{width:min(100%,19rem);background:#111b19;color:inherit}button{background:#a9e2c9;color:#10231c;cursor:pointer}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style>
  <main><h1>Unified Operations Cockpit</h1><p>${status.ready ? "Source reconciliation is current." : "Source reconciliation is in progress."}</p>
  <dl>${metrics}</dl><aside><h2>GitHub verification</h2><p>${github}</p>
  <p><a href="/api/summary">JSON status</a></p></aside>
  <section aria-labelledby="owner-heading"><h2 id="owner-heading">Owner controls</h2>
  <form id="unlock" method="post" action="/owner" autocomplete="off">
    <label for="owner-key">Cockpit key</label><br>
    <input id="owner-key" type="password" required autocomplete="off"><button>Unlock</button>
  </form>
  <div id="owner-actions" hidden>
    <button data-path="/api/status">Source checks</button>
    <button data-path="/api/platforms">Namespace status</button>
    <button data-path="/api/micro" data-method="POST">Record pulse</button>
    <button data-path="/api/import" data-method="POST">Reconcile next tables</button>
    <button data-path="/api/macro" data-method="POST">Refresh GitHub receipt</button>
    <button id="lock">Lock</button>
  </div>
  <p id="owner-message" role="status"></p><pre id="owner-result" hidden></pre></section></main>
  <script nonce="${nonce}">
    const form = document.querySelector("#unlock");
    const input = document.querySelector("#owner-key");
    const controls = document.querySelector("#owner-actions");
    const message = document.querySelector("#owner-message");
    const result = document.querySelector("#owner-result");
    let key = "";
    let pending = false;
    async function call(path, method, token) {
      const response = await fetch(path, {method, headers: {Authorization: "Bearer " + token}});
      if (response.status === 401) throw new Error("The cockpit key was rejected.");
      const data = await response.json();
      result.textContent = JSON.stringify(data, null, 2);
      result.hidden = false;
      return response.ok;
    }
    async function run(action) {
      if (pending) return;
      pending = true;
      message.textContent = "Working…";
      try { await action(); } catch (error) { message.textContent = error.message; }
      finally { pending = false; }
    }
    form.addEventListener("submit", event => {
      event.preventDefault();
      run(async () => {
        const supplied = input.value;
        input.value = "";
        if (!await call("/api/status", "GET", supplied)) throw new Error("Owner status is unavailable.");
        key = supplied;
        form.hidden = true;
        controls.hidden = false;
        message.textContent = "Owner controls unlocked.";
      });
    });
    for (const button of controls.querySelectorAll("button[data-path]")) {
      button.addEventListener("click", () => run(async () => {
        const ok = await call(button.dataset.path, button.dataset.method || "GET", key);
        message.textContent = ok ? "Request complete." : "Request failed. See the result below.";
      }));
    }
    document.querySelector("#lock").addEventListener("click", () => {
      if (pending) return;
      key = "";
      result.textContent = "";
      result.hidden = true;
      controls.hidden = true;
      form.hidden = false;
      message.textContent = "Owner controls locked.";
      input.focus();
    });
  </script></html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; script-src 'nonce-" + nonce + "'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env) {
    const taborSite = await dispatchTaborSite(request, env.PLATFORMS);
    if (taborSite) return taborSite;
    const url = new URL(request.url);
    const { pathname } = url;
    const isGet = request.method === "GET";
    if (isGet && pathname === "/health") return json({ ok: true, service: "unified-operations-cockpit", schema: 2 });
    try {
      if (isGet && pathname === "/") return dashboard(await report(env));
      if (isGet && pathname === "/api/summary") return json(await report(env));
      if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);
      if (isGet && pathname === "/api/platforms") return json((await report(env)).platforms);
      if (isGet && pathname === "/api/status") {
        const { results } = await env.DB.prepare("SELECT * FROM cockpit_source_checks ORDER BY source_db, source_table").all();
        return json({ ...await report(env), sources: results });
      }
      if (isGet && pathname === "/api/catalog") {
        const limit = Math.min(100, Math.max(1, Math.trunc(Number(url.searchParams.get("limit"))) || 25));
        const offset = Math.max(0, Math.trunc(Number(url.searchParams.get("offset"))) || 0);
        const source = url.searchParams.get("source");
        const filter = source ? " WHERE source_table=?" : "";
        const params = source ? [source, limit, offset] : [limit, offset];
        const { results } = await env.DB.prepare("SELECT * FROM unified_catalog" + filter + " ORDER BY uid LIMIT ? OFFSET ?")
          .bind(...params).all();
        return json({ items: results, limit, offset });
      }
      if (request.method === "POST" && pathname === "/api/micro") {
        await save(env, "manual-pulse", { ok: true });
        return json({ ok: true, status: await report(env) });
      }
      if (request.method === "POST" && pathname === "/api/import") {
        const source = url.searchParams.get("source");
        const table = url.searchParams.get("table");
        if ((source || table) && (!Object.hasOwn(SOURCES, source) || !table)) return json({ error: "invalid_source" }, 400);
        const results = await runImport(env, source ? { source, table } : null);
        if (!results.length) return json({ error: "unknown_table" }, 404);
        return json({ results }, results.some(result => result.state === "failed") ? 503 : 200);
      }
      if (request.method === "POST" && pathname === "/api/macro") return json(await syncGitHub(env));
      return json({ error: "not_found" }, 404);
    } catch (error) {
      console.error("Cockpit request failed", pathname, String(error));
      return json({ error: "operation_failed" }, 503);
    }
  },
  async scheduled(event, env) {
    const results = await runImport(env);
    if (new Date(event.scheduledTime).getUTCMinutes() % 15 === 0) await syncGitHub(env);
    if (results.some(result => result.state === "failed")) throw new Error("One or more source tables failed reconciliation");
  },
};

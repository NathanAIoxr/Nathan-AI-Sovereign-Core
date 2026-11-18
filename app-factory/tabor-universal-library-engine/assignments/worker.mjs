const RELEASE = "library-assignments-1";
const WINDOW = 15 * 60 * 1000;
const WORLD = "https://tabor-universal-library-engine.nathantaboract.workers.dev";
const STANDALONE = "https://tabor-standalone.nathantaboract.workers.dev";
const MAX_TASKS = 100;
const PREFIX = "tabor_library_assignment";
const asJSON = (value, status = 200) => Response.json(value, {status, headers: {"Cache-Control": "no-store"}});

export const roster = Object.freeze({
  "standalone-coverage": ["Standalone Coverage Bee", "Source Provenance Agent",
    "Find the next unpublished works and connect each one to its original source and collections."],
  "provider-credentials": ["Database Connections Bee", "Provider Access Agent",
    "Match remaining providers to owner-authorized scopes and secret bindings."],
  "app-inventory": ["App Inventory Bee", "Publication Verification Agent",
    "Reconcile portfolio entries with their original repositories, deployment status, and mobile evidence."],
  "catalog-play": ["Cartridge Coverage Bee", "Gameplay Verification Agent",
    "Convert the next Tracker Ball design record into a playable numbered cartridge and verify it in the browser."],
  "phone-qa": ["Mobile Release Bee", "Device QA Agent",
    "Run the live game on a physical iPhone and Android phone. Keep separate device receipts."],
});
const triage = ["Release Triage Bee", "Routing Agent", "Review the new ledger task and select the specialist for it."];

export function assign(ledger) {
  if (!Array.isArray(ledger?.next) || ledger.next.length > MAX_TASKS || typeof ledger.current !== "string") {
    throw new Error("Unexpected release ledger");
  }
  const seen = new Set();
  return ledger.next.map(task => {
    if (!/^[a-z0-9-]{1,80}$/.test(task.id) || seen.has(task.id) || typeof task.title !== "string") {
      throw new Error("Invalid or duplicate ledger task");
    }
    seen.add(task.id);
    const [bot, agent, nextAction] = Object.hasOwn(roster, task.id) ? roster[task.id] : triage;
    return {id: task.id, title: task.title, bot, agent, nextAction, workState: "open"};
  });
}

export function assess(id, data) {
  const {world, library, connections, standalone, inventory, atlas, devices} = data;
  const check = (name, pass, measured) => ({name, pass: Boolean(pass), measured});
  const counted = (name, observed, expected) => check(name, Number.isInteger(observed) && observed === expected,
    {observed: observed ?? null, expected: expected ?? null});
  switch (id) {
    case "standalone-coverage":
      return [
        counted("Standalone games against Library entries", standalone?.counts?.games, library?.entries),
        counted("Individual book pages against World ledger", standalone?.counts?.books, world?.counts?.bookPages),
      ];
    case "provider-credentials": {
      const providers = Array.isArray(connections?.providers) ? connections.providers : [];
      return [
        counted("Ready database bindings", connections?.totals?.ready, world?.counts?.databaseBindings),
        check("Provider modes are labeled", providers.length > 0 && providers.every(row => typeof row?.state === "string"),
          {states: providers.filter(row => typeof row?.state === "string").map(row => ({title: row.title, state: row.state}))}),
      ];
    }
    case "app-inventory": {
      const sites = Array.isArray(inventory?.items) ? inventory.items.filter(item => item?.type === "sites") : [];
      const valid = sites.length > 0 && sites.every(item => typeof item.id === "string" && item.path === "/sites/" + item.id + "/");
      return [
        counted("Portfolio entries against World ledger", inventory ? sites.length : null, world?.counts?.websiteRecords),
        check("Unique paths and identifiers", valid && sites.length === new Set(sites.map(item => item.id)).size, {entries: sites.length}),
      ];
    }
    case "catalog-play":
      return [
        counted("Playable Library entries", standalone?.counts?.games, library?.entries),
        check("Numbered v.7 backlog kept distinct", Number.isInteger(world?.counts?.trackerCatalog) && Number.isInteger(world?.counts?.runnable),
          {trackerCatalog: world?.counts?.trackerCatalog ?? null, modulesAndDrills: world?.counts?.runnable ?? null}),
        check("Play route for a catalogue sample", atlas?.id === "066" && typeof atlas?.title === "string", {sampleId: atlas?.id ?? null}),
      ];
    case "phone-qa":
      return [
        check("Mobile viewport present", devices?.viewport, null),
        check("Installable app manifest has correct scope", devices?.manifest?.scope === "/games/atlas-066/" &&
          devices?.manifest?.start_url === "/games/atlas-066/", {scope: devices?.manifest?.scope ?? null}),
      ];
    default:
      return [];
  }
}

export function review(id, checks) {
  if (!checks.length) return {state: "triage", note: "A new task has been assigned to triage."};
  if (checks.some(check => !check.pass)) return {state: "attention", note: "One or more automated checks need investigation."};
  if (id === "phone-qa") return {state: "manual-device-check", note: "Installability checks passed. Physical iPhone and Android receipts remain open."};
  if (id === "provider-credentials") return {state: "provider-review", note: "Configured databases answered. Review authorization for any remaining live provider."};
  return {state: "checks-passed", note: "The automated checks passed. The next action stays open."};
}

async function request(binding, base, path, type = "json") {
  try {
    const response = await binding.fetch(new Request(base + path, {redirect: "error", signal: AbortSignal.timeout(12000)}));
    if (!response.ok) return null;
    return await response[type]();
  } catch {
    return null;
  }
}

export async function collect(env) {
  const world = path => request(env.WORLD, WORLD, path);
  const standalone = path => request(env.STANDALONE, STANDALONE, path);
  const sample = "/games/atlas-066/";
  const [ledger, health, library, connections, host, inventory, atlas, manifest, html] = await Promise.all([
    world("/api/releases"), world("/api/health"), world("/library/api/health"), world("/library/api/connections"),
    standalone("/api/health"), standalone("/api/catalog"), world("/library/api/entries/066"),
    standalone(sample + "manifest.webmanifest"), request(env.STANDALONE, STANDALONE, sample, "text"),
  ]);
  return {ledger, world: health, library, connections, standalone: host, inventory, atlas,
    devices: {manifest, viewport: /<meta\s+name=["']viewport["']/i.test(html ?? "")}};
}

export async function run(env, now) {
  const tick = Math.floor(now / WINDOW) * WINDOW;
  const data = await collect(env);
  const tasks = assign(data.ledger).map(task => {
    const checks = assess(task.id, data);
    return {...task, checks, review: review(task.id, checks)};
  });
  const snapshot = JSON.stringify({release: data.ledger.current, checkedAt: new Date(now).toISOString(), tasks});
  await env.RECEIPTS.prepare(`INSERT INTO ${PREFIX}_runs (tick, payload) VALUES (?, ?) ON CONFLICT(tick) DO NOTHING`).bind(tick, snapshot).run();
  await env.RECEIPTS.prepare(`DELETE FROM ${PREFIX}_runs WHERE tick < ?`).bind(tick - 30 * 24 * 60 * 60 * 1000).run();
  return tasks.length;
}

const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function dashboard(data) {
  const section = data.tasks.map(t => `<article><h2>${escape(t.title)}</h2><p><strong>Bot</strong> ${escape(t.bot)}<br><strong>Agent</strong> ${escape(t.agent)}</p><p>${escape(t.nextAction)}</p><p class="state">${escape(t.review.note)}</p></article>`).join("");
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Library of Tabor Task Assignments</title><style>:root{color-scheme:dark;font:17px/1.55 system-ui;background:#0a1b17;color:#f7edcf}body{max-width:68rem;margin:auto;padding:clamp(1rem,5vw,4rem)}a{color:#f6c976;text-underline-offset:.2em}h1,h2{line-height:1.12}h1{font:clamp(2.6rem,7vw,5rem)/1 Georgia,serif;margin:.5rem 0 1rem}h2{font:1.65rem/1.15 Georgia,serif;margin:.2rem 0}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:.8rem}article{padding:1rem;border:1px solid #9b8054;background:#142820}p{margin:.65rem 0}.state{color:#cfcea9}footer{margin-top:1.5rem}</style><main><a href="https://tabor-world.nathantaboract.workers.dev/library/">Library of Tabor</a><h1>Task assignments</h1><p id="summary">${data.tasks.length} tasks · World release ${escape(data.release)}</p><p id="receipt">${data.checkedAt ? "Bot and agent checks recorded " + escape(data.checkedAt) : "First scheduled checks pending."}</p><section aria-label="Task assignments">${section}</section><footer><a href="/api/assignments">Assignments JSON</a> · <a href="${WORLD}/world/#release-notes">World release ledger</a></footer></main></html>`, {headers: {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  }});
}

export async function status(env) {
  const [ledger, receipt] = await Promise.all([
    request(env.WORLD, WORLD, "/api/releases"),
    env.RECEIPTS.prepare(`SELECT payload FROM ${PREFIX}_runs ORDER BY tick DESC LIMIT 1`).first(),
  ]);
  const last = receipt ? JSON.parse(receipt.payload) : null;
  if (!ledger && last) return {...last, sourceAvailable: false};
  const current = last && ledger && last.release === ledger.current ? last : null;
  const checked = new Map((current?.tasks ?? []).map(task => [task.id, task]));
  const tasks = assign(ledger).map(task => ({...task, checks: checked.get(task.id)?.checks ?? [],
    review: checked.get(task.id)?.review ?? {state: "scheduled", note: "Assigned. First check for this release is scheduled."}}));
  return {service: RELEASE, release: ledger.current, sourceAvailable: true, checkedAt: current?.checkedAt ?? null, tasks};
}

export default {
  async fetch(req, env) {
    const path = new URL(req.url).pathname;
    if (req.method !== "GET") return new Response(null, {status: 405, headers: {Allow: "GET"}});
    if (!["/", "/api/assignments", "/health"].includes(path)) return asJSON({error: "Route not found"}, 404);
    try {
      const data = await status(env);
      if (path === "/") return dashboard(data);
      if (path === "/health") return asJSON({service: RELEASE, release: data.release, tasks: data.tasks.length,
        checkedAt: data.checkedAt, sourceAvailable: data.sourceAvailable});
      return asJSON(data);
    } catch {
      return asJSON({error: "Assignment ledger unavailable"}, 503);
    }
  },
  async scheduled(controller, env) {
    await run(env, controller.scheduledTime);
  },
};

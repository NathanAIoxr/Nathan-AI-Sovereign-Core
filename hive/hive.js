"use strict";

const endpoint = "https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/api/repair/pairs";
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const next = document.querySelector("#next");
const help = document.querySelector("#help");
const projects = document.querySelector("#projects");
const filters = document.querySelector("#filters");
const lane = document.querySelector("#lane");
const numberFormat = new Intl.NumberFormat("en-US");
let current = "help-wanted";
let cursor = null;
let active;
let applied = new URLSearchParams();
let sourceCoverage;

function utc(timestamp) {
  return Number.isSafeInteger(timestamp) && timestamp > 0
    ? new Date(timestamp * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC"
    : "Pending";
}

function tableRow(values) {
  const tr = document.createElement("tr");
  for (const value of values) {
    const td = document.createElement("td");
    td.textContent = value;
    tr.append(td);
  }
  return tr;
}

function refreshOptions() {
  const rows = (current === "projects" ? sourceCoverage?.projects : sourceCoverage?.issues) ?? [];
  for (const [name, key] of [["provider", "provider"], ["state", "status"]]) {
    const select = filters.elements.namedItem(name);
    const value = select.value;
    select.replaceChildren(select.options[0]);
    for (const option of [...new Set(rows.map(row => row[key]))].sort()) {
      select.add(new Option(option, option));
    }
    select.value = [...select.options].some(option => option.value === value) ? value : "";
  }
}

async function loadCoverage() {
  const notice = document.querySelector("#coverage-status");
  try {
    const response = await fetch(new URL("./coverage", endpoint), { credentials: "omit" });
    if (!response.ok) throw new Error("Coverage request failed");
    sourceCoverage = await response.json();
    const { sources, issues, projects: owned } = sourceCoverage;
    document.querySelector("#source-checks").replaceChildren(...sources.map(row =>
      tableRow([row.id, row.failed ? "Check failed" : "Checked", row.items, utc(row.success_at), utc(row.covered_through)])));
    document.querySelector("#coverage-counts").replaceChildren(...[...issues, ...owned].map(row =>
      tableRow([row.provider, row.scope ?? "OWNED", row.status, numberFormat.format(row.count)])));
    refreshOptions();
    notice.textContent = `${sources.length} source checks in the ledger.`;
  } catch {
    notice.textContent = "Source coverage could not load. Open the Cloudflare dashboard for another view.";
  }
}

function assignment(item) {
  const row = document.createElement("li");
  let title = document.createElement("strong");
  try {
    const url = new URL(item.url);
    if (url.protocol === "https:" && !url.username && !url.password) {
      title = document.createElement("a");
      title.href = url.href;
    }
  } catch {
    // Some source records have no public URL.
  }
  title.textContent = item.title;
  const evidence = document.createElement("small");
  const http = item.workerBee.httpStatus ? ` (HTTP ${item.workerBee.httpStatus})` : "";
  evidence.textContent = `Worker Bee · ${item.workerBee.status}${http} · ${utc(item.workerBee.evidenceAt)} / Ant Bot · ${item.antBot.status} · ${utc(item.antBot.evidenceAt)}`;
  const context = document.createElement("small");
  context.textContent = `${item.provider} · ${item.scope}`;
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Assignment IDs";
  const ids = document.createElement("code");
  ids.textContent = `${item.workerBee.id} / ${item.antBot.id}`;
  details.append(summary, ids);
  row.append(title, context, evidence, details);
  return row;
}

async function load(kind, after = null) {
  active?.abort();
  const request = new AbortController();
  active = request;
  current = kind;
  help.setAttribute("aria-pressed", String(kind === "help-wanted"));
  projects.setAttribute("aria-pressed", String(kind === "projects"));
  lane.hidden = kind === "projects";
  lane.querySelector("select").disabled = lane.hidden;
  if (!after) {
    results.replaceChildren();
    cursor = null;
  }
  next.hidden = true;
  status.textContent = "Loading assignments from the Hive…";
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ kind, limit: "20" });
  for (const [name, value] of applied) if (value) url.searchParams.set(name, value);
  if (after) url.searchParams.set("after", after);
  try {
    const response = await fetch(url, { signal: request.signal, credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { coverage, items, nextAfter, matched } = await response.json();
    if (active !== request) return;
    const rows = items.map(assignment);
    document.querySelector("#help-count").textContent = numberFormat.format(coverage.helpWanted);
    document.querySelector("#owned-count").textContent = numberFormat.format(coverage.publicProjects);
    results.append(...rows);
    cursor = nextAfter;
    next.hidden = !cursor;
    status.textContent = `${numberFormat.format(results.children.length)} of ${numberFormat.format(matched)} matching assignments shown.`;
  } catch {
    if (active !== request) return;
    next.hidden = !cursor;
    status.textContent = "The live assignments could not load. Try again or open the Cloudflare dashboard.";
  }
}

function openLane(kind) {
  current = kind;
  filters.reset();
  refreshOptions();
}
help.addEventListener("click", () => openLane("help-wanted"));
projects.addEventListener("click", () => openLane("projects"));
filters.addEventListener("submit", event => {
  event.preventDefault();
  applied = new URLSearchParams(new FormData(filters));
  load(current);
});
filters.addEventListener("reset", () => {
  applied = new URLSearchParams();
  load(current);
});
next.addEventListener("click", () => { if (cursor) load(current, cursor); });
load(current);
loadCoverage();

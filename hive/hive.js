"use strict";

const endpoint = "https://nathan-ai-sovereign-hive.nathantaboract.workers.dev/api/repair/pairs";
const results = document.querySelector("#results");
const status = document.querySelector("#status");
const next = document.querySelector("#next");
const help = document.querySelector("#help");
const projects = document.querySelector("#projects");
const numberFormat = new Intl.NumberFormat("en-US");
let current = "help-wanted";
let cursor = null;
let active;

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
  evidence.textContent = `Worker Bee · ${item.workerBee.status} / Ant Bot · ${item.antBot.status}`;
  row.append(title, evidence);
  return row;
}

async function load(kind, after = null) {
  active?.abort();
  const request = new AbortController();
  active = request;
  current = kind;
  help.setAttribute("aria-pressed", String(kind === "help-wanted"));
  projects.setAttribute("aria-pressed", String(kind === "projects"));
  if (!after) {
    results.replaceChildren();
    cursor = null;
  }
  next.hidden = true;
  status.textContent = "Loading assignments from the Hive…";
  const url = new URL(endpoint);
  url.search = new URLSearchParams({ kind, limit: "20" });
  if (after) url.searchParams.set("after", after);
  try {
    const response = await fetch(url, { signal: request.signal, credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { coverage, items, nextAfter } = await response.json();
    if (active !== request) return;
    const rows = items.map(assignment);
    document.querySelector("#help-count").textContent = numberFormat.format(coverage.helpWanted);
    document.querySelector("#owned-count").textContent = numberFormat.format(coverage.publicProjects);
    results.append(...rows);
    cursor = nextAfter;
    next.hidden = !cursor;
    status.textContent = `${numberFormat.format(results.children.length)} assignments shown.`;
  } catch {
    if (active !== request) return;
    next.hidden = !cursor;
    status.textContent = "The live assignments could not load. Try again or open the Cloudflare dashboard.";
  }
}

help.addEventListener("click", () => load("help-wanted"));
projects.addEventListener("click", () => load("projects"));
next.addEventListener("click", () => { if (cursor) load(current, cursor); });
load(current);

const cloudflareOrigin = "https://tabor-database-atlas.nathantaboract.workers.dev";
const endpoint = new URL("/api/status", cloudflareOrigin);
const number = new Intl.NumberFormat("en-US");
const displayTime = new Intl.DateTimeFormat("en-US", { dateStyle:"medium", timeStyle:"short" });
const element = (tag, content) => {
  const node = document.createElement(tag);
  node.textContent = content;
  return node;
};
const get = id => document.getElementById(id);
const queueLabels = {
  queued: "Queued", leased: "In progress", retry: "Retrying", patchReady: "Patch ready",
  verified: "Verified", implemented: "Implemented", done: "Done", review: "Needs review"
};
const time = timestamp => displayTime.format(new Date(timestamp));

function queue(target, values) {
  if (!values) {
    target.replaceChildren(element("dt", "Status unavailable"), element("dd", "—"));
    return;
  }
  target.replaceChildren(...Object.entries(queueLabels).flatMap(([key,label]) =>
    [element("dt", label), element("dd", number.format(values[key]))]));
}

function show(data) {
  const registry = data.registry;
  const totals = {tracked:"tracked", snapshots:"verifiedSnapshots",matched:"matchingTables",pending:"awaitingAccess"};
  for (const [id,key] of Object.entries(totals)) get(id).textContent = number.format(registry[key]);
  get("database-rows").replaceChildren(...registry.snapshots.map(snapshot => {
    const row = element("tr", "");
    row.append(element("td",snapshot.title), element("td",snapshot.origin),
      element("td",`${snapshot.matchingTables} / ${snapshot.tables}`));
    return row;
  }));
  get("project-cards").replaceChildren(...data.projects.map(project => {
    const card = element("article", "");
    card.className = "project";
    card.dataset.state = project.state;
    const link = element("a", project.title);
    const url = new URL(project.url);
    if (url.protocol === "https:" && url.hostname.endsWith(".nathantaboract.workers.dev")) link.href = url.href;
    const messages = {pending:"First scheduled check pending",reachable:"Reachable",unavailable:"Check failed",redirect:"Redirected",restricted:"Sign-in required"};
    const observed = project.checkedAt ? ` · ${time(project.checkedAt)}` : "";
    const code = project.http ? ` · HTTP ${project.http}` : "";
    card.append(link, element("p", (messages[project.state] ?? "Status unknown") + code + observed));
    return card;
  }));
  queue(get("global-repairs"), data.repairs?.global);
  queue(get("internal-repairs"), data.repairs?.internal);
  const audit = data.audit;
  get("audit").textContent = audit ?
    `Ant Bot · ${audit.ledgerOk ? "Registry receipts agree" : "Registry check needs review"} · ${time(audit.checkedAt)}.` :
    "Ant Bot receipt pending.";
  get("status").textContent = `Loaded Cloudflare status · ${time(data.observedAt)}`;
}

async function refresh() {
  const button = get("refresh");
  button.disabled = true;
  get("status").textContent = "Loading Cloudflare receipts…";
  try {
    const url = location.origin === cloudflareOrigin ? "/api/status" : endpoint.href;
    const response = await fetch(url, {signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    show(await response.json());
  } catch {
    get("status").textContent = "Cloudflare status is temporarily unavailable. Use Refresh to try again.";
  } finally {
    button.disabled = false;
  }
}

get("refresh").addEventListener("click", refresh);
refresh();

const find = id => document.getElementById(id);
const states = {hosted:"Cloudflare route", registered:"Registered page", template:"Source template"};
const featured = ["bibletopia", "tabor-world", "grapple-it"];
const pageSize = 24;
const number = new Intl.NumberFormat();
let catalog;
let shown = pageSize;

function element(tag, text, cssClass) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (cssClass) node.className = cssClass;
  return node;
}

function httpsLink(label, value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:") return null;
  const node = element("a", label);
  node.href = url.href;
  return node;
}

function card(item, highlight = false) {
  const article = element("article");
  const meta = highlight ? item.kind : item.kind + " · " + states[item.state];
  article.append(element("div", meta, "card-meta"), element("h3", item.title));
  if (item.description) article.append(element("p", item.description));
  if (item.path && !highlight) article.append(element("p", item.path, "detail"));
  const links = element("div", null, "card-links");
  const launch = httpsLink(item.state === "hosted" ? "Open app" : "Open registered page", item.url);
  if (launch) links.append(launch);
  if (item.path) {
    const path = item.path.split("/").map(encodeURIComponent).join("/");
    const source = httpsLink("GitHub source", catalog.repository + "/blob/" + catalog.commit + "/" + path);
    links.append(source);
  }
  article.append(links);
  return article;
}

function render() {
  const terms = find("search").value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const kind = find("kind").value;
  const state = find("state").value;
  const matches = catalog.items.filter(item => {
    const text = [item.title, item.path, item.description].join(" ").toLowerCase();
    return (!kind || item.kind === kind) && (!state || item.state === state) && terms.every(term => text.includes(term));
  });
  find("catalog-count").textContent = number.format(matches.length) + (matches.length === 1 ? " entry" : " entries");
  const visible = matches.slice(0, shown);
  find("catalog-results").replaceChildren(...visible.map(item => card(item)));
  if (!visible.length) find("catalog-results").append(element("p", "No apps match your search."));
  find("more").hidden = visible.length >= matches.length;
}

async function read(paths) {
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (response.ok && response.headers.get("content-type")?.includes("json")) return await response.json();
    } catch {
      // A GitHub Pages copy can use the checked-in snapshot if the Worker is unavailable.
    }
  }
  throw new Error("No catalog response");
}

async function loadCatalog() {
  catalog = await read(["api/catalog", "catalog.json"]);
  find("featured-grid").replaceChildren(...featured.map(id => catalog.items.find(item => item.id === id)).filter(Boolean).map(item => card(item, true)));
  render();
  for (const id of ["search", "kind", "state"]) {
    find(id).addEventListener(id === "search" ? "input" : "change", () => {
      shown = pageSize;
      render();
    });
  }
  find("more").addEventListener("click", () => {
    const previous = find("catalog-results").children.length;
    shown += pageSize;
    render();
    const link = find("catalog-results").children[previous]?.querySelector("a");
    link?.focus();
  });
}

async function loadProgress() {
  const progress = await read(["api/progress", "progress.json"]);
  const cards = progress.batches.map(batch => {
    const article = element("article");
    article.append(element("div", batch.state, "card-meta"), element("h3", batch.title), element("p", batch.summary));
    return article;
  });
  find("progress-list").replaceChildren(...cards);
}

loadCatalog().catch(() => {
  find("catalog-count").textContent = "Catalog temporarily unavailable.";
  find("catalog-results").append(httpsLink("Open the ONE Hub catalog", "https://one-sovereign-hub.nathantaboract.workers.dev/apps.html"));
});
loadProgress().catch(() => find("progress-list").replaceChildren(element("p", "The release ledger is temporarily unavailable.")));

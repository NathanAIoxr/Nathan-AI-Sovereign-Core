import {ROOMS, browse, filtersFrom} from "./library-core.mjs";

const byId = id => document.getElementById(id);
const controls = {q: byId("query"), shelf: byId("shelf"), kind: byId("kind"), room: byId("room")};
const roomButtons = new Map();
const collection = byId("collection");
const detail = byId("detail");
let catalog;
let selected = "";
let matches = [];

function make(tag, content, cssClass) {
  const element = document.createElement(tag);
  element.textContent = content;
  if (cssClass) element.className = cssClass;
  return element;
}

function show(entry, focus = false) {
  detail.hidden = !entry;
  if (!entry) return;
  selected = entry.id;
  const heading = make("h3", entry.title);
  heading.tabIndex = -1;
  const rows = document.createElement("dl");
  for (const [key, value] of [
    ["Attributes", entry.attributes], ["Characteristics", entry.characteristics], ["Traits", entry.traits],
    ["Functionality", entry.application], ["Target", entry.target], ["Mechanic", ROOMS[entry.chassis].label],
  ]) {
    const row = document.createElement("div");
    row.append(make("dt", key), make("dd", value));
    rows.append(row);
  }
  const standalone = make("a", "Play standalone", "action");
  standalone.href = "https://tabor-standalone.nathantaboract.workers.dev/games/atlas-" + entry.id + "/";
  const launch = make("a", "Play in Grapple It ↗", "action");
  launch.href = entry.play;
  detail.replaceChildren(
    make("p", entry.id + " · " + catalog.shelves[entry.lcc], "index"),
    heading,
    make("p", catalog.kinds[entry.kind]),
    rows,
    standalone,
    launch,
  );
  for (const button of byId("results").children) button.setAttribute("aria-current", String(button.dataset.entry === selected));
  if (focus) heading.focus();
}

function updateUrl() {
  const url = new URL(location.href);
  for (const [key, control] of Object.entries(controls)) {
    if (control.value) url.searchParams.set(key, control.value);
    else url.searchParams.delete(key);
  }
  if (selected) url.searchParams.set("entry", selected);
  else url.searchParams.delete("entry");
  history.replaceState(null, "", url);
}

function render(initial = false) {
  const filters = Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.value]));
  matches = browse(catalog, filters);
  for (const [room, button] of roomButtons) button.setAttribute("aria-pressed", String(room === filters.room));
  byId("status").textContent = matches.length === 0
    ? "No applications match these filters."
    : matches.length + " of " + catalog.entries.length + " applications";
  const active = matches.find(entry => entry.id === selected) ?? matches[0];
  selected = active?.id ?? "";
  byId("results").replaceChildren(...matches.map(entry => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.entry = entry.id;
    button.append(make("span", entry.id), document.createTextNode(entry.title));
    button.onclick = () => { show(entry, true); updateUrl(); };
    return button;
  }));
  show(active);
  if (!initial) updateUrl();
}

async function open() {
  const response = await fetch("./catalog.json");
  if (!response.ok) throw new Error("Catalog unavailable");
  catalog = await response.json();
  for (const [control, options] of [[controls.shelf, catalog.shelves], [controls.kind, catalog.kinds],
    [controls.room, Object.fromEntries(Object.entries(ROOMS).map(([key, room]) => [key, room.label]))]]) {
    control.append(...Object.entries(options).map(([value, label]) => new Option(label, value)));
  }
  for (const [key, room] of Object.entries(ROOMS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.append(make("strong", room.icon + " " + room.label), make("span", room.hint));
    button.onclick = () => {
      controls.room.value = controls.room.value === key ? "" : key;
      render();
      controls.room.focus();
      collection.scrollIntoView({block: "start"});
    };
    byId("rooms").append(button);
    roomButtons.set(key, button);
  }
  const params = new URLSearchParams(location.search);
  for (const [key, value] of Object.entries(filtersFrom(params))) controls[key].value = value;
  selected = params.get("entry") ?? "";
  controls.q.addEventListener("input", () => render());
  for (const control of [controls.shelf, controls.kind, controls.room]) control.addEventListener("change", () => render());
  byId("filters").addEventListener("submit", event => { event.preventDefault(); render(); });
  byId("clear").onclick = () => {
    for (const control of Object.values(controls)) control.value = "";
    selected = "";
    render();
    controls.q.focus();
  };
  render(true);
}

open().catch(() => { byId("status").textContent = "Couldn’t load the catalog. Reload this page or open the collection in Grapple It."; });

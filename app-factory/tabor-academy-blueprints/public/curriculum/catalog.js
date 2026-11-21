const count = document.querySelector("#count");
const tracks = document.querySelector("#tracks");
const materials = document.querySelector("#materials");
const query = document.querySelector("#query");

function node(tag, label) {
  const element = document.createElement(tag);
  if (label !== undefined) element.textContent = label;
  return element;
}

function href(label, url) {
  const a = node("a", label);
  a.href = url;
  return a;
}

function showTrack(track, items, open) {
  const section = node("details");
  section.open = open;
  section.append(node("summary", track.name + " · " + items.length), href("Open source collection", track.url));
  let inGroup;
  let list;
  for (const row of items) {
    if (!list || row.group !== inGroup) {
      inGroup = row.group;
      if (inGroup) section.append(node("h3", inGroup));
      list = node("ol");
      section.append(list);
    }
    const item = node("li");
    item.append(href(row.title, row.url), node("small", " · " + row.position + (row.level ? " · " + row.level : "")));
    list.append(item);
  }
  return section;
}

function render(catalog) {
  const text = query.value.toLocaleLowerCase().trim();
  let shown = 0;
  const sections = [];
  for (const track of catalog.tracks) {
    const items = track.items.filter((row) =>
      [track.name, row.title, row.group, row.level].some((part) => (part ?? "").toLocaleLowerCase().includes(text)));
    if (!items.length) continue;
    shown += items.length;
    sections.push(showTrack(track, items, Boolean(text)));
  }
  tracks.replaceChildren(...sections);
  count.textContent = shown.toLocaleString() + " curriculum entries in source order";
}

try {
  const response = await fetch("/exports/academy-curriculum.json");
  if (!response.ok) throw new Error("Curriculum unavailable");
  const catalog = await response.json();
  for (const source of catalog.archive) {
    const item = node("li");
    const label = source.name + " · " + source.count.toLocaleString() + " records";
    item.append(source.url ? href(label, source.url) : node("span", label));
    materials.append(item);
  }
  query.addEventListener("input", () => render(catalog));
  render(catalog);
} catch {
  count.textContent = "The curriculum index could not be loaded. Reload to try again.";
}

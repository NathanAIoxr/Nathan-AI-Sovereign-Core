import { collections, sourceRows, recordTitle, repoUrl, snapshot, assembleAtlas } from "./collections.mjs";

const el = id => document.getElementById(id);
const pageSize = 30;
let activePage = 1;
let records = [];
let blocked = [];

function accept(group) {
  const option = document.createElement("option");
  option.value = group.name;
  option.textContent = group.name + " (" + group.rows.length.toLocaleString() + ")";
  el("collection").append(option);
  records.push(...group.rows.map((row, index) => {
    const title = recordTitle(row, index);
    const raw = JSON.stringify(row);
    return { title, text: (title + " " + group.name + " " + raw).toLowerCase(),
      source: group.source, collection: group.name, row };
  }));
}

function draw() {
  const query = el("search").value.trim().toLowerCase();
  const group = el("collection").value;
  const matches = records.filter(record => (!group || record.collection === group) &&
    (!query || record.text.includes(query)));
  const last = Math.max(1, Math.ceil(matches.length / pageSize));
  activePage = Math.min(last, activePage);
  el("count").textContent = matches.length.toLocaleString() + " matching records · " + records.length.toLocaleString() + " indexed";
  el("errors").textContent = blocked.length ? "Unavailable collections: " + blocked.join(", ") : "";
  el("prev").disabled = activePage === 1;
  el("next").disabled = activePage === last;
  el("page").textContent = "Page " + activePage + " of " + last;
  const offset = (activePage - 1) * pageSize;
  el("records").replaceChildren(...matches.slice(offset, offset + pageSize).map(record => {
    const article = document.createElement("article");
    const details = document.createElement("details");
    const heading = document.createElement("summary");
    const title = document.createElement("strong");
    const source = document.createElement("span");
    title.textContent = record.title;
    source.textContent = record.collection;
    heading.append(title, source);
    details.append(heading);
    details.addEventListener("toggle", () => {
      if (!details.open || details.childElementCount > 1) return;
      const body = document.createElement("pre");
      body.textContent = JSON.stringify(record.row, null, 2);
      const link = document.createElement("a");
      link.href = record.source;
      link.textContent = "Open source";
      details.append(body, link);
    });
    article.append(details);
    return article;
  }));
}

async function loadGroups() {
  const embedded = el("recovered-records");
  if (embedded) {
    for (const group of JSON.parse(embedded.textContent)) accept(group);
    return;
  }

  const documents = new Map();
  function load(source) {
    if (!documents.has(source)) {
      documents.set(source, fetch("../../" + source).then(result => {
        if (!result.ok) throw new Error("Missing source " + source);
        return result.json();
      }));
    }
    return documents.get(source);
  }
  const atlas = assembleAtlas(load, source => import("../../" + source)).then(
    group => ({ group }), () => ({ failure: "Tabor World · complete 832-record Atlas" }),
  );
  const settled = await Promise.allSettled(collections.map(async ([name, source, selector]) => {
    const rows = sourceRows(await load(source), selector);
    const link = source.endsWith("/federation.json") ? new URL("../../" + source, location.href).href :
      repoUrl + "/blob/" + snapshot + "/" + source;
    return { name, source: link, rows };
  }));
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") accept(result.value);
    else blocked.push(collections[index][0]);
  });
  const result = await atlas;
  if (result.group) accept(result.group);
  else blocked.push(result.failure);
}

for (const id of ["search", "collection"]) {
  el(id).addEventListener(id === "search" ? "input" : "change", () => { activePage = 1; draw(); });
}
el("prev").addEventListener("click", () => { activePage--; draw(); });
el("next").addEventListener("click", () => { activePage++; draw(); });

await loadGroups();
draw();

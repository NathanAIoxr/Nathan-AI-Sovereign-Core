import { labels, model, pathwayGroups } from "./pathways.mjs";
import { occupationSnapshot, occupationsGzip } from "./registered.snapshot.mjs";
import { sources } from "./sources.mjs";

const base = "/tabor-academy/institution/apprenticeships/";
const route = /^\/(?:tabor-academy\/)?institution\/apprenticeships(?:\/(.*))?$/;
const size = 30;
const total = pathwayGroups.reduce((n, group) => n + group.programs.length, 0);
const handoff = {
  project: "Tabor Academy Apprenticeships",
  publicPath: base,
  sourceSnapshot: occupationSnapshot,
  academyPathways: total,
  groups: pathwayGroups.map(({ id, status, programs }) => ({ id, status, count: programs.length })),
  catalogStatus: "Federal occupation entries, current school examples, documented withdrawals, archaeological reconstructions, historical records, living traditions, and Academy proposals.",
  activation: "A proposed Academy pathway is a course design. Create a paid placement only with a named sponsor, written pay and wage steps, mentor supervision, admissions information, required facilities, and the appropriate registration or approval.",
  related: ["/tabor-academy/institution/", "/tabor-academy/institution/mastery/", "/tabor-academy/way/human-learning-arc/", "/tabor-academy/library/"],
};
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const a = (url, label) => `<a href="${esc(url)}">${esc(label)}</a>`;
const li = items => "<ul>" + items.map(item => "<li>" + item + "</li>").join("") + "</ul>";
const refs = ids => li(ids.map(id => a(sources[id][1], sources[id][0])));
const p = value => "<p>" + esc(value) + "</p>";
const count = value => new Intl.NumberFormat("en-US").format(value);
const norm = x => x.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
const header = name => "<h2>" + esc(name) + "</h2>";
const groupCards = groups => `<div class="cards">${groups.map(group =>
  `<article><h3>${a(base + "pathway/" + group.id + "/", group.title)}</h3><p>${esc(labels[group.status])} · ${group.programs.length} pathways</p></article>`).join("")}</div>`;
const safeStep = "Review the project with a qualified mentor. Use ordinary samples or a simulation when real equipment, a license, permission or professional supervision is required.";
const typeGuide = [
  ["Time-based", "Progress is measured in approved supervised work hours and completion of related instruction."],
  ["Competency-based", "Progress depends on demonstrating the approved skills to the sponsor’s standard."],
  ["Hybrid", "Progress combines minimum work hours with demonstration of approved skills."],
];

function layout(title, content) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Tabor Academy</title><style>
:root{color-scheme:dark;color:#f5f2e5;background:#131a16;font:1rem/1.58 system-ui,sans-serif;--accent:#ead593;--surface:#1d2820;--line:#536356;--muted:#c0cbbf}
*{box-sizing:border-box}body{margin:0}header,main{max-width:73rem;margin:auto;padding-inline:clamp(1.1rem,5vw,4.5rem)}header{border-bottom:1px solid var(--line)}
nav{display:flex;flex-wrap:wrap;gap:.45rem 1.15rem;padding-block:1rem}main{padding-block:clamp(1rem,4vw,2.75rem) 4rem}
a{color:var(--accent);text-underline-offset:.2em}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--accent);outline-offset:.2em}
h1,h2,h3{font-family:Georgia,serif;font-weight:normal;line-height:1.12}h1{font-size:clamp(2.25rem,7vw,4.8rem);margin:.25rem 0 1rem;max-width:23ch}
h2{font-size:clamp(1.65rem,4vw,2.35rem);margin:2rem 0 1rem}h3{font-size:1.35rem;margin:0 .1rem .45rem}p{max-width:76ch;margin:.5rem 0 1rem}
.cards{display:grid;gap:.85rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}article{border:1px solid var(--line);background:var(--surface);padding:1rem;min-width:0}
article p:last-child{margin-bottom:0}.muted{color:var(--muted)}.from{margin-bottom:.55rem;font-weight:600}.primary{display:inline-block;font-weight:700;background:var(--accent);color:#141a12;padding:.64rem .95rem;border-radius:.2rem;text-decoration:none}
form{display:flex;align-items:end;gap:.8rem;flex-wrap:wrap;margin:.7rem 0 1.25rem}label{display:flex;flex-direction:column;gap:.2rem;min-width:0}
input,select,button{font:inherit;border:1px solid var(--line);border-radius:.2rem;padding:.58rem .72rem;min-width:0;max-width:100%;background:#152019;color:inherit}input{width:min(60vw,27rem)}
button{font-weight:700;background:var(--accent);color:#141a12;cursor:pointer}blockquote{margin-inline:0;border-left:3px solid var(--accent);padding-left:1rem}
.skip{position:absolute;left:-9999px}.skip:focus{top:.3rem;left:1rem;background:#131a16;z-index:2}.scroll{overflow:auto}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:.45rem .7rem;border-bottom:1px solid var(--line);vertical-align:top}th{color:#f8e7b3}li{margin:.25rem 0}
@media(max-width:37em){input,select{width:100%}form label{width:100%}.primary{margin-bottom:.6rem}}
</style></head><body><a class="skip" href="#main">Skip to content</a><header><nav aria-label="Apprenticeships">
${a("/tabor-academy/", "Tabor Academy")}${a(base, "Apprenticeships")}${a(base+"registered/", "U.S. occupation finder")}${a(base+"pathway/", "Pathways")}${a(base+"college/", "How it works")}
</nav></header><main id="main"><h1>${esc(title)}</h1>${content}</main></body></html>`;
}

function queryBox(action, query, filter, button, isFederal = false) {
  const options = isFederal ? typeGuide.map(([label]) => [label, label]) : Object.entries(labels);
  const choices = options.map(([value, label]) =>
    `<option value="${esc(value)}"${filter === value ? " selected" : ""}>${esc(label)}</option>`).join("");
  return `<form action="${action}" method="get"><label>${isFederal ? "Occupation, RAPIDS code or O*NET code" : "Skill or keyword"}
<input name="q" type="search" maxlength="140" value="${esc(query)}" placeholder="${isFederal ? "Try machinist or 47-2111.00" : "Try weaving, water or apprenticeship"}"></label>
<label>${isFederal ? "Training approach" : "Pathway status"}<select name="filter"><option value="">All</option>${choices}</select></label>
<button type="submit">${esc(button)}</button></form>`;
}

function homepage() {
  return layout("Tabor Academy Apprenticeships", p("Find paid training through a sponsor, try a first project, or explore how people learned their work from the earliest stone tools to today.") +
    `<p><a class="primary" href="${base}registered/">Find a registered occupation</a> &nbsp; ${a(base+"pathway/", "Explore Academy pathways")}</p>` +
    p(count(occupationSnapshot.entries) + " U.S. occupation entries · " + count(total) + " pathways and examples") +
    queryBox(base + "pathway/", "", "", "Find a pathway") +
    header("Find where to start") + groupCards(pathwayGroups) + header("Start with the college model") +
    p("Learn a skill with a mentor, take related instruction, and keep evidence of your work. The college examples show how certificates, diplomas, and associate degrees can connect to a training pathway.") +
    `<p>${a(base + "college/", "See college benchmarks and a sponsor checklist")} · ${a("/tabor-academy/institution/mastery/", "Human Learning, Survival & Mastery")}</p>` +
    `<p>${a(base+"conductor.json","Conductor handoff")}</p>`);
}

function college() {
  return layout("How the community college model works",
    p("A U.S. Registered Apprenticeship is a paid job with a mentor, progressive pay, related instruction and a recognized credential under registered standards. This Academy catalog also includes examples, projects and historical pathways.") +
    refs(["rap", "harper", "gtcc", "seattle", "nc"]) +
    header("Your next steps") + "<ol>" + model.map(([name, note]) => "<li><strong>" + esc(name) + "</strong> " + esc(note) + "</li>").join("") + "</ol>" +
    header("Ask a sponsor before enrolling") + li([
      "What is the paid job, starting wage, wage schedule and written work process?",
      "Who supervises my work and delivers related instruction?",
      "Who pays for tuition, course materials, equipment and travel?",
      "What are the admission requirements, accommodations, schedule and expected completion time?",
      "Which credential is awarded and which college will accept training for credit?",
      "How do I change employers, pause, resume, get a copy of my record, or raise a concern?",
    ]) +
    `<p>${a(sources.finder[1], "Find an apprenticeship opening")} · ${a(base+"pathway/community-college/","Explore current college examples")}</p>`);
}

function pager(path, params, page, pages) {
  if (pages <= 1) return "";
  const go = (i, label) => a(path + "?" + new URLSearchParams({ ...params, page: i }), label);
  return `<nav aria-label="Results pages">${page > 1 ? go(page - 1, "Previous") : ""}<span>Page ${page} of ${pages}</span>${page < pages ? go(page + 1, "Next") : ""}</nav>`;
}

function pathwayDirectory(url) {
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 140);
  const filter = url.searchParams.get("filter") ?? "";
  const match = norm(q);
  const groups = pathwayGroups.filter(group => !filter || group.status === filter);
  const results = groups.flatMap(group => group.programs.filter(item =>
    norm([group.title, group.era, item.name, item.project].join(" ")).includes(match)).map(item => ({ group, item })));
  const pages = Math.max(1, Math.ceil(results.length / size));
  const page = Math.min(pages, Math.max(1, Number.parseInt(url.searchParams.get("page"), 10) || 1));
  const people = q || filter ? `<p role="status">${count(results.length)} matches</p><div class="cards">` +
    results.slice((page - 1) * size, page * size).map(({ group, item }) =>
      `<article><h3>${a(base + "pathway/" + group.id + "/" + item.id + "/", item.name)}</h3><p>${esc(labels[group.status])}</p></article>`).join("") + "</div>" +
    pager(base+"pathway/", { q, filter }, page, pages) : groupCards(groups);
  return layout("Explore apprenticeship pathways", queryBox(base+"pathway/", q, filter, "Search pathways") +
    (q || filter ? `<p>${a(base+"pathway/", "Clear search")}</p>` : "") + people);
}

function pathwayGroup(group) {
  return layout(group.title,
    `<p class="from">${esc(labels[group.status])} · ${esc(group.era)}</p>` + p(group.description) +
    `<div class="cards">${group.programs.map(item => `<article><h3>${a(base + "pathway/" + group.id + "/" + item.id + "/", item.name)}</h3><p>${esc(item.project)}</p></article>`).join("")}</div>` +
    header("Sources") + refs(group.sources));
}

function pathway(group, item) {
  const groupPath = base + "pathway/" + group.id + "/";
  return layout(item.name, `<p>${a(groupPath, group.title)} · ${esc(labels[group.status])}</p>` + p(group.description) +
    header("Try a first project") + p(item.project) + p(safeStep) +
    header("Show what you learned") + li(["Write down your conditions and materials.", "Save the project record, demonstration or draft.",
      "Have your mentor check one part, ask what needs changing, then repeat it with one condition changed."]) +
    `<p>${a(groupPath + item.id + "/worksheet.txt", "Download the practice log")}</p>` +
    header("Find a next step") + p("Use the sponsor checklist to check requirements for paid training and for a college credential.") +
    `<p>${a(base + "college/", "Open the community college pathway checklist")} · ${a(base + "registered/?q=" + encodeURIComponent(item.name.split(" · ")[0]), "Search U.S. occupation records")}</p>` +
    header("Sources") + refs(group.sources));
}

async function federalData() {
  const compressed = Uint8Array.from(atob(occupationsGzip), char => char.charCodeAt(0));
  return new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"))).json();
}

function federalDirectory(url, data) {
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 140);
  const filter = url.searchParams.get("filter") ?? "";
  const tokens = norm(q).split(/\s+/).filter(Boolean);
  const matching = data.map((entry, i) => ({ entry, i })).filter(({entry:[code,title,variants]}) => {
    if (filter && !variants.some(row => norm(row[2]) === norm(filter))) return false;
    const haystack = norm([code,title,...variants.map(row => row.slice(0, 2).join(" "))].join(" "));
    return tokens.every(token => haystack.includes(token));
  });
  const pages = Math.max(1, Math.ceil(matching.length / size));
  const page = Math.min(pages, Math.max(1, Number.parseInt(url.searchParams.get("page"), 10) || 1));
  const rows = matching.slice((page - 1) * size, page * size).map(({entry:[code,title,variants],i}) =>
    `<tr><td>${a(base+"registered/"+(i+1)+"/",title)}</td><td>${esc(code || "Unassigned in source")}</td><td>${esc([...new Set(variants.map(row => row[2]))].join(", "))}</td></tr>`).join("");
  return layout("U.S. approved apprenticeship occupations",
    p("Use the occupation list to find a training standard. Visit the Job Finder or a sponsor for an open position and check pay, location, and requirements.") +
    p(count(occupationSnapshot.entries) + " occupation entries · " + count(occupationSnapshot.rows) + " source rows · Retrieved " + occupationSnapshot.retrieved) +
    queryBox(base+"registered/", q, filter, "Search occupations", true) +
    `<p role="status">${count(matching.length)} matches. ${a(base+"registered/","Clear search")}</p>` +
    (rows ? `<div class="scroll"><table><thead><tr><th>Occupation</th><th>RAPIDS code</th><th>Training approaches</th></tr></thead><tbody>${rows}</tbody></table></div>` :
      p("Try a shorter title, an O*NET code, or remove the training approach filter.")) +
    pager(base+"registered/", { q, filter }, page, pages) +
    `<p>${a(sources.finder[1], "Find an open apprenticeship")} · ${a(sources.workbook[1], "Download the original federal workbook")}</p>`);
}

function federalOccupation([code, title, variants]) {
  const value = item => esc(item || "—");
  const rows = variants.map(row => "<tr>" + row.map(item => "<td>" + value(item) + "</td>").join("") + "</tr>").join("");
  return layout(title, p(code ? "RAPIDS code " + code : "The workbook row has a blank RAPIDS code.") +
    p("The table preserves the U.S. Department of Labor’s recorded training approaches, versions and term fields. Confirm which standard applies with the sponsor.") +
    `<div class="scroll"><table><thead><tr><th>O*NET code</th><th>O*NET title</th><th>Approach</th><th>Version</th><th>Minimum term</th><th>Maximum term</th><th>Bulletins</th><th>Career lattice</th></tr></thead><tbody>${rows}</tbody></table></div>` +
    header("Ask about a placement") + li(typeGuide.map(([name,note])=>"<strong>"+esc(name)+"</strong> "+esc(note))) +
    refs(["finder","workbook","rap"]));
}

export async function serveApprenticeships(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(route);
  if (!match) return null;
  const key = (match[1] ?? "").replace(/\/$/, "");
  const segments = key.split("/");
  const reply = (content, type = "text/html", status = 200, extra = {}) => new Response(request.method === "HEAD" ? null : content,
    { status, headers: { "content-type": type + "; charset=utf-8", "x-content-type-options": "nosniff",
      "content-security-policy":"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      "cache-control": type === "text/html" ? "no-cache" : "public, max-age=900", ...extra } });
  if (!["GET","HEAD"].includes(request.method)) return reply("Method not allowed", "text/plain", 405, {allow:"GET, HEAD"});
  if (!key) return reply(homepage());
  if (key === "conductor.json") return reply(JSON.stringify(handoff), "application/json");
  if (key === "pathways.json") return reply(JSON.stringify({ groups: pathwayGroups, labels, model, sources }), "application/json");
  if (key === "college") return reply(college());
  if (key === "pathway") return reply(pathwayDirectory(url));
  if (segments[0] === "pathway") {
    const group = pathwayGroups.find(entry => entry.id === segments[1]);
    if (group && segments.length === 2) return reply(pathwayGroup(group));
    const item = group?.programs.find(entry => entry.id === segments[2]);
    if (item && segments.length === 3) return reply(pathway(group, item));
    if (item && segments.length === 4 && segments[3] === "worksheet.txt") {
      const body = [item.name,labels[group.status],item.project,safeStep,"","Date and mentor","Task and conditions","Evidence","Mentor feedback","Second attempt","Sources",
        ...group.sources.map(id=>sources[id].join(" — ")),""].join("\n");
      return reply(body,"text/plain",200,{"content-disposition":`attachment; filename="${item.id}.txt"`});
    }
  }
  if (segments[0] === "registered" && (segments.length === 1 || (segments.length === 2 && /^[1-9]\d{0,4}$/.test(segments[1])))) {
    const data = await federalData();
    if (segments.length === 1) return reply(federalDirectory(url,data));
    const found = data[Number(segments[1])-1];
    if (found) return reply(federalOccupation(found));
  }
  if (key === "registered.json") return reply(JSON.stringify({
    snapshot: occupationSnapshot,
    columns: ["O*NET code","O*NET title","Approach","Version","Minimum term","Maximum term","Bulletins","Career lattice"],
    entries: await federalData(),
  }), "application/json");
  return reply(layout("Apprenticeship page unavailable", p("Use the catalog navigation to find a pathway.")), "text/html", 404);
}

export default function withApprenticeships(previous) {
  return { ...previous, async fetch(request, env, ctx) {
    const result = await serveApprenticeships(request);
    if (result) return result;
    const response = await previous.fetch(request, env, ctx);
    const path = new URL(request.url).pathname.replace(/^\/tabor-academy(?=\/)/, "");
    const navigation = ["/", "/institution/", "/institution/mastery/", "/map/"];
    if (request.method !== "GET" || !navigation.includes(path) || !response.ok ||
      !response.headers.get("content-type")?.startsWith("text/html") || typeof HTMLRewriter === "undefined") return response;
    let added = false;
    return new HTMLRewriter().on("main h1",{ element(el){
      if(added) return;
      added = true;
      el.after(`<p data-apprenticeships-link>${a(base,"Explore Tabor Academy Apprenticeships")}</p>`,{html:true});
    }}).transform(response);
  }};
}

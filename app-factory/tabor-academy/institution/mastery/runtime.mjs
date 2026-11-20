export function createMastery(curriculum, handoff, client) {
  const root = "/tabor-academy/institution/mastery/";
  const pathPattern = /^\/(?:tabor-academy\/)?institution\/mastery(?:\/(.*))?$/;
  const quote = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const link = (url, title) => `<a href="${quote(url)}">${quote(title)}</a>`;
  const list = (items, tag = "ul") => `<${tag}>${items.map(item => "<li>" + item + "</li>").join("")}</${tag}>`;
  const refs = ids => list(ids.map(id => link(curriculum.sources[id][1], curriculum.sources[id][0])));
  const text = value => "<p>" + quote(value) + "</p>";
  const section = (title, content) => `<section><h2>${quote(title)}</h2>${content}</section>`;
  const rubrics = () => list(curriculum.rubric.map(item => quote(item.criterion) + " · " + item.points + " points"));
  const reveal = (label, value) => `<details><summary>${quote(label)}</summary>${text(value)}</details>`;
  const capstonePath = id => root + "capstone/" + id + "/";
  const teamReview = "Have a second learner retrace your result from the original records. Save corrections with the earlier version and identify what would change your answer.";

  const styles = `:root{color-scheme:dark;background:#111711;color:#f4f0e6;font:1rem/1.6 system-ui,sans-serif;--line:#465748;--muted:#c0c9bb;--accent:#e5cf91}
*{box-sizing:border-box}[hidden]{display:none}body{margin:0}header,main{max-width:70rem;margin:auto;padding-inline:clamp(1rem,5vw,4rem)}header{border-bottom:1px solid var(--line)}
nav{display:flex;flex-wrap:wrap;column-gap:1.25rem;row-gap:.35rem;padding-block:1rem}main{padding-top:clamp(1rem,3vw,3rem);padding-bottom:4rem}
a,summary{color:var(--accent);text-underline-offset:.18em}a:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:.25rem}
h1,h2,h3{font-family:Georgia,serif;line-height:1.08;font-weight:400}h1{font-size:clamp(2.5rem,7vw,5rem);margin:.25rem 0 1rem;max-width:18ch}
h2{font-size:clamp(1.65rem,4vw,2.4rem);margin:0 0 1rem}h3{font-size:1.42rem;margin:.1rem 0 .6rem}p{max-width:76ch;margin:.55rem 0 1rem}
section{border-top:1px solid var(--line);margin-top:2rem;padding-top:1.25rem}.cards{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
.card{border:1px solid var(--line);padding:1rem;background:#1a231a}.card p{color:var(--muted);margin-bottom:0}
blockquote{margin:1.4rem 0;border-left:3px solid var(--accent);padding:.1rem 1rem}blockquote p{margin:.45rem 0}cite{color:var(--muted)}
details{margin:.6rem 0;padding:.6rem .85rem;border:1px solid var(--line)}summary{cursor:pointer}.tools{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
button{background:var(--accent);color:#141a12;font:inherit;font-weight:700;border:0;border-radius:.2rem;padding:.55rem .85rem;cursor:pointer}
#lesson-state{color:var(--muted)}.station-list li{margin-bottom:.9rem}li p{margin:.25rem 0}.skip{position:absolute;left:-9999px}.skip:focus{left:1rem;z-index:2;background:#111711}`;
  function page(title, content, useClient = false) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${quote(title)} · Tabor Academy</title><style>${styles}</style>${useClient ? `<script src="${root}practice.js" defer></script>` : ""}</head>
<body><a class="skip" href="#main">Skip to lesson</a><header><nav aria-label="Academy">
${link("/tabor-academy/", "Tabor Academy")}${link(root, "Human Learning & Mastery")}${link(root + "timeline/", "Historical Methods")}${link("/tabor-academy/library/", "Library of Tabor")}
</nav></header><main id="main"><h1>${quote(title)}</h1>${content}</main></body></html>`;
  }

  const card = (url, title, description) => `<article class="card"><h3>${link(url, title)}</h3>${text(description)}</article>`;
  function home() {
    const motto = "<blockquote>" + curriculum.motto.map(text).join("") + "<cite>Nathan Tabor</cite></blockquote>";
    const tracks = curriculum.tracks.map(track => card(root + track.id + "/", track.title, track.description));
    const rows = items => list(items.map(([label, description]) => "<strong>" + quote(label) + "</strong> " + quote(description)), "ol");
    return page(curriculum.title, motto +
      `<div class="cards">${card(root + "timeline/", "131 Historical Methods", "The original 101 methods, 30 timeline additions and 18 extended stations.")}${tracks.join("")}</div>` +
      section("The Nathan Tabor Way", rows(curriculum.cycle)) + section("Mastery progression", rows(curriculum.ranks)) +
      section("Read the foundations", list(curriculum.foundations.map(([url, title]) => link(url, title))) +
        curriculum.readings.map(([title, description, ids]) =>
          `<h3>${quote(title)}</h3>${text(description)}${refs(ids)}`).join("")) +
      section("Course materials", list([link(root + "curriculum.json", "Download the curriculum JSON"),
        link(root + "conductor.json", "Open the Conductor handoff")])));
  }

  function trackPage(track) {
    const base = root + track.id + "/";
    const cards = track.courses.map(item => card(base + item.id + "/", item.title, item.question));
    const capstone = curriculum.capstones[track.capstone];
    const connections = [track.world && link(track.world, "Explore the separate Tabor World stations"),
      track.related && link(track.related, track.id === "magi" ? "Comparative Civics & Legal Language" : "Open the existing Academy collection")].filter(Boolean);
    const methods = track.id === "unknown-unseen" ? section("Off-world training methods",
      list(curriculum.methods.map(([title, description]) => "<strong>" + quote(title) + "</strong> " + quote(description)), "ol")) : "";
    return page(track.title, text(track.description) + (connections.length ? list(connections) : "") +
      `<div class="cards">${cards.join("")}</div>` + methods +
      section("Capstone", card(capstonePath(track.capstone), capstone.title, capstone.setup)));
  }

  const tools = key => `<div class="tools" data-practice="${quote(key)}" hidden>
<button type="button" data-hold>Hold on</button><button type="button" data-done>Mark practiced</button>
<span id="lesson-state" role="status" aria-live="polite"></span></div>`;
  function lesson(track, item) {
    const parent = root + track.id + "/";
    const following = track.courses[track.courses.indexOf(item) + 1];
    const next = following ? link(parent + following.id + "/", "Next · " + following.title) :
      link(capstonePath(track.capstone), "Next · " + curriculum.capstones[track.capstone].title);
    const stations = item.stations ? section("Practice stations", `<div class="station-list">` +
      item.stations.map(station => `<details><summary>${quote(station.title)}</summary>${text(station.station)}
${text(station.question)}${reveal("Check your reasoning", station.check)}<p>${link(station.academy, "Related Academy exercise")}</p></details>`).join("") + "</div>") : "";
    return page(item.title,
      `<nav aria-label="Course sequence">${link(parent, track.title)}${next}</nav>` + text(item.lesson) +
      section("Practice", text(item.lab) + tools(track.id + "/" + item.id)) +
      section("What to submit", text(item.evidence) +
        text(teamReview) + `<p>${link(parent + item.id + "/worksheet.txt", "Download the worksheet")}</p>`) +
      section("Check your reasoning", text(item.question) + reveal("Show the worked response", item.answer)) +
      stations + section("Sources", refs(item.sources)), true);
  }

  function timeline() {
    const history = curriculum.historical;
    const sections = history.eras.map(era => section(era.title, text(era.purpose) +
      era.stations.map(station => `<details><summary>${station.id > 30 ? "Extension " : "Method "}${station.id} · ${quote(station.title)}</summary>
${text(station.station)}${text(station.question)}${reveal("Check your reasoning", station.check)}
<p>${link(station.academy, "Related Academy exercise")}</p></details>`).join("")));
    return page("131 Historical Methods", text("The original 101 plus 30 additions make up the 131-method catalog. This navigator also shows 18 later stations. It preserves the source identifiers and lets you navigate to the separate World timeline.") +
      list([link(history.original, "Open all 101 original methods and their source text"),
        link(history.related, "Open the Human Learning Arc in the Academy"),
        link(history.world, "Open the separate Tabor World timeline")]) + sections.join(""));
  }

  function capstone(id, item) {
    const track = curriculum.tracks.find(entry => entry.capstone === id);
    return page(item.title, `<p>${link(root + track.id + "/", track.title)}</p>` + text(item.setup) +
      section("First decision", text(item.prompt) + tools("capstone/" + id)) +
      section("New evidence", reveal("Open after recording your first decision", item.reveal)) +
      section("Revised decision", text(teamReview) +
        reveal("Compare your revision with the worked response", item.evaluate) +
        list([link(capstonePath(id) + "worksheet.txt", "Download the capstone worksheet")])) +
      section("Mastery rubric", rubrics() + text("The Academy target is 90 points. Use the four criteria in a documented instructor or peer review.")) +
      section("Sources", refs(item.sources)), true);
  }

  function worksheet(title, instructions, sources, labels) {
    return [title, "", instructions, "", ...labels.flatMap(label => [label, "____________________________", ""]),
      "Sources", ...sources.map(id => curriculum.sources[id].join(" — ")), ""].join("\n");
  }

  return function serveMastery(request) {
    const matched = new URL(request.url).pathname.match(pathPattern);
    if (!matched) return null;
    const parts = (matched[1] ?? "").replace(/\/$/, "").split("/");
    const respond = (body, type = "text/html", status = 200, extra = {}) => new Response(
      request.method === "HEAD" ? null : body, { status, headers: {
        "content-type": type + "; charset=utf-8",
        "cache-control": "no-store", "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        "referrer-policy": "same-origin", ...extra,
      } });
    const sheet = (body, filename) => respond(body, "text/plain", 200,
      { "content-disposition": `attachment; filename="${filename}.txt"` });
    const json = value => respond(JSON.stringify(value), "application/json");
    const missing = () => respond(page("Course page unavailable", text("Use the Academy navigation to find a course.")), "text/html", 404);
    if (!["GET", "HEAD"].includes(request.method)) return respond("Method not allowed", "text/plain", 405, { allow: "GET, HEAD" });
    if (parts.length === 1) {
      if (!parts[0]) return respond(home());
      if (parts[0] === "timeline") return respond(timeline());
      if (parts[0] === "curriculum.json") return json(curriculum);
      if (parts[0] === "conductor.json") return json(handoff);
      if (parts[0] === "practice.js") return respond(client, "text/javascript");
    }
    const [trackId, courseId, action] = parts;
    const sheetRequested = parts.length === 3 && action === "worksheet.txt";
    if (parts.length > 2 && !sheetRequested) return missing();
    if (trackId === "capstone" && Object.hasOwn(curriculum.capstones, courseId)) {
      const item = curriculum.capstones[courseId];
      return sheetRequested ? sheet(worksheet(item.title, item.setup + "\n\n" + item.prompt, item.sources,
        ["Original observations and sources", "Competing explanations", "First decision", "New evidence", "Revised decision and open questions", "Independent review"]), courseId) :
        respond(capstone(courseId, item));
    }
    const track = curriculum.tracks.find(entry => entry.id === trackId);
    if (!track) return missing();
    if (parts.length === 1) return respond(trackPage(track));
    const item = track.courses.find(entry => entry.id === courseId);
    if (!item) return missing();
    return sheetRequested ? sheet(worksheet(item.title, item.lab, item.sources,
      ["Conditions and observations", "Evidence of practice", "Uncertainty or correction", "Independent review"]), item.id) :
      respond(lesson(track, item));
  };
}

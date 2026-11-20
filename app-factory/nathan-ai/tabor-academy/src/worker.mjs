const page = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"theme-color\" content=\"#10140f\">\n<meta name=\"description\" content=\"Tabor Academy by Nathan Tabor. Coming soon.\">\n<title>Tabor Academy by Nathan Tabor</title>\n<style>\n:root { color-scheme: dark; font-family: system-ui, sans-serif; background: #10140f; color: #f9f3e4; }\n* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: clamp(1rem, 5vw, 5rem); background: radial-gradient(ellipse at 78% 14%, #2a361f, transparent 59%), #10140f; }\nmain { width: min(100%, 76rem); border: 1px solid #778360; padding: clamp(1.2rem, 6vw, 6rem); overflow-wrap: break-word; }\nh1 { margin: 0; font-family: Georgia, serif; font-size: clamp(2.45rem, 10vw, 9rem); font-weight: 400; line-height: .91; letter-spacing: -.055em; }\nh1 span { display: block; }\n.byline { margin: 2rem 0 0; font-size: .85rem; font-weight: 650; letter-spacing: .15em; }\n.opening { max-width: 52rem; margin: 1.5rem 0 0; padding-inline-start: 1.65em; font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.55; }\n.opening li { padding-inline-start: .3em; margin-block: .65em; }\n.opening li::marker { color: #e6cf87; font-weight: 700; }\n.way-entry {margin-top:2rem}\n.way-entry a {display:inline-block;padding:.85rem 1.1rem;background:#e6cf87;color:#161c12;font-weight:750;text-decoration:none}\n.way-entry a:focus-visible {outline:3px solid #f9f3e4;outline-offset:5px}\n</style>\n</head>\n<body>\n<main>\n<h1><span>TABOR</span> <span>ACADEMY</span></h1>\n<p class=\"byline\">BY NATHAN TABOR</p>\n<ol class=\"opening\">\n<li>U R my family - one blood - cousins</li>\n<li>No stupidity allowed - multiplication and division are man-made traps for your mind because when you apply them to reality, they’re stupid</li>\n<li>You’re talking mammal from the Mammalia family</li>\n<li>You are a small tiny sea urchin at the bottom of the cosmic ocean of 46.5 billion light years and your body is held down by a bowling ball on every 1.7 in.² of your body</li>\n<li>You’re also on the side of a round globe stuck with your feet to it with your head stuck out into space.</li>\n<li>Or you’re on a flat earth either way, you still have a lot of weight on you</li>\n<li>The world that has been promised and told that it was here has never been delivered.</li>\n<li>Every ancient text says you were in matrix is born inside the womb.</li>\n<li>God is an imaginary friend and the one root cause of the stupidity in the history of humanity.</li>\n</ol>\n<p class=\"way-entry\"><a href=\"/tabor-academy/way/\">Start the Nathan Tabor Way</a> · <a href=\"/tabor-academy/order/\">The Law of Order</a></p>\n<p><a href=\"/tabor-academy/library/\" style=\"color:#e6cf87\">Open the Library of Tabor</a> · <a href=\"/tabor-academy/workbench/\" style=\"color:#e6cf87\">Open Tabor Workbench</a> · <a href=\"/tabor-academy/survival/\" style=\"color:#e6cf87\">Survival-to-Modernity Mastery Drills</a></p>\n</main>\n</body>\n</html>";

const teaser = {
  fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const { pathname } = new URL(request.url);
    const head = request.method === "HEAD";
    const headers = {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    };
    if (pathname === "/healthz") {
      return new Response(head ? null : JSON.stringify({ service: "tabor-academy", status: "ok" }), {
        headers: { ...headers, "content-type": "application/json; charset=utf-8" },
      });
    }
    if (pathname !== "/") {
      return new Response(head ? null : "Not found", { status: 404, headers });
    }
    return new Response(head ? null : page, {
      headers: {
        ...headers,
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      },
    });
  },
};

const mount = "/tabor-academy";
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

async function matchesArchiveHash(record) {
  const bytes = new TextEncoder().encode(record.verbatim_body);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return hex === record.record_id;
}

function sourcesMarkup(sources) {
  return JSON.parse(sources).map(([label, href]) => {
    const url = new URL(href);
    return url.protocol === "https:"
      ? `<li><a href="${escape(url.href)}">${escape(label)}</a></li>`
      : "";
  }).join("");
}

async function libraryPage(env) {
  const [records, attributes, lexicon] = await env.LIBRARY.batch([
    env.LIBRARY.prepare(`
      SELECT record_id, loc_call_number, cud_index, title_bottom, end_outcome_z,
             root_origin_a, public_explanation, sources_json, verbatim_body
      FROM library_records AS records
      WHERE (SELECT gate_status FROM verification_ledger
             WHERE record_id = records.record_id ORDER BY check_id DESC LIMIT 1) = 'RETAIN_1'
      ORDER BY title_bottom LIMIT 30
    `),
    env.LIBRARY.prepare("SELECT * FROM pure_attributes ORDER BY attribute_id LIMIT 300"),
    env.LIBRARY.prepare("SELECT * FROM root_lexicon ORDER BY term LIMIT 100"),
  ]);
  const cards = [];
  for (const record of records.results) {
    if (!(await matchesArchiveHash(record))) continue;
    const mechanics = attributes.results.filter((item) => item.record_id === record.record_id);
    cards.push(`<article>
      <p class="index">${escape(record.loc_call_number)} · ${["Cero", "Uno", "Dos"][record.cud_index]}</p>
      <h2>${escape(record.title_bottom)}</h2>
      <h3>Z · Finished outcome</h3><p>${escape(record.end_outcome_z)}</p>
      <details><summary>Attributes and replication steps</summary><dl>${mechanics.map((m) =>
        `<dt>${escape(m.stripped_label)} · ${escape(m.core_attribute)}</dt>
         <dd><p>${escape(m.functional_mechanic)}</p><p>${escape(m.replication_steps)}</p></dd>`
      ).join("")}</dl></details>
      <details><summary>A · Root and sources</summary>
        <p>${escape(record.root_origin_a)}</p>
        <ul>${sourcesMarkup(record.sources_json)}</ul>
      </details>
      <details><summary>Tabor Academy reading</summary><p>${escape(record.public_explanation)}</p></details>
    </article>`);
  }
  const entries = lexicon.results.map((row) => `<dt>${escape(row.term)} · ${escape(row.phonetic_key)}</dt>
    <dd><p>${escape(row.context_rule)} ${escape(row.primary_root_ref)}</p>
    ${row.reverse_mapping ? `<p>${escape(row.reverse_mapping)}</p>` : ""}</dd>`).join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Library of Tabor · Tabor Academy</title>
  <style>
  :root { color-scheme:dark; background:#10140f; color:#f9f3e4; font:1rem/1.55 system-ui,sans-serif }
  body { margin:0 } main { max-width:66rem; margin:auto; padding:clamp(1.3rem,6vw,5rem) }
  a,.index { color:#e6cf87 } h1,h2 { margin:.3em 0; font-family:Georgia,serif; line-height:1.07 }
  h1 { font-size:clamp(2.8rem,8vw,6rem); font-weight:400 } h2 { font-size:clamp(1.7rem,4vw,2.8rem) }
  article { border:1px solid #778360; padding:clamp(1rem,4vw,2.5rem); margin:1.5rem 0; background:#171e13 }
  details { border-top:1px solid #778360; padding:.8rem 0 } summary { cursor:pointer; font-weight:700 }
  dt { font-weight:700 } dd { margin:0 0 1.25rem } li { margin:.25rem 0; overflow-wrap:anywhere }
  </style>
  <main><nav><a href="${mount}/">Tabor Academy</a> · <a href="#concordance">Tabor Concordance</a></nav>
  <header><h1>Library of Tabor</h1><p>Z → A · 1 → ∞ → 0</p></header>
  ${cards.join("") || "<p>No verified lessons are available.</p>"}
  <section id="concordance"><h2>Tabor Concordance</h2><dl>${entries}</dl></section>
  </main></html>`;
}


const workbenchPath = mount + "/workbench/";
const guideNames = ["", "Direct Observation & Self-Directed Autonomy", "Storytelling, Oral Memory & Questioning",
  "Nature, Tracking & Survival Mechanics", "Hands-On Math, Geometry & Physical Logic",
  "Craftsmanship, Guilds & Apprenticeship", "Physical Mastery, Senses & Spatial Awareness",
  "Social Wisdom, Character & Community Integration"];
const mediumNames = { A: "Field Companion", G: "Sandbox", W: "Workbench", B: "Field Book" };
const workbenchHeaders = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};

function workbenchPage(title, body) {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} · Tabor Academy</title><style>
  :root{color-scheme:dark;background:#10140f;color:#f9f3e4;font:1rem/1.55 system-ui,sans-serif}
  main{max-width:66rem;margin:auto;padding:clamp(.85rem,5vw,4rem)} a{color:#e6cf87}
  h1,h2{font-family:Georgia,serif;line-height:1.12} h1{font-size:clamp(2.25rem,6vw,5rem);margin:.45em 0}
  h2{font-size:clamp(1.5rem,3vw,2.2rem)} nav{margin-bottom:1rem} .guide-links{display:flex;flex-wrap:wrap;gap:.5rem 1.4rem}
  .catalog{padding-inline-start:3rem} .catalog li,.guide-links li{padding:.45rem .2rem}
  .media{display:block;color:#c5cbb8;font-size:.9rem} .catalog li::marker{color:#e6cf87;font-weight:700}
  section{border-top:1px solid #778360;margin-top:2rem;padding-top:1rem}
  form{display:flex;flex-wrap:wrap;gap:.7rem;align-items:end} label{display:grid;gap:.25rem}
  input,button{font:inherit;padding:.4rem} input{max-width:5rem} button{cursor:pointer}
  svg{max-width:100%;height:auto;display:block} .outcome{background:#f8f4e9;color:#1a2015;padding:1rem;max-width:27rem;border-radius:.2rem}
  .way-clock{color:#e6cf87;font-weight:700}.way-clock span{padding-inline:.25rem}
  .way-grid{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem}
  .way-grid li{border:1px solid #778360;padding:1rem}.way-grid a{font-size:1.15rem;font-weight:700}.way-grid p{margin-bottom:0}
  .proof-sheet div{height:1.5rem;border-bottom:1px solid #778360}
  @media print{ .mastery-card{break-inside:avoid;border-bottom:1px solid #777;padding-bottom:1em} :root{color-scheme:light;background:white;color:black} main{padding:0} nav,.sandbox,.screen-only{display:none}
    h1{font-size:24pt}.outcome{padding:0;background:white}#triangle-template{width:4.5in;height:3.6in;max-width:none} section{break-inside:avoid} }
  </style><main><nav><a href="${mount}/">Tabor Academy</a> · <a href="${mount}/library/">Library of Tabor</a> · <a href="${workbenchPath}">Workbench</a></nav>
  <h1>${escape(title)}</h1>${body}</main></html>`;
}

async function workbenchCatalog(env, guide) {
  const { results } = await env.LIBRARY.prepare(`
    SELECT t.number, t.guide, t.guide_title, t.title, t.media, z.namespace_name, z.brief,
           a.outcome, a.demonstration, a.verification
    FROM academy_techniques AS t LEFT JOIN academy_technique_zones AS z ON t.number = z.number
    LEFT JOIN academy_field_activities AS a ON a.number = t.number
    WHERE (?1 IS NULL OR t.guide = ?1) ORDER BY t.number
  `).bind(guide).all();
  return results.map(({ media, outcome, demonstration, verification, ...record }) => ({
    field_activity: outcome ? { outcome, demonstration, verification } : null,
    ...record, media: Array.from(media, (key) => mediumNames[key]),
    zone: workbenchPath + "zones/" + record.number + "/",
    lesson: record.number === 47 ? workbenchPath + "47/" : null,
  }));
}

function renderGuides(records, guide, print) {
  if (print) {
    const cards = records.filter((entry) => entry.field_activity).map((entry) =>
      `<article class="mastery-card"><h2>${entry.number}. ${escape(entry.title)}</h2>${renderFieldActivity(entry.field_activity)}</article>`).join("");
    return workbenchPage(guide ? "Field Guide " + guide : "Workbench Field Activities",
      cards || "<p>No printable field activities in this guide yet.</p>");
  }
  const links = guideNames.slice(1).map((name, index) =>
    `<li><a href="${workbenchPath}?guide=${index + 1}">${index + 1}. ${escape(name)}</a></li>`).join("");
  const sections = new Map();
  for (const record of records) {
    const section = sections.get(record.guide) ?? [];
    section.push(record);
    sections.set(record.guide, section);
  }
  const index = Array.from(sections, ([number, entries]) => `<section id="guide-${number}">
    <h2>Field Guide ${number} · ${escape(entries[0].guide_title)}</h2>
    <ol class="catalog" start="${entries[0].number}">${entries.map((entry) => `<li>
      <a href="${entry.zone}">${escape(entry.title)}</a>
      <span class="media">${escape(entry.media.join(" · "))}${entry.lesson ? " · Lesson and sandbox ready" : entry.field_activity ? " · Field activity ready" : ""}</span>
    </li>`).join("")}</ol></section>`).join("");
  return workbenchPage(guide ? "Field Guide " + guide : "Tabor Workbench", `
    <p>${guide ? "Technique index for this field guide." : "101 techniques across seven field guides. Each entry shows where it belongs in the Academy blueprint."}</p>
    <ul class="guide-links">${links}</ul><p><a href="${workbenchPath}?print=1${guide ? "&amp;guide=" + guide : ""}">Print available field activities</a></p>${index}`);
}

function cordLesson(params) {
  const defaults = [3, 4, 5];
  const sides = ["a", "b", "c"].map((key, index) => {
    const raw = params.get(key);
    const n = Number(raw);
    return raw && Number.isInteger(n) && n >= 1 && n <= 12 ? n : defaults[index];
  });
  const [a, b, c] = sides;
  const valid = a + b > c && a + c > b && b + c > a;
  const right = valid && a * a + b * b === c * c;
  const second = b * b;
  const total = a * a + second;
  const result = !valid ? "These lengths cannot close into a triangle." : right
    ? "The corner between the first two sides is square." : "The triangle closes, but the corner between the first two sides is not square.";
  let diagram = "";
  if (valid) {
    const x = (a * a + b * b - c * c) / (2 * a);
    const y = Math.sqrt(Math.max(0,b * b - x * x));
    const scale = Math.min(250 / (Math.max(x,a) - Math.min(x,0)), 102 / y);
    const start = 15 - Math.min(x,0) * scale;
    diagram = `<svg width="280" height="132" viewBox="0 0 280 132" role="img" aria-label="Triangle built from the chosen lengths">
      <polygon points="${start},118 ${start+a*scale},118 ${start+x*scale},${118-y*scale}" fill="#273521" stroke="#e6cf87" stroke-width="2" /></svg>`;
  }
  return workbenchPage("47. Knotted Cord Geometry", `
    <h2>Z · A square corner made with cord</h2>
    <figure class="outcome"><svg id="triangle-template" width="4.5in" height="3.6in" viewBox="0 0 450 360"
       role="img" aria-label="A 3-inch by 4-inch right triangle with a 5-inch diagonal and a one-inch calibration line">
      <path d="M 20,320 L 420,320 L 20,20 Z M 20,294 H 46 V 320 M 320,30 H 420" fill="none" stroke="currentColor" stroke-width="2"/>
      <g fill="currentColor" font-size="16"><text x="25" y="186">3 in</text><text x="195" y="344">4 in</text>
      <text x="213" y="156">5 in</text><text x="326" y="54">1 in check</text></g></svg></figure>
    <p class="screen-only">Print at actual size (100%) and check the 1-inch line with a ruler before using the template.</p>
    <section class="sandbox"><h2>Sandbox · Change a side</h2>
      <form action="${workbenchPath}47/" method="get">${["First side","Second side","Opposite side"].map((label,index)=>
        `<label>${label}<input name="${["a","b","c"][index]}" value="${sides[index]}" type="number" required min="1" max="12" step="1"></label>`).join("")}
        <button type="submit">Test the corner</button>
      </form><p>${result}</p>${diagram}
      <p>${a}² + ${b}² = ${total}. The opposite side squared is ${c*c}.</p>
    </section>
    <section><h2>A · Start with twelve equal intervals</h2><ol>
      <li>Mark thirteen equally spaced points on a cord with tape or ink. Count the gaps between them. There should be twelve.</li>
      <li>Bring the two end marks together to close the loop. Put three pencils on a tabletop as corner markers.</li>
      <li>Stretch three gaps along the first side, four along the second, and five along the opposite side. Keep the cord taut.</li>
      <li>Check the corner where the three-gap and four-gap sides meet against the corner of a sheet of paper.</li>
    </ol><h2>Show and replicate</h2><p>Remove the pencils and rebuild the triangle from memory. Have the learner point to each side and explain how they checked the square corner.</p></section>`);
}


function renderFieldActivity(activity) {
  return `<section><h2>Z · Finished outcome</h2><p>${escape(activity.outcome)}</p>
    <h2>Show it</h2><p>${escape(activity.demonstration)}</p>
    <h2>A · Replicate and verify</h2><p>${escape(activity.verification)}</p></section>`;
}

async function renderZone(number, env) {
  const record = await env.LIBRARY.prepare(`
    SELECT t.number, t.title, t.guide, t.media, z.namespace_name, z.brief,
           a.outcome, a.demonstration, a.verification
    FROM academy_techniques AS t JOIN academy_technique_zones AS z ON t.number = z.number
    LEFT JOIN academy_field_activities AS a ON a.number = t.number
    WHERE t.number = ?
  `).bind(number).first();
  if (!record) return null;
  const field = record.outcome ? renderFieldActivity(record)
    : number === 47 ? `<section><h2>Field activity and Sandbox</h2><p><a href="${workbenchPath}47/">Open the printable cord lesson and triangle test</a></p></section>` : "";
  return workbenchPage(number + ". " + record.title, `
    <p><a href="${workbenchPath}?guide=${record.guide}">Field Guide ${record.guide}</a> ·
    ${escape(Array.from(record.media, (key) => mediumNames[key]).join(" · "))}</p>
    ${field}<section><h2>Development brief</h2><p>${escape(record.brief)}</p><p>${escape(record.namespace_name)}</p></section>`);
}

async function serveWorkbench(request, env) {
  const url = new URL(request.url);
  const head = request.method === "HEAD";
  const render = (body, contentType, status = 200) => new Response(head ? null : body, {
    status, headers: { ...workbenchHeaders, "content-type": contentType + "; charset=utf-8" },
  });
  const isLesson = ["/workbench/47", "/workbench/47/"].includes(url.pathname);
  const isCatalog = ["/workbench", "/workbench/"].includes(url.pathname);
  const isJson = url.pathname === "/workbench/techniques.json";
  const zoneMatch = new RegExp("^/workbench/zones/([1-9][0-9]{0,2})/?$").exec(url.pathname);
  if (zoneMatch) {
    try {
      const zone = await renderZone(Number(zoneMatch[1]), env);
      return zone ? render(zone, "text/html") : render("Technique zone not found.", "text/plain", 404);
    } catch (error) {
      console.error("Academy technique zone query failed", error);
      return render("Technique zone temporarily unavailable.", "text/plain", 503);
    }
  }
  if (!isLesson && !isCatalog && !isJson) return teaser.fetch(request);
  if (isLesson) return render(cordLesson(url.searchParams), "text/html");
  const rawGuide = url.searchParams.get("guide");
  if (rawGuide !== null && !/^[1-7]$/.test(rawGuide)) return render("Guide not found.", "text/plain", 404);
  const guide = rawGuide === null ? null : Number(rawGuide);
  try {
    const records = await workbenchCatalog(env, guide);
    return isJson ? render(JSON.stringify({ techniques: records }), "application/json")
      : render(renderGuides(records, guide, url.searchParams.get("print") === "1"), "text/html");
  } catch (error) {
    console.error("Academy technique query failed", error);
    return render("Workbench temporarily unavailable.", "text/plain", 503);
  }
}


const survivalPath = mount + "/survival/";
const survivalCategories = ["Water, Fire & Thermal Mastery","Navigation, Time & Sky Reading","Food Sourcing, Agriculture & Preservation","Shelter, Cordage & Structural Engineering","Tools, Metallurgy & Material Transformation","Health, First Aid & Body Resilience","Communication, Memory & Sovereign Mind"];

function survivalCardMarkup(row) {
  const sources = {
    1: ["CDC · Emergency drinking water", "https://www.cdc.gov/water-emergency/about/index.html"],
    2: ["CDC · Emergency drinking water", "https://www.cdc.gov/water-emergency/about/index.html"],
    88: ["Poison Control · Activated charcoal", "https://www.poison.org/articles/activated-charcoal"],
    101: ["National Park Service · Ten Essentials", "https://www.nps.gov/articles/10essentials.htm"],
  };
  const source = sources[row.number];
  return `<article class="mastery-card"><h2>${row.number}. ${escape(row.modern)} → ${escape(row.root)}</h2>
    <h3>Z · Modern convenience</h3><p>${escape(row.modern)}</p>
    <h3>Mechanics</h3><p>${escape(row.mechanic)}</p>
    <h3>A · Field test</h3><p>${escape(row.field_test)}</p>
    ${row.original_context ? `<details class="screen-only"><summary>Original blueprint wording</summary><p>${escape(row.original_context)}</p></details>` : ""}
    ${source ? `<p><a href="${source[1]}">${source[0]}</a></p>` : ""}
    <h3>Show and replicate</h3><p>Record your setup, what you observed, and what happened when you repeated the test.</p></article>`;
}

async function serveSurvival(request, env) {
  const url = new URL(request.url);
  const head = request.method === "HEAD";
  const respond = (body, type, status = 200) => new Response(head ? null : body, {
    status, headers: { ...workbenchHeaders, "content-type": type + "; charset=utf-8" },
  });
  const tail = url.pathname.slice("/survival".length).replace(/^[/]|[/]$/g, "");
  const isList = tail === "" || tail === "cards.json";
  const number = /^[1-9][0-9]{0,2}$/.test(tail) ? Number(tail) : null;
  const rawCategory = url.searchParams.get("category");
  if ((!isList && (number === null || number > 101)) || (rawCategory !== null && !/^[1-7]$/.test(rawCategory))) {
    return respond("Survival mastery card or category not found.", "text/plain", 404);
  }
  const category = rawCategory === null ? null : Number(rawCategory);
  try {
    const { results } = await env.LIBRARY.prepare(`
      SELECT number, category, modern, root, original_context, mechanic, field_test, namespace_name
      FROM survival_mastery_cards WHERE (?1 IS NULL OR number=?1)
        AND (?2 IS NULL OR category=?2) ORDER BY number
    `).bind(number, category).all();
    if (number && !results.length) return respond("Survival mastery card not found.", "text/plain", 404);
    if (tail === "cards.json") return respond(JSON.stringify({ cards: results }), "application/json");
    const crumbs = `<p class="screen-only"><a href="${survivalPath}">All Survival-to-Modernity Mastery Drills</a></p>`;
    if (number) {
      return respond(workbenchPage("Survival-to-Modernity Mastery Card", crumbs + survivalCardMarkup(results[0])), "text/html");
    }
    const print = url.searchParams.get("print") === "1";
    const links = survivalCategories.map((name, i) =>
      `<li><a href="${survivalPath}?category=${i + 1}">${escape(name)}</a></li>`).join("");
    const intro = print ? "" : `<p>Tabor Academy’s 101 Survival-to-Modernity Mastery Drills take everyday modern buttons, switches, and conveniences and peel them backward (Z → A) to the raw physical, natural, and mechanical skills humans had to master before the grid existed.</p><p>Each item starts with the Modern Convenience (Z) people take for granted today, strips away the hidden automation, and gives the learner the Root Survival Mechanic (A) to test, build, and replicate with their own hands.</p>
      <ul class="guide-links">${links}</ul><p><a href="${survivalPath}?print=1${category ? "&amp;category=" + category : ""}">Open printable ${category ? "category" : "card deck"}</a></p>`;
    const body = print ? results.map(survivalCardMarkup).join("") : survivalCategories.map((name, i) => {
      const group = results.filter((row) => row.category === i + 1);
      return group.length ? `<section><h2>${escape(name)}</h2><ol class="catalog" start="${group[0].number}">
        ${group.map((row) => `<li><a href="${survivalPath}${row.number}/">${escape(row.modern)} → ${escape(row.root)}</a></li>`).join("")}
      </ol></section>` : "";
    }).join("");
    return respond(workbenchPage("101 Survival-to-Modernity Mastery Drills", intro + body), "text/html");
  } catch (error) {
    console.error("Academy mastery query failed", error);
    return respond("Survival-to-Modernity track temporarily unavailable.", "text/plain", 503);
  }
}


const wayPath = mount + "/way/";

function wayMission(mission) {
  const activities = [["12 · Build", mission.build], ["3 · Flip and clear", mission.flip],
    ["6 · Integrate", mission.integrate], ["9 · Verify", mission.verify]];
  return `<article class="mastery-card">
    <h2>Z · Finished outcome</h2><p>${escape(mission.outcome)}</p>
    ${activities.map(([label, text]) => `<h2>${label}</h2><p>${escape(text)}</p>`).join("")}
    <h2>A · Show what made it work</h2>
    <dl><dt>QI · What did you figure out?</dt><dd>Record your evidence and the step that changed the result.</dd>
      <dt>QE · Can someone else use what you learned?</dt><dd>Teach the step. Ask what was confusing and show what you changed.</dd></dl>
    ${mission.link ? `<p><a href="${mount}/${escape(mission.link)}">Open the companion activity</a></p>` : ""}
    <section class="proof-sheet"><h2>Proof sheet</h2><p>What I made or found:</p><div></div>
      <p>How I checked it:</p><div></div><p>What a second person could repeat:</p><div></div></section>
  </article>`;
}

async function serveWay(request, env) {
  const url = new URL(request.url);
  const respond = (body, type, status = 200) => new Response(request.method === "HEAD" ? null : body, {
    status, headers: { ...workbenchHeaders, "content-type": type + "; charset=utf-8" },
  });
  const tail = url.pathname.slice("/way".length).replace(/^[/]|[/]$/g, "");
  const parts = tail ? tail.split("/") : [];
  const catalog = tail === "catalog.json";
  if (!catalog && (parts.length > 2 || parts.some((part) => !/^[a-z][a-z0-9-]*$/.test(part)))) {
    return respond("Learning path not found.", "text/plain", 404);
  }
  const [path = null, slug = null] = catalog ? [] : parts;
  const notFound = () => respond("Learning path or mission not found.", "text/plain", 404);
  try {
    const [p, m] = await env.LIBRARY.batch([
      env.LIBRARY.prepare("SELECT slug,title,purpose,coverage FROM academy_way_paths WHERE (?1 IS NULL OR slug=?1) ORDER BY position").bind(path),
      env.LIBRARY.prepare(`SELECT slug,path,title,outcome,build,flip,integrate,verify,link FROM academy_way_missions
        WHERE (?1 IS NULL OR path=?1) AND (?2 IS NULL OR slug=?2) ORDER BY position`).bind(path, slug),
    ]);
    if (catalog) return respond(JSON.stringify({ paths: p.results, missions: m.results }), "application/json");
    if (path && !p.results.length) return notFound();
    if (slug) {
      const mission = m.results[0];
      if (!mission) return notFound();
      return respond(workbenchPage(mission.title, `<p class="screen-only"><a href="${wayPath}${escape(path)}/">${escape(p.results[0].title)}</a></p>${wayMission(mission)}`), "text/html");
    }
    if (path) {
      const track = p.results[0];
      const missionLinks = m.results.map((row) => `<li><a href="${wayPath}${escape(path)}/${escape(row.slug)}/">${escape(row.title)}</a>
        <p>${escape(row.outcome)}</p></li>`).join("");
      return respond(workbenchPage(track.title, `<p class="screen-only"><a href="${wayPath}">The Nathan Tabor Way</a></p>
        <p>${escape(track.purpose)}</p><h2>Start a mission</h2><ul>${missionLinks}</ul>
        <section><h2>Topics to build toward</h2><p>${escape(track.coverage)}</p></section>`), "text/html");
    }
    const grid = p.results.map((row) => `<li><a href="${wayPath}${escape(row.slug)}/">${escape(row.title)}</a><p>${escape(row.purpose)}</p></li>`).join("");
    return respond(workbenchPage("The Nathan Tabor Way", `
      <p>Choose something you want to make, understand, or prove. Start with the finished outcome (Z), work back to what makes it possible (A), then show that the result holds.</p>
      <p class="way-clock">12 · Build <span>→</span> 3 · Flip and clear <span>→</span> 6 · Integrate <span>→</span> 9 · Verify</p>
      <p><a href="${mount}/order/">The Law of Order · Good Samaritan and the village syllabus</a> · <a href="${mount}/order/time-of-peace/">The Time of Peace</a></p><h2>Choose a path</h2><ul class="way-grid">${grid}</ul>
      <p><a href="${wayPath}readiness/bridge-check/">Find the prerequisite you need next</a> · <a href="${mount}/survival/">Survival-to-Modernity Mastery Drills</a></p>`), "text/html");
  } catch (error) {
    console.error("Academy curriculum query failed", error);
    return respond("Curriculum temporarily unavailable.", "text/plain", 503);
  }
}


const orderPath = mount + "/order/";
const regionalOrder = [
  {
    "title": "Jamaica",
    "home": "Start at the yard and the provision ground. Ask who taught food growing, soil and runoff, storytelling, and how to carry memory across generations. Conditions differed among enslaved people, free households, and Maroon communities.",
    "trade": "Follow the crop outward to mills, estates, ledgers, and shipping. Compare the knowledge necessary to feed a household with the knowledge rewarded by the sugar economy.",
    "institution": "In 1826 British colonial rule and enslavement still structured who controlled work, land, and access to instruction. Mission congregations, primers and hymnals are leads to examine by parish, rather than evidence of one system for every family.",
    "earlier": "Read Robert Wedderburn’s 1817 writing alongside the British Library’s discussion of provision grounds. The colonial regime and household knowledge already coexist in that record.",
    "sources": [
      [
        "British Library · Food and Freedom in 19th-Century Jamaica",
        "https://www.bl.uk/stories/blogs/posts/food-and-freedom-in-19th-century-jamaica"
      ]
    ]
  },
  {
    "title": "Geneva",
    "home": "Start with a household measure, a family ledger, or a task demonstrated at the workbench. Ask who taught the learner to repeat it and who checked the result.",
    "trade": "Follow the bench into the Fabrique: filing, fitting, engraving, and the division of work among watchmaking trades. Use a workshop record to determine who actually entered a particular apprenticeship.",
    "institution": "Compare family and workshop instruction with the Academy, church, and civic government. University archives describe study in theology, law, the sciences, mathematics, and related disciplines as the institution developed.",
    "earlier": "Calvin’s Academy was founded in 1559 to train for church and civil government. That date gives a documented institutional track well before 1826.",
    "sources": [
      [
        "University of Geneva Archives · De l’Académie à l’Université",
        "https://www.unige.ch/archives/aap/historique/batiments/de-lacademie-luniversite"
      ],
      [
        "Fondation Haute Horlogerie · Geneva and the Fabrique",
        "https://www.hautehorlogerie.org/en/watches-and-culture/library/when-geneva-became-a-vast-fabrique"
      ]
    ]
  },
  {
    "title": "Tequila, Jalisco",
    "home": "Start with the rancho, the kitchen, and the field. Compare what grandparents, parents, aunts, uncles, and godparents might teach about food, growing plants, and keeping promises; look for a particular household or parish record before assigning authority.",
    "trade": "Follow agave from field to workshop to market. Treat harvesting, cooking, fermentation, transport, weights, and ledgers as distinct kinds of knowledge. A ledger can show who moved a shipment without telling you who taught them.",
    "institution": "Compare parish instruction and estate records with the political change after Mexican independence. Practice and family authority varied; modern production standards and brand histories require their own dates.",
    "earlier": "UNESCO documents earlier uses of agave and the development of the agave landscape and distilling facilities from the sixteenth century onward.",
    "sources": [
      [
        "UNESCO · Agave Landscape and Ancient Industrial Facilities of Tequila",
        "https://whc.unesco.org/en/list/1209/"
      ]
    ]
  },
  {
    "title": "Chihuahua",
    "home": "Start with the household, rancho, or Rarámuri community. Ask who passed on dry-land farming, stock care, fiber work, route knowledge, or oral memory. These are distinct communities with different records and circumstances.",
    "trade": "Follow ranching and mining into trade and professional records. Compare what a household needs to keep an animal healthy with what a mining record can show about extracting and accounting for silver.",
    "institution": "Read early state constitutional records alongside colonial mining and presidio records. The boundary drawn by a government document and the boundaries of a community’s authority may tell different stories.",
    "earlier": "Colonial mining records predate the state. Use them beside Rarámuri accounts and ethnography, paying attention to when each source was made and whose knowledge it represents.",
    "sources": [
      [
        "UNAM · Primeras Constituciones Estatales, 1824–1827",
        "https://museodelasconstituciones.unam.mx/wp-content/uploads/2026/01/Primeras-Constituciones-estatales-1824-1827.pdf"
      ],
      [
        "INAH · Temas de arqueología histórica",
        "https://www.gobiernodigital.inah.gob.mx/Transparencia/Archivos/1645728313.PDF"
      ],
      [
        "INPI · Rarámuri ethnography",
        "https://atlas.inpi.gob.mx/tarahumaras-etnografia/"
      ]
    ]
  }
];

function serveOrder(request) {
  const url = new URL(request.url);
  const reverse = url.searchParams.get("view") === "state";
  const choice = url.searchParams.get("first");
  const feedback = choice === "saw"
    ? "Yes. The Samaritan first saw the man and had compassion. The steps that followed answered what he saw."
    : choice === "inn" ? "The inn comes later. Find what the Samaritan saw and did before he brought the man there."
    : choice === "paid" ? "The payment comes the next day. Read backward from verse 35 to discover which actions made it possible." : "";
  const levels = [["Home and community","home"],["Trade and apprenticeship","trade"],["Church, government, and state","institution"]];
  if (reverse) levels.reverse();
  const regionMarkup = regionalOrder.map((region) => `<section><h2>${escape(region.title)}</h2>
    ${levels.map(([label, key]) => `<h3>${label}</h3><p>${escape(region[key])}</p>`).join("")}
    <h3>Before 1826</h3><p>${escape(region.earlier)}</p>
    <ul>${region.sources.map(([label, href]) => `<li><a href="${escape(href)}">${escape(label)}</a></li>`).join("")}</ul>
  </section>`).join("");
  const body = `<blockquote><p>${escape("you can do everything and do it anyway you want to, but if you don’t do it in the right order, it doesn’t count and it doesn’t matter cause it won’t work")}</p><footer>Nathan Tabor</footer></blockquote>
    <section><h2>The Good Samaritan · Luke 10:25–37 (KJV)</h2>
      <p><strong>Z · The man receives care, and the Samaritan takes responsibility for what comes next.</strong></p>
      <ol><li>He saw the man and had compassion.</li><li>He went to him and tended his wounds.</li>
        <li>He put him on his own animal and brought him to an inn.</li><li>He cared for him there.</li>
        <li>The next day he paid the host and promised to cover any additional cost when he returned.</li></ol>
      <form method="get" action="${orderPath}#check" class="screen-only"><input type="hidden" name="view" value="${reverse ? "state" : "home"}">
        <label>Which happened first?<select name="first" required><option value="">Choose a step</option><option value="paid">Paid the host</option>
          <option value="inn">Reached the inn</option><option value="saw">Saw the man and had compassion</option></select></label>
        <button type="submit">Check the order</button></form><p id="check" role="status">${feedback}</p>
      <p><strong>A · Prove the order.</strong> Put the five actions on separate slips. Move the inn or the payment to the beginning and explain what the story now leaves out. Restore the sequence, then read backward from the Samaritan’s promise to return to the first act of seeing.</p>
      <p><a href="https://www.biblegateway.com/passage/?search=Luke%2010%3A25-37&amp;version=KJV">Read Luke 10:25–37 in the KJV</a></p>
    </section>
    <section><h2>Who taught, and who set the syllabus?</h2>
      <p>Start with parents, grandparents, aunts, uncles, godparents, and neighbors. Then ask what a workshop, congregation, or state required. Use Nathan’s Madison County recollection as a question about community accountability: who taught, who intervened, and how did the parents hear about it?</p>
      <p class="screen-only"><a href="${orderPath}"${reverse ? "" : ' aria-current="page"'}>Home → community → institutions</a> ·
        <a href="${orderPath}?view=state"${reverse ? ' aria-current="page"' : ""}>Institutions → community → home</a></p>
      <p><a href="${mount}/order/porch/">Miss Wilson’s Porch · Hospitality, accountability, and surveillance</a></p><p><a href="${mount}/order/1626/">Go back another 200 years · 1626</a></p><p><a href="${mount}/order/time-of-peace/">The Time of Peace · The Age of Innocence and the rotation</a></p><p>The records vary by place. A school register or law can establish a formal rule. A letter, oral history, or household record can show how people actually lived it. Look for both before assigning authority to every adult in a community.</p><p><strong>Go back another century.</strong> Try Nathan’s question in each place. Do the earlier sources show one community model, or do they already show household, trade, religious, and state instruction side by side?</p>
    </section>${regionMarkup}
    <section><h2>Timeline audit · Who set the date?</h2>
      <p>In the first places that adopted Pope Gregory XIII’s 1582 calendar reform, October 4 was followed by October 15. Other places adopted the calendar later. Record the place, the calendar used in the original, and who recorded the event before converting its date.</p>
      <p><strong>Field exercise.</strong> Choose a parish record and a civil or trade record for the same period. Keep the original dates. Put both in sequence under each calendar where applicable, then identify what the sources can prove and which gaps remain open.</p>
      <p><a href="https://ccdl.claremont.edu/digital/api/collection/cce/id/405/download">Claremont Colleges Digital Library · Gregorian Calendar</a></p>
    </section>`;
  return new Response(request.method === "HEAD" ? null : workbenchPage("The Law of Order", body), {
    headers: { ...workbenchHeaders, "content-type": "text/html; charset=utf-8" },
  });
}


const porchPath = mount + "/order/porch/";
const porchVignettes = [["Chihuahua (1826)","A young rider crossing twenty miles of open desert could pull up to any rancho gate, call out \"¡Ave María Purísima!\", and be welcomed inside for fresh tortillas, beans, and water from the olla—because the family inside knew his grandfather and knew he was raised right.","Which ranch account, travel diary, or oral history could document a particular encounter? Who could travel that far, and under what conditions?"],["Tequila (1826)","Walking the dusty lanes between agave fields, any child who greeted Doña Elena with proper manners could stop at her patio for a gourd of cool agua fresca and fresh fruit off the tree, under the same watchful eyes that kept him out of trouble.","Look for a household account or parish record. What could a godparent’s role establish? What would it leave uncertain about daily practice?"],["Geneva (1826)","A young apprentice running errands across the quartiers could step into a family baker's or neighbor's kitchen for bread and cheese, known by face and family name across every cobblestone street.","Look for an apprenticeship contract or letter. Did it describe who could offer help, who could discipline, or what the apprentice could refuse?"],["Jamaica (1826)","Moving through the hills and village yards, any child who showed proper respect to the elders was fed from the communal pot of yams, saltfish, and coconut water at whatever yard they stopped in.","Read testimony about provision grounds and ask who was free to move. Enslavement in 1826 restricted movement and legal autonomy. A practice of mutual aid within a community could coexist with those restrictions."]];
const porchOpening = ["That contrast draws the exact dividing line between high-trust organic community and state-enforced surveillance.","Behind the Berlin Wall in East Germany, neighbors watched neighbors out of fear for the Stasi—an artificial, top-down system built to trap people and control their minds. In the world of 1826 Chihuahua, Tequila, Geneva, Jamaica, and rural Madison County, that shared village authority came from freedom, kinship, and mutual trust.","When everyone knows your family and has the standing to correct you, you aren't locked behind a wall—you own the whole map. You can get on your horse (or your bike, or walk the creek bed), ride five miles down the road with total independence, and knock on Miss Wilson’s screen door knowing two absolute truths:"];
const porchRules = ["If you act out or disrespect her, she will tan your hide and call your mama before you even untie your horse.","If you are respectful, hungry, and thirsty, she will hand you a cold cup of water and cut you a warm slice of apple pie without asking for a dime or a permission slip."];
const porchClose = ["High Trust = Wide Boundaries: Because Miss Wilson knew your parents taught you right—and knew she had the backing to enforce it—you didn't need fences, walls, or locked doors.","Self-Reliance + Village Safety Net: You had the liberty to roam on your own at eight or ten years old, backed by a whole county of porches where you were safe, known, and fed."];

function servePorch(request) {
  const choice = new URL(request.url).searchParams.get("case");
  const cases = {
    water: "Help meets a need: the neighbor offers water openly. The visitor can accept or decline. No report is created.",
    repair: "Open accountability: the neighbor explains what happened to the learner and the family, hears their account, and offers a specific way to repair the harm.",
    report: "Institutional surveillance: the agency secretly collects lawful private activity, keeps records, and can impose consequences. The person may have no meaningful way to refuse or correct the report.",
  };
  const feedback = Object.hasOwn(cases, choice) ? cases[choice] : "";
  const list = (items) => items.map((line) => `<li>${escape(line)}</li>`).join("");
  const places = porchVignettes.map(([place, scene, question]) => `<article class="mastery-card"><h3>${escape(place)}</h3>
    <blockquote><p>${escape(scene)}</p></blockquote><p><strong>Source question.</strong> ${escape(question)}</p></article>`).join("");
  const body = `<p class="screen-only"><a href="${orderPath}">The Law of Order</a> · <a href="${mount}/order/time-of-peace/">The Time of Peace</a> · <a href="${mount}/way/">The Nathan Tabor Way</a></p>
    <h2>Z · What a learner should be able to show</h2>
    <p>Given a situation, identify who offers help, who receives a report, what power comes with it, and whether the person can leave, disagree, or correct the record.</p>
    <section><h2>The Madison County porch story</h2><p>Academy source text</p>
      <blockquote>${porchOpening.map((line) => `<p>${escape(line)}</p>`).join("")}<ol>${list(porchRules)}</ol></blockquote>
      <p>The memory describes a practice of its time. In Academy exercises, correction means explaining the expectation, hearing the learner’s account, agreeing on a repair when harm was done, and contacting a caregiver when needed.</p>
    </section>
    <section><h2>How That “Open-Range Freedom” Worked in 1826</h2>
      <p>The supplied scenes illustrate how hospitality might work. Their individual encounters and universal claims need evidence of their own.</p>
      <blockquote><p>In all four places 200 years ago, that exact same hospitality-and-accountability loop was the real social safety net:</p></blockquote>
      ${places}<p><a href="${orderPath}">Open the four regional source lists</a> · <a href="${mount}/order/1626/">Compare the 1626 village syllabus</a> ·
        <a href="https://www.bl.uk/stories/blogs/posts/food-and-freedom-in-19th-century-jamaica">British Library · Food and Freedom in 19th-Century Jamaica</a></p>
    </section>
    <section><h2>The Two Sides of the Same Coin</h2><blockquote>
      <p>That system only works when freedom and responsibility are welded together:</p><ul>${list(porchClose)}</ul>
    </blockquote></section>
    <section><h2>East Germany · Who held the report?</h2>
      <p>The German Federal Archives document the Stasi’s network of unofficial collaborators in the GDR. Reasons for collaborating varied. The border regime restricted movement, and the security service could collect reports about a person’s private activities without their knowledge.</p>
      <ul><li><a href="https://www.bundesarchiv.de/en/stasi-records-archive/education/what-was-the-state-security/the-unofficial-collaborators-of-the-mfs/">German Federal Archives · Unofficial collaborators</a></li>
      <li><a href="https://www.archives.gov/files/research/foreign-policy/cold-war/berlin-wall-1962-1987/dvd/pdfs/essays/PP-12.pdf">U.S. National Archives · Contemporary report on the Berlin Wall</a></li></ul>
    </section>
    <section><h2>A · Put the Law of Order to work</h2>
      <ol><li><strong>Notice the need.</strong> A visitor arrives thirsty.</li><li><strong>Help.</strong> Offer water and a place to sit.</li>
      <li><strong>Hear what happened.</strong> If something broke, listen to the people involved.</li>
      <li><strong>Make a repair.</strong> Agree on a way to put it right. Tell a caregiver when the situation calls for it.</li></ol>
      <p>Run the scene twice, once with help first and once with questions first. Ask the visitor what each version made it easier or harder to say.</p>
      <form method="get" action="${porchPath}#porch-check" class="screen-only"><label>Compare a case<select name="case" required>
        <option value="">Choose a case</option><option value="water">A neighbor offers water</option>
        <option value="repair">A broken gate is discussed with the family</option><option value="report">An agency secretly records a lawful visit</option>
      </select></label><button type="submit">Check the case</button></form><p id="porch-check" role="status">${escape(feedback)}</p>
      <p><strong>Proof.</strong> Draw two arrows: one from the person who acts to the person affected, and one from any report to its recipient. On each arrow, mark whether the person knows about it and can challenge it. Explain what would have to change for help to become coercion.</p>
    </section>`;
  return new Response(request.method === "HEAD" ? null : workbenchPage("Miss Wilson’s Porch", body), {
    headers: { ...workbenchHeaders, "content-type": "text/html; charset=utf-8" },
  });
}


const year1626Path = mount + "/order/1626/";
const year1626Regions = [
  {
    "title": "Ethiopia · Highlands and royal court",
    "community": "Begin with cultivation, livestock, seasonal runoff, hospitality, and the way families remember lineage. Ask how a household taught one field task and what type of record could show who did the teaching. Teff terracing, enjera, and roasted barley are research leads for particular communities.",
    "institution": "The Ethiopian Orthodox Tewahedo Church had its own teaching traditions, including Ge’ez reading, chant (zema), and sacred poetry (qene). At the royal court, Susenyos’s Catholic turn and the Jesuit mission challenged Orthodox authority. Study the court, church schools, and households as distinct places of learning.",
    "date": "In 1626 Susenyos pledged adherence to Rome. Fasilides succeeded him in 1632 and restored Orthodox rule. UNESCO dates Gondar’s establishment as a permanent capital to 1636. The later castles belong on the later side of that timeline.",
    "test": "Draw a hillside with one sloped field and one terraced field. Use a tabletop tray to compare where a spoonful of water runs. Then read a court source and a church education study. Which source can tell you about each form of teaching, and which question remains open?",
    "refs": [
      [
        "Matteo Salvadore · Jesuit Ethiopia and Susenyos",
        "https://brill.com/view/journals/jemh/25/3/article-p194_2.pdf"
      ],
      [
        "Educational practices of qene bet schools",
        "https://www.tandfonline.com/doi/full/10.1080/2331186X.2022.2158673"
      ],
      [
        "UNESCO · Gondar palaces and castles",
        "https://whc.unesco.org/en/activities/156/"
      ]
    ]
  },
  {
    "title": "Mainland China · Late Ming",
    "community": "Start at a household, market, or shared waterway. Rice irrigation, silk production, tea processing, abacus reckoning, and storytelling offer different lines of inquiry. Ask what a lineage record can show about elders and what a local gazetteer or farming text can show about work in one district.",
    "institution": "Follow the examination route through the Four Books and Five Classics, their commentaries, and the eight-legged essay format. Academies also hosted intellectual and moral inquiry. Donglin debates and persecution under Wei Zhongxian give the court and academy comparison a specific setting.",
    "date": "1626 falls in the Tianqi reign, late in the Ming dynasty. A description of one county, clan, or academy has a geographic limit; note it before extending a claim about authority to other places.",
    "test": "Explain the same irrigation problem two ways: as a short, structured written answer and as a tabletop demonstration with a tray. Ask a partner what each version lets them verify. Record where the methods help each other.",
    "refs": [
      [
        "Oxford University Research Archive · Books, Reading, and Knowledge in Ming China",
        "https://ora.ox.ac.uk/objects/uuid%3A5800e2b8-024b-415f-ae6a-3793efd3b955/files/m8b0e0359385cb26da26e5ce93fd9e152"
      ],
      [
        "Berkshire Dictionary of Chinese Biography · Ming dynasty material",
        "https://www.berkshirepublishing.com/assets_news/china/BERKSHIRE_MingDynastySample.pdf"
      ]
    ]
  },
  {
    "title": "Southern Ocean, Tierra del Fuego, and Antarctica",
    "community": "Start along the inhabited rim. The Yagán (Yaghan) knew coastal travel, canoes, marine food, and local weather in the channels around Tierra del Fuego. The Selk’nam had distinct, primarily land-based hunting and gathering practices on Isla Grande. Use a source specific to each people when asking how knowledge passed between generations.",
    "institution": "Compare local routes and place knowledge with European shipboard dead reckoning, instruments, charts, and expedition goals. Mark Terra Australis Incognita as a conjecture on any map that proposes it; record an observed coastline separately.",
    "date": "The geographic South Pole had no human settlement in 1626. Antarctic mainland sightings are generally dated to 1820, with priority disputed. Roald Amundsen’s party reached the geographic South Pole in 1911. Tierra del Fuego is north of Antarctica.",
    "test": "Lay a modern map beside a historic southern chart. Mark the known coast, the conjectured land, the Indigenous homelands, and the geographic pole in different colors. Ask a partner to explain how the two maps support different claims.",
    "refs": [
      [
        "Museo Chileno de Arte Precolombino · Yagán",
        "https://museo.precolombino.cl/aprende/pueblos-culturas/pueblos-originarios/yag-n/"
      ],
      [
        "Museo Chileno de Arte Precolombino · Selk’nam",
        "https://museo.precolombino.cl/aprende/pueblos-culturas/pueblos-originarios/selk-nam/"
      ],
      [
        "British Antarctic Survey · Antarctic mainland sightings",
        "https://legacy.bas.ac.uk/about_antarctica/geopolitical/bat.php"
      ],
      [
        "British Antarctic Survey · Reaching the South Pole",
        "https://www.bas.ac.uk/news/south-pole-conquered-100-years-ago-today/"
      ]
    ]
  },
  {
    "title": "Tidewater Virginia · Powhatan communities and Jamestown",
    "community": "Begin in Powhatan towns and along the rivers. Housing, planting, fishing, canoe use, and local travel depended on practical knowledge. Ask who taught a particular skill. A yi-hakan or yehakin is a house; a description of the building cannot establish the authority of every relative or elder.",
    "institution": "Set English parish instruction, royal administration, tobacco, and land records beside Powhatan accounts and colonial descriptions. The KJV (1611), Book of Common Prayer, hornbooks, and commercial bookkeeping are research leads. A dated school or household record would establish whether a particular learner used them.",
    "date": "The Virginia Company’s charter was revoked in 1624 under James I. Virginia was already a royal colony by 1626 under Charles I. Jamestown’s earliest martial rules date to 1610–11; date any rule before applying it to 1626.",
    "test": "Pick one activity such as growing corn or roofing a house. Compare a museum account, a dated colonial record, and any available account from a descendant community. For each, record the author, purpose, observation, and what remains uncertain.",
    "refs": [
      [
        "National Park Service · A Short History of Jamestown",
        "https://home.nps.gov/jame/learn/historyculture/a-short-history-of-jamestown.htm"
      ],
      [
        "Encyclopedia Virginia · Houses in Early Virginia Indian Society",
        "https://encyclopediavirginia.org/entries/houses-in-early-virginia-indian-society/"
      ],
      [
        "Encyclopedia Virginia · Lawes Divine, Morall and Martiall",
        "https://encyclopediavirginia.org/entries/lawes-divine-morall-and-martiall/"
      ]
    ]
  }
];

function serveYear1626(request) {
  const stateFirst = new URL(request.url).searchParams.get("view") === "state";
  const layers = stateFirst ? [["Church, court, and state","institution"],["Home and community","community"]]
    : [["Home and community","community"],["Church, court, and state","institution"]];
  const sections = year1626Regions.map((region) => `<section><h2>${escape(region.title)}</h2>
    ${layers.map(([label,key]) => `<h3>${label}</h3><p>${escape(region[key])}</p>`).join("")}
    <h3>Check the dates</h3><p>${escape(region.date)}</p>
    <h3>A · Field test</h3><p>${escape(region.test)}</p>
    <ul>${region.refs.map(([label,url]) => `<li><a href="${escape(url)}">${escape(label)}</a></li>`).join("")}</ul></section>`).join("");
  const body = `<nav><a href="${orderPath}">1826 · The village syllabus</a> ·
    <a href="${porchPath}">Miss Wilson’s Porch</a> · <a href="${mount}/order/time-of-peace/">The Time of Peace</a></nav>
    <p>Z · Show how people learned a real skill and prove what the source can tell you about it.</p>
    <p class="screen-only"><a href="${year1626Path}"${stateFirst ? "" : ' aria-current="page"'}>Home → community → institutions</a> ·
      <a href="${year1626Path}?view=state"${stateFirst ? ' aria-current="page"' : ""}>Institutions → community → home</a></p>
    ${sections}
    <section class="proof-sheet"><h2>Verify the order</h2><p>Pick one 1626 region and one from 1826. Find a household or community source and an institutional source for each. Give the place, date, author, and what each source could observe. Mark the difference between a practice you can document and a question that still needs evidence.</p>
    <p>Practice and source:</p><div></div><p>What the record supports:</p><div></div><p>What I would check next:</p><div></div></section>`;
  return new Response(request.method === "HEAD" ? null : workbenchPage("1626 · Who taught, and who set the syllabus?", body), {
    headers: { ...workbenchHeaders, "content-type": "text/html; charset=utf-8" },
  });
}


const peacePath = mount + "/order/time-of-peace/";
const peaceContent = {
  "groups": [
    [
      "Pre-State Egalitarian Band Societies",
      "Learning through observation, shared work, play, and relationships. Compare communities in the periods actually documented.",
      [
        [
          "Ju/’hoansi and other San communities",
          "Start with sharing, tracking, learning by watching, and the ways adults and peers help children practice. Record which community and period the account describes.",
          0
        ],
        [
          "Mbuti and BaYaka",
          "Compare forest knowledge, music, and cooperative work. Keep the Ituri Mbuti and the many BaYaka communities distinct when comparing evidence.",
          0
        ],
        [
          "Hadza",
          "Use the study of children’s learning to examine participation, play, and teaching. Ask which skills children practise with adults and which circulate among peers.",
          1
        ],
        [
          "Aboriginal Australian nations",
          "Start with Country and community-led accounts of Songlines. Ask who holds the right to teach a particular story, song, or route.",
          2
        ],
        [
          "Inuit",
          "Follow land and water knowledge, elder mentorship, and family teaching across Inuit regions. Begin with Inuit-authored or Inuit-led sources.",
          3
        ]
      ]
    ],
    [
      "Stateless Agricultural & Village Democracies",
      "Look for the rule in practice: who proposes it, who can challenge it, and who is included in the decision.",
      [
        [
          "Igbo communities",
          "Compare village assemblies, age grades, and elders with Igbo communities that have kingship traditions, including Onitsha. Identify the place before making a claim about its authority.",
          4
        ],
        [
          "Tiv and Nuer",
          "Compare how lineage ties organized responsibilities and alliances. Check where historical accounts show authority operating beyond one household.",
          5
        ],
        [
          "Haudenosaunee and Wendat",
          "Read the Haudenosaunee Confederacy’s own account of its Great Law and government, then study Wendat clan and council organization through their separate records.",
          6,
          7
        ],
        [
          "Hopi and Ancestral Puebloans",
          "Put living Hopi accounts first when discussing Hopi life. Use archaeology to investigate farming and settlement and ask what buildings alone can establish about authority.",
          8
        ],
        [
          "Ifugao",
          "Trace who maintains terrace walls and manages water. Compare the heritage account with archaeological research on when particular terraces took their current form.",
          9,
          10
        ]
      ]
    ],
    [
      "Frontier & Mountain Refuges",
      "Follow the people who moved, the conditions they faced, and how they kept their communities working.",
      [
        [
          "Zomia",
          "Use James C. Scott’s interpretation to ask when upland settlement served as a way to evade lowland state control. Compare that explanation with the history of a specific Hmong, Karen, Akha, Lahu, or Wa community.",
          11
        ],
        [
          "Maroon communities of the Americas",
          "Start with flight from enslavement and the work of building and defending communities. Compare Jamaica, Suriname, Palmares in Brazil, and the Great Dismal Swamp on their own timelines, including treaties and conflict where recorded.",
          12,
          13
        ],
        [
          "Rarámuri",
          "Follow community governance, farming, migration, and mutual sharing in the Sierra Tarahumara. Return to the Chihuahua lesson to see what a state or mining record leaves out.",
          14
        ]
      ]
    ],
    [
      "European Free Territories & Rural Backcountry Pockets",
      "Compare local decision-making alongside the claims, laws, and markets that operated around it.",
      [
        [
          "Frisian Freedom",
          "Compare local authority and the tradition of Frisian freedom with legal claims made in and around the Holy Roman Empire.",
          15
        ],
        [
          "Icelandic Commonwealth",
          "Start with the Alþingi, founded in 930. Trace who could bring a dispute, who decided it, and what made a judgment enforceable. Place submission to the Norwegian crown in the 1260s.",
          16
        ],
        [
          "Cospaia",
          "Use the Italian archival entry to follow the boundary arrangement and Cospaia’s separate status before 1826. Read claims about taxes, officeholders, or policing against the records that document each practice.",
          17
        ],
        [
          "Cossack Hosts",
          "Follow the Zaporozhian Sich’s councils and offices. Ask who could participate and how election, military organization, and relations with surrounding states fit together.",
          18
        ],
        [
          "American Backcountry and Appalachia",
          "Use family accounts and regional records to follow food sharing, trade teaching, and neighbors’ responsibilities. Connect the inquiry to Madison County and Miss Wilson’s Porch, then ask who was able to rely on an open door.",
          19
        ]
      ]
    ]
  ],
  "refs": [
    [
      "Hunter-gatherer learning and social norms",
      "https://journals.sagepub.com/doi/10.1177/1069397117723552"
    ],
    [
      "Comparative study of Hadza and BaYaka learning",
      "https://fileserver-az.core.ac.uk/download/210584312.pdf"
    ],
    [
      "National Museum of Australia · Songlines",
      "https://www.nma.gov.au/about/publications/songlines"
    ],
    [
      "Inuit Tapiriit Kanatami · Inuit Education Summit",
      "https://itk.ca/wp-content/uploads/2016/07/2008FinalEducationSummitReport.pdf"
    ],
    [
      "Oxford Bibliographies · Igbo political histories",
      "https://academic.oup.com/reference/62328/reference-article/553799190"
    ],
    [
      "Tiv and Nuer lineage organization · University of Chicago research",
      "https://bfi.uchicago.edu/wp-content/uploads/2025/12/BFI_WP_2025-149.pdf"
    ],
    [
      "Haudenosaunee Confederacy · Government",
      "https://www.haudenosauneeconfederacy.com/government/"
    ],
    [
      "Yale eHRAF · Huron/Wendat",
      "https://ehrafworldcultures.yale.edu/cultures/ng05/summary"
    ],
    [
      "National Park Service · Ancestral Puebloan research",
      "https://home.nps.gov/subjects/swscience/ancestral-puebloan.htm"
    ],
    [
      "UNESCO · Rice Terraces of the Philippine Cordilleras",
      "https://whc.unesco.org/en/list/722/"
    ],
    [
      "Ifugao terrace archaeology · Journal of Anthropological Archaeology",
      "https://par.nsf.gov/servlets/purl/10080581"
    ],
    [
      "Yale · James C. Scott on hills, valleys, and states",
      "https://seasia.yale.edu/hills-valleys-and-states-art-not-being-governed-anarchist-history-upland-southeast-asia-james-scott"
    ],
    [
      "UNESCO · Maroon heritage of Moore Town",
      "https://ich.unesco.org/en/lists?RL=00053"
    ],
    [
      "National Park Service · African American Experience Before Emancipation",
      "https://irma.nps.gov/DataStore/FileSource/Get/2293486?filename=AfAm+NCA+HSR_Final_June2022_ED_508.pdf"
    ],
    [
      "Mexico’s INPI · Rarámuri ethnography",
      "https://www.gob.mx/inpi/articulos/etnografia-del-pueblo-tarahumara-raramuri"
    ],
    [
      "Fryske Akademy · Frisian Freedom and imperial claims",
      "https://www.fryske-akademy.nl/en/news-and-events/news/news-article/proefskrift-het-heilige-roomse-rijk-en-de-friese-vrijheid-fan-histoarikus-oebele-vries-nei-40-jier-op-e-nij-utbrocht/"
    ],
    [
      "Alþingi · Parliamentary history",
      "https://www.althingi.is/media/sogulegt/Althingi2010_islenska_jan2024.pdf"
    ],
    [
      "Italian State Archives · Comunità di Cospaia",
      "https://siusa-archivi.cultura.gov.it/cgi-bin/siusa/pagina.pl?Chiave=46518&TipoPag=prodente"
    ],
    [
      "Internet Encyclopedia of Ukraine · General Military Council",
      "https://www.encyclopediaofukraine.com/display.asp?linkpath=pages%5CG%5CE%5CGeneralMilitaryCouncil.htm"
    ],
    [
      "National Park Service · Appalachian winter stories",
      "https://www.nps.gov/grsm/learn/historyculture/winter-stories.htm"
    ]
  ],
  "pillars": [
    [
      "Kinship & Elder Authority",
      "Grandparents, aunts, uncles, and neighbors shared direct responsibility for protecting, guiding, and correcting children.",
      "Draw a circle of trusted adults. Give each person a concrete role: teach a skill, offer help, or contact a caregiver. Role-play what the learner can do when an adult’s decision feels wrong.",
      "The learner can name two people they can go to, what each person can do, and how to ask for another adult’s help.",
      "order/"
    ],
    [
      "Mastery by Doing",
      "Children learned by riding, tracking, farming, building, and trading alongside adults—never treated as test scores or economic units.",
      "Show a finished paper weaving. Demonstrate one row. The learner makes the next rows, fixes a loose strip, and teaches the next person how to repeat it.",
      "The next person can reproduce the weave from the learner’s explanation.",
      "workbench/zones/65/"
    ],
    [
      "Voluntary Hospitality",
      "Open-door generosity—a cup of water and a slice of pie on a neighbor's porch—backed by mutual respect.",
      "Act out a visitor asking for water. Let the host offer help without asking for anything in return. Switch roles and run it again with the visitor choosing whether to stay.",
      "Both people can explain what the visitor could accept, decline, or ask for.",
      "order/porch/"
    ],
    [
      "Consensus Over Coercion",
      "Rules were enforced face-to-face by people who knew your name and bloodline, never handed down from distant institutions.",
      "Give each person a turn to name one need. Draft a rule for sharing a common tool, hear a dissenting view, then rewrite it and try it for one round.",
      "Every person can describe what the rule does, how to raise a concern, and what changed after the test.",
      "way/life/fair-decision/"
    ]
  ]
};

function servePeace(request) {
  const view = new URL(request.url).searchParams.get("view");
  const family = view === "lessons";
  const reverse = view === "reverse";
  const rotation = [
    ["The Age of Innocence","Start with home, kinship, elders, play, and shared work. In the communities where these practices are documented, children learned by seeing a skill used, trying it, and receiving help close to home. The first question is who was responsible for the child."],
    ["State and church authority enters","Follow who gained authority over movement, work, belief, schooling, or records. Use a dated law, contract, court record, or institutional archive to locate the change. In each case, ask what authority the household or community could still exercise."],
    ["Innocence becomes a commodity","Look for concrete evidence that someone could profit from a child’s labor, own or transfer people, or exploit a child and conceal the abuse. Identify who benefited, who could refuse, who controlled the record, and who could intervene."],
  ];
  const direction = reverse ? rotation.slice().reverse() : rotation;
  const pillars = peaceContent.pillars.map(([title, wording, activity, check, href]) =>
    `<article class="mastery-card"><h3>${escape(title)}</h3><blockquote><p>${escape(wording)}</p></blockquote>
      <p><strong>Family activity.</strong> ${escape(activity)}</p><p><strong>Show it worked.</strong> ${escape(check)}</p>
      <p class="screen-only"><a href="${mount}/${escape(href)}">Open the companion Academy lesson</a></p></article>`).join("");
  const histories = peaceContent.groups.map(([title, lead, cases]) =>
    `<section><h2>${escape(title)}</h2><p>${escape(lead)}</p>${cases.map(([name, note, ...ids]) =>
      `<details><summary>${escape(name)}</summary><p>${escape(note)}</p><ul>${ids.map((id) => {
        const [label,url] = peaceContent.refs[id];
        return `<li><a href="${escape(url)}">${escape(label)}</a></li>`;
      }).join("")}</ul></details>`).join("")}</section>`).join("");
  const body = `<p class="screen-only"><a href="${peacePath}source.txt">Read the original source text</a></p><p class="screen-only"><a href="${orderPath}">The Law of Order</a> · <a href="${year1626Path}">1626</a> ·
    <a href="${orderPath}">1826</a> · <a href="${porchPath}">Miss Wilson’s Porch</a></p>
    <nav class="screen-only"><a href="${peacePath}"${family || reverse ? "" : ' aria-current="page"'}>Follow the rotation</a> ·
      <a href="${peacePath}?view=reverse"${reverse ? ' aria-current="page"' : ""}>Trace the rotation backward</a> ·
      <a href="${peacePath}?view=lessons"${family ? ' aria-current="page"' : ""}>Print family lessons</a></nav>
    ${family ? "" : `<section><h2>${reverse ? "Trace the authority back to the home" : "The Age of Innocence"}</h2>
      <p>Begin with the child in the home and community, before state or church authority in the cases where those institutions had yet to take hold. Follow the rotation in that place and period.</p>
      <ol>${direction.map(([label,text]) => `<li><h3>${label}</h3><p>${text}</p></li>`).join("")}</ol>
      <h3>Where the evidence shows the turn</h3>
      <ul><li><strong>Jamaica.</strong> Enslavement claimed control over people and their labor. Maroon communities formed through escape and built their own systems of care and authority. Compare their record with the 1826 provision-ground lesson.
        <a href="https://ich.unesco.org/en/lists?RL=00053">UNESCO · Moore Town Maroon heritage</a></li>
      <li><strong>Industrial Britain.</strong> Factory and apprenticeship records show how employers benefited from children’s labor. Parliament’s 1833 Factory Act introduced inspectors and set limits on child employment in covered factories. Read the rules alongside evidence about the work children actually did.
        <a href="https://www.parliament.uk/about/living-heritage/transformingsociety/livinglearning/19thcentury/keydates/">UK Parliament · Key dates</a></li>
      <li><strong>Institutional child sexual abuse.</strong> Australia’s Royal Commission documented child sexual abuse in institutions, including religious institutions, and examined how authorities responded. Follow who had access, who received complaints, what happened to the reports, and whether children were protected.
        <a href="https://www.royalcommission.gov.au/child-abuse/final-report">Royal Commission · Final report</a> · <a href="https://www.royalcommission.gov.au/child-abuse/un-redacted-reports">Religious institutions · Unredacted findings</a></li></ul>
      <p>These are different historical mechanisms. Compare who controlled each child’s choices, who could benefit, and what happened when someone spoke up.</p>
    </section>`}
    <section><h2>The Four Pillars</h2>${pillars}</section>
    ${family ? "" : `<h2>Connect the historical cases</h2>${histories}
      <section class="proof-sheet"><h2>Prove the rotation in one place</h2>
      <ol><li>Choose one community in this lesson. Use the 1626 or 1826 lesson to find a comparison.</li>
      <li>Place a community source and an institutional source in order. Record who made each record and which people it represents.</li>
      <li>Identify one practical skill, one shift in authority, and any documented benefit from controlling another person’s choices.</li>
      <li>Connect the result to one pillar. Demonstrate what protecting a learner’s ability to ask for help, question a decision, or walk away would look like today.</li></ol>
      <p>Who held responsibility:</p><div></div><p>What changed and how I know:</p><div></div><p>What protection I can demonstrate:</p><div></div></section>`}`;
  return new Response(request.method === "HEAD" ? null : workbenchPage("The Time of Peace: Where Innocence Was Not a Commodity", body), {
    headers: { ...workbenchHeaders, "content-type": "text/html; charset=utf-8" },
  });
}


async function servePeaceSource(request, env) {
  const headers = { ...workbenchHeaders, "content-type": "text/plain; charset=utf-8" };
  const respond = (body, status) => new Response(request.method === "HEAD" ? null : body, { status, headers });
  try {
    const row = await env.LIBRARY.prepare(`
      SELECT sha256 AS record_id, verbatim_body FROM academy_history_sources
      WHERE slug = ? AND visibility = 'public'
    `).bind("time-of-peace").first();
    if (!row) return respond("Source not found.", 404);
    if (!(await matchesArchiveHash(row))) return respond("Source failed its integrity check.", 503);
    headers.etag = '"' + row.record_id + '"';
    return respond(row.verbatim_body, 200);
  } catch (error) {
    console.error("Academy source retrieval failed", error);
    return respond("Source temporarily unavailable.", 503);
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/order/time-of-peace/source.txt" &&
        (request.method === "GET" || request.method === "HEAD")) return servePeaceSource(request, env);
    if ((pathname === "/order/time-of-peace" || pathname === "/order/time-of-peace/") &&
        (request.method === "GET" || request.method === "HEAD")) return servePeace(request);
    if ((pathname === "/order/1626" || pathname === "/order/1626/") &&
        (request.method === "GET" || request.method === "HEAD")) return serveYear1626(request);
    if ((pathname === "/order/porch" || pathname === "/order/porch/") &&
        (request.method === "GET" || request.method === "HEAD")) return servePorch(request);
    if ((pathname === "/order" || pathname === "/order/") && (request.method === "GET" || request.method === "HEAD")) return serveOrder(request);
    if ((request.method === "GET" || request.method === "HEAD") &&
        (pathname === "/way" || pathname.startsWith("/way/"))) return serveWay(request, env);
    if ((request.method === "GET" || request.method === "HEAD") &&
        (pathname === "/survival" || pathname.startsWith("/survival/"))) return serveSurvival(request, env);
    if ((request.method === "GET" || request.method === "HEAD") &&
        (pathname === "/workbench" || pathname.startsWith("/workbench/"))) return serveWorkbench(request, env);
    if (pathname !== "/library" && pathname !== "/library/") return teaser.fetch(request);
    if (request.method !== "GET" && request.method !== "HEAD") return teaser.fetch(request);
    try {
      const html = await libraryPage(env);
      return new Response(request.method === "HEAD" ? null : html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        },
      });
    } catch (error) {
      console.error("Academy library query failed", error);
      return new Response(request.method === "HEAD" ? null : "Library temporarily unavailable.", {
        status: 503,
        headers: { "cache-control": "no-store" },
      });
    }
  },
};

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
      <p><a href="${mount}/order/">The Law of Order · Good Samaritan and the village syllabus</a></p><h2>Choose a path</h2><ul class="way-grid">${grid}</ul>
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
      <p><a href="${mount}/order/porch/">Miss Wilson’s Porch · Hospitality, accountability, and surveillance</a></p><p>The records vary by place. A school register or law can establish a formal rule. A letter, oral history, or household record can show how people actually lived it. Look for both before assigning authority to every adult in a community.</p><p><strong>Go back another century.</strong> Try Nathan’s question in each place. Do the earlier sources show one community model, or do they already show household, trade, religious, and state instruction side by side?</p>
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
  const body = `<p class="screen-only"><a href="${orderPath}">The Law of Order</a> · <a href="${mount}/way/">The Nathan Tabor Way</a></p>
    <h2>Z · What a learner should be able to show</h2>
    <p>Given a situation, identify who offers help, who receives a report, what power comes with it, and whether the person can leave, disagree, or correct the record.</p>
    <section><h2>The Madison County porch story</h2><p>Academy source text</p>
      <blockquote>${porchOpening.map((line) => `<p>${escape(line)}</p>`).join("")}<ol>${list(porchRules)}</ol></blockquote>
      <p>The memory describes a practice of its time. In Academy exercises, correction means explaining the expectation, hearing the learner’s account, agreeing on a repair when harm was done, and contacting a caregiver when needed.</p>
    </section>
    <section><h2>How That “Open-Range Freedom” Worked in 1826</h2>
      <p>The supplied scenes illustrate how hospitality might work. Their individual encounters and universal claims need evidence of their own.</p>
      <blockquote><p>In all four places 200 years ago, that exact same hospitality-and-accountability loop was the real social safety net:</p></blockquote>
      ${places}<p><a href="${orderPath}">Open the four regional source lists</a> ·
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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
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

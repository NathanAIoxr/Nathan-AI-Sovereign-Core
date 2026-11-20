const page = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<meta name=\"theme-color\" content=\"#10140f\">\n<meta name=\"description\" content=\"Tabor Academy by Nathan Tabor. Coming soon.\">\n<title>Tabor Academy by Nathan Tabor</title>\n<style>\n:root { color-scheme: dark; font-family: system-ui, sans-serif; background: #10140f; color: #f9f3e4; }\n* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100svh; display: grid; place-items: center; padding: clamp(1rem, 5vw, 5rem); background: radial-gradient(ellipse at 78% 14%, #2a361f, transparent 59%), #10140f; }\nmain { width: min(100%, 76rem); border: 1px solid #778360; padding: clamp(1.2rem, 6vw, 6rem); overflow-wrap: break-word; }\nh1 { margin: 0; font-family: Georgia, serif; font-size: clamp(2.45rem, 10vw, 9rem); font-weight: 400; line-height: .91; letter-spacing: -.055em; }\nh1 span { display: block; }\n.byline { margin: 2rem 0 0; font-size: .85rem; font-weight: 650; letter-spacing: .15em; }\n.opening { max-width: 52rem; margin: 1.5rem 0 0; padding-inline-start: 1.65em; font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.55; }\n.opening li { padding-inline-start: .3em; margin-block: .65em; }\n.opening li::marker { color: #e6cf87; font-weight: 700; }\n</style>\n</head>\n<body>\n<main>\n<h1><span>TABOR</span> <span>ACADEMY</span></h1>\n<p class=\"byline\">BY NATHAN TABOR</p>\n<ol class=\"opening\">\n<li>U R my family - one blood - cousins</li>\n<li>No stupidity allowed - multiplication and division are man-made traps for your mind because when you apply them to reality, they’re stupid</li>\n<li>You’re talking mammal from the Mammalia family</li>\n<li>You are a small tiny sea urchin at the bottom of the cosmic ocean of 46.5 billion light years and your body is held down by a bowling ball on every 1.7 in.² of your body</li>\n<li>You’re also on the side of a round globe stuck with your feet to it with your head stuck out into space.</li>\n<li>Or you’re on a flat earth either way, you still have a lot of weight on you</li>\n<li>The world that has been promised and told that it was here has never been delivered.</li>\n<li>Every ancient text says you were in matrix is born inside the womb.</li>\n<li>God is an imaginary friend and the one root cause of the stupidity in the history of humanity.</li>\n</ol>\n<p><a href=\"/tabor-academy/library/\" style=\"color:#e6cf87\">Open the Library of Tabor</a> · <a href=\"/tabor-academy/workbench/\" style=\"color:#e6cf87\">Open Tabor Workbench</a> · <a href=\"/tabor-academy/survival/\" style=\"color:#e6cf87\">Survival-to-Modernity Mastery Drills</a></p>\n</main>\n</body>\n</html>";

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
  @media print{ .mastery-card{break-inside:avoid;border-bottom:1px solid #777;padding-bottom:1em} :root{color-scheme:light;background:white;color:black} main{padding:0} nav,.sandbox,.screen-only{display:none}
    h1{font-size:24pt}.outcome{padding:0;background:white}#triangle-template{width:4.5in;height:3.6in;max-width:none} section{break-inside:avoid} }
  </style><main><nav><a href="${mount}/">Tabor Academy</a> · <a href="${mount}/library/">Library of Tabor</a> · <a href="${workbenchPath}">Workbench</a></nav>
  <h1>${escape(title)}</h1>${body}</main></html>`;
}

async function workbenchCatalog(env, guide) {
  const { results } = await env.LIBRARY.prepare(`
    SELECT t.number, t.guide, t.guide_title, t.title, t.media, z.namespace_name, z.brief
    FROM academy_techniques AS t LEFT JOIN academy_technique_zones AS z ON t.number = z.number
    WHERE (?1 IS NULL OR t.guide = ?1) ORDER BY t.number
  `).bind(guide).all();
  return results.map(({ media, ...record }) => ({
    ...record, media: Array.from(media, (key) => mediumNames[key]),
    zone: workbenchPath + "zones/" + record.number + "/",
    lesson: record.number === 47 ? workbenchPath + "47/" : null,
  }));
}

function renderGuides(records, guide) {
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
      <span class="media">${escape(entry.media.join(" · "))}${entry.lesson ? " · Lesson and sandbox ready" : fieldActivities[entry.number] ? " · Field activity ready" : ""}</span>
    </li>`).join("")}</ol></section>`).join("");
  return workbenchPage(guide ? "Field Guide " + guide : "Tabor Workbench", `
    <p>${guide ? "Technique index for this field guide." : "101 techniques across seven field guides. Each entry shows where it belongs in the Academy blueprint."}</p>
    <ul class="guide-links">${links}</ul>${index}`);
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


const fieldActivities = {
  "4": [
    "A paper bridge that holds three coins",
    "Place the finished bridge on two books and put three coins on it. Turn it over to inspect the folds.",
    "Fold a sheet into an accordion and span the same gap. Test one coin at a time and compare with a flat sheet."
  ],
  "21": [
    "One proverb you can test",
    "Read “Measure twice, cut once.” Decide what measuring twice is supposed to prevent.",
    "Use two strips of paper. Mark a target length once on the first strip and check the second strip twice. Tear along each mark and compare both strips against the target."
  ],
  "46": [
    "Two piles combined into one total",
    "Put two pebbles in the left space and three in the right space. Move them into the middle one at a time as you count.",
    "Draw three circles on paper for the two starting piles and the total. Build a second example with different counts and tell someone how you checked the result."
  ],
  "59": [
    "A folded paper shape that stands on its own",
    "Look at a folded accordion standing on its long edge. Count the peaks and valleys from one end.",
    "Fold two identical sheets, one into an accordion and one just down the center. Stand both on a flat surface and compare what happens when you gently nudge them."
  ],
  "65": [
    "A small woven square with alternating rows",
    "Turn over a sample of paper weaving. Trace one strip across the page and say where it passes over and under.",
    "Lay four paper strips on the table. Weave a fifth strip over and under. Start the next row the opposite way. Tug one loose edge, repair it, and explain why the alternating pattern matters."
  ],
  "92": [
    "Two shares made by one person and chosen by another",
    "Give two players eight paper tokens. One player makes two shares and the other chooses first.",
    "Ask each player what made the result fair. Swap roles and repeat with an odd number of tokens. Compare the new shares and agree on a rule for the extra token."
  ],
  "101": [
    "A finished object the learner can build and teach",
    "Choose one Workbench field activity. Show the finished result and explain the check you used to see whether it worked.",
    "Rebuild it from the starting materials, then teach another person the steps. Record what they could reproduce and one place where the explanation needed to be clearer."
  ]
};

async function renderZone(number, env) {
  const record = await env.LIBRARY.prepare(`
    SELECT t.number, t.title, t.guide, t.media, z.namespace_name, z.brief
    FROM academy_techniques AS t JOIN academy_technique_zones AS z ON t.number = z.number
    WHERE t.number = ?
  `).bind(number).first();
  if (!record) return null;
  const activity = fieldActivities[number];
  const field = activity ? `<section><h2>Z · Finished outcome</h2><p>${escape(activity[0])}</p>
    <h2>Show it</h2><p>${escape(activity[1])}</p>
    <h2>A · Replicate and verify</h2><p>${escape(activity[2])}</p></section>`
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
      : render(renderGuides(records, guide), "text/html");
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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
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

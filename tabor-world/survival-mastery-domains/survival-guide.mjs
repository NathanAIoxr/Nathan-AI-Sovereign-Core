export const academyBase = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy";
export const worldBase = "https://tabor-world.nathantaboract.workers.dev";
export const worldCourse = "/survival-mastery-domains";
export const academyCourse = "/way/survival-mastery-domains";
export const domains = [
  { id:"protection", name:"Stay safe", subject:"Protection", summary:"Recognize warning signs, calm a conflict, and plan how to get help." },
  { id:"money", name:"Make a money decision", subject:"Money, Trade & Contracts", summary:"Compare costs, read the fine print, and check where your money went." },
  { id:"kinship", name:"Set a boundary", subject:"Human Psychology & Relationships", summary:"Practice hearing a clear answer, building trust, and repairing a mistake." },
  { id:"homestead", name:"Keep the household running", subject:"Domestic & Homestead Core", summary:"Make a plan for safe water, food storage, repairs, and outages." },
  { id:"learning", name:"Learn and remember", subject:"Meta-Learning & Mind Architecture", summary:"Find a format that works, test your recall, and correct an old rule." },
  { id:"civic", name:"Find a public record", subject:"Civic Reality & Institutional Literacy", summary:"Find the right office, check a public decision, or read an official notice." },
];
const plainTopics = {
  1: ["Recognize grooming and pressure", "safety gaslighting deception secret"],
  2: ["Calm a tense situation", "de-escalation conflict anger argument"],
  3: ["Get help in a first-aid emergency", "triage bleeding injuries burns trauma"],
  4: ["Three Apples · Subtraction", "apple subtraction subtract count counting moved"],
  5: ["Read a contract before signing", "small print lease agreement fine print loophole"],
  6: ["Compare loans, fees, and debt", "interest credit currency tax rates subtraction multiplication zero"],
  7: ["Recognize repeating family patterns", "attachment trauma childhood cycles"],
  8: ["Set and respect boundaries", "consent yes no guilt pressure gaslighting"],
  9: ["Decide who you can trust", "partner friend ally relationship actions"],
  10: ["Make a safe drinking water plan", "filter store water emergency contamination"],
  11: ["Keep stored food safe", "preservation canning dehydration pantry"],
  12: ["Plan a basic home repair", "plumbing roof leaks framing electricity wiring"],
  13: ["Find a way to learn that works for you", "neurodiversity processing accommodations accessibility"],
  14: ["Remember what you learned", "recall test memory compression practice"],
  15: ["CLEAR · Recheck a rule you learned", "reset unlearn 1 - 1 = 0 subtraction multiplication binary three apples"],
  16: ["Request a public record", "FOIA docket documents court information"],
  17: ["Check local zoning and permits", "county local governance property ordinances"],
  18: ["Plan how everyone will evacuate", "accessibility household emergency disability escape"],
  19: ["Help and report safely as a bystander", "witness reporting support documentation"],
  20: ["Check your cash flow and spot fraud", "budget savings bank transaction reserve scam"],
  21: ["Repair trust after conflict", "apology accountability support relationships"],
  22: ["Make a fire and utility shutoff plan", "gas carbon monoxide electricity alarm power"],
  23: ["Keep supplies usable through an outage", "sanitation inventory power rotation emergency"],
  24: ["Track progress in a format you can use", "accessible practice feedback accommodations mastery"],
  25: ["Read a public agenda or budget", "meeting public comment appeal participation"],
  26: ["Find benefits and check a decision", "public services eligibility administrative review appeal"],
  27: ["Put all six skills to work", "capstone household scenario final project"],
};

export function learningTopics(catalog, mode) {
  return catalog.eras.flatMap((era) => era.stations.map((station) => {
    const [title, keywords] = plainTopics[station.id] ?? [station.title, ""];
    const slug = "survival-field-drill-" + String(station.id).padStart(2, "0");
    const worldPath = `${worldCourse}/${era.id}/${station.id}/`;
    return {
      domain:era.id, title, subject:station.title, slug, worldPath,
      keywords:`${keywords} ${station.question}`, summary:station.station,
      practice:mode === "world" ? worldPath : `/tabor-academy/way/mastery-${era.id}/${slug}/`,
      lesson:station.academy,
    };
  }));
}

export function barterLesson() {
  return link(academyBase + "/way/mastery-money/survival-domain-04/", "Barter, Direct Exchange & Value Creation", "action");
}

export const escape = (value) => String(value).replace(/[&<>"']/g, (character) =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
export function link(url, label, css = "", context = "") {
  return `<a${css ? ` class="${escape(css)}"` : ""}${context ? ` aria-label="${escape(label + " · " + context)}"` : ""} href="${escape(url)}">${escape(label)}</a>`;
}
export const guideStyles = `
  .guide { --guide-border:#92836a; --guide-panel:#252b21; --guide-text:#f7eed8; --guide-accent:#f4ce91; }
  .guide p { max-width:69ch; }
  .guide .lede { color:#e3dccb; margin-top:0; font-size:1.12rem; }
  .guide .actions { margin:1rem 0; display:flex; align-items:center; flex-wrap:wrap; gap:.55rem; }
  .guide .action { display:inline-flex; align-items:center; min-height:46px; padding:.6rem .9rem; border:1px solid var(--guide-border); border-radius:.4rem; font-weight:650; text-decoration:none; }
  .guide .primary { color:#1b210f; background:var(--guide-accent); border-color:var(--guide-accent); }
  .guide .primary:hover { background:#ffe8b6; color:#181e0e; }
  .guide .action:hover { text-decoration:underline; }
  .guide .guide-search { margin:1.4rem 0; }
  .guide .guide-search label { display:block; margin-bottom:.38rem; font-weight:700; }
  .guide .guide-search input { width:min(100%,30rem); min-height:46px; border:1px solid var(--guide-border); border-radius:.35rem; background:#1b2018; color:inherit; padding:.55rem .7rem; font:inherit; }
  .guide .guide-search button { min-height:46px; padding:.55rem .9rem; border:1px solid var(--guide-border); border-radius:.35rem; color:inherit; background:var(--guide-panel); font:inherit; cursor:pointer; }
  .guide .search-controls { display:flex; flex-wrap:wrap; gap:.45rem; }
  .guide .guide-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr)); gap:.8rem; padding:0; }
  .guide .guide-grid > li, .guide .topic-list > li { list-style:none; padding:1rem; border:1px solid var(--guide-border); border-radius:.5rem; background:var(--guide-panel); }
  .guide .guide-grid h3, .guide .topic-list h3 { font:650 1.13rem/1.28 Inter,system-ui,sans-serif; margin:0; }
  .guide .guide-grid h3 a { display:inline-flex; align-items:center; min-height:44px; }
  .guide .guide-grid p, .guide .topic-list p { margin:.35rem 0; }
  .guide .topic-list { display:grid; gap:.65rem; padding:0; }
  .guide .topic-list .actions { margin:.7rem 0 0; }
  .guide .result-count { color:#e3dccb; }
  .guide .guide-source { margin:1.5rem 0; }
  .guide .choices { padding-bottom:.8rem; }
  .guide .choices button { min-height:52px; }
  .guide summary { min-height:44px; align-content:center; cursor:pointer; color:var(--guide-accent); width:fit-content; }
  .guide :where(a,button,input,summary):focus-visible { outline:2px solid #ffe8b6; outline-offset:4px; }
  .guide .answer#decision-result:target { scroll-margin-top:1rem; }
  @media(max-width:34rem) {
    .guide .guide-grid { grid-template-columns:1fr; }
    .guide .actions .action { justify-content:center; }
  }
  @media print {
    .guide { --guide-text:#000; --guide-panel:#fff; --guide-accent:#000; }
    .guide .lede { color:#000; }
    .guide .screen-only, .guide .guide-search, .guide .actions { display:none!important; }
  }
`;

function domainUrl(mode, id) {
  return mode === "world" ? `${worldCourse}/${id}/` : `/tabor-academy/way/mastery-${id}/`;
}
export function guideQuery(request) {
  return (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
}
function matches(topic, query) {
  const domain = domains.find((domain) => domain.id === topic.domain);
  const text = `${topic.title} ${domain?.subject ?? ""} ${topic.subject ?? ""} ${topic.keywords ?? ""}`.normalize("NFKC").toLowerCase();
  return query.normalize("NFKC").toLowerCase().split(/\s+/).every((word) =>
    text.includes(word) || (word.length > 4 && word.endsWith("s") && text.includes(word.slice(0, -1))));
}
export function topicList(topics) {
  return `<ul class="topic-list">${topics.map((topic) => `<li><h3>${escape(topic.title)}</h3>
    ${topic.summary ? `<p>${escape(topic.summary)}</p>` : ""}
    <div class="actions">${topic.practice ? link(topic.practice, "Try a drill", "action primary", topic.title) : ""}
    ${topic.lesson ? link(topic.lesson, "Read the lesson", "action", topic.title) : ""}</div></li>`).join("")}</ul>`;
}
export function guideLanding(mode, query, topics = []) {
  const world = mode === "world";
  const home = world ? worldCourse + "/" : "/tabor-academy" + academyCourse + "/";
  const apple = world ? worldCourse + "/money/4/" : "/tabor-academy/way/mastery-money/survival-field-drill-04/";
  const alternate = world ? academyBase + academyCourse + "/" : worldBase + worldCourse + "/";
  const fieldbook = academyBase + academyCourse + "/fieldbook/";
  const results = query ? topics.filter((topic) => matches(topic, query)) : [];
  return `<div class="guide"><style>${guideStyles}</style>
    <p class="lede">${world ? "Try a short scenario, choose a response, and see what happens. Read the related lesson whenever you need more detail." : "Find a topic, read the lesson, and use the matching drill to practice a real-life decision."}</p>
    <div class="actions">${link(apple, "Start with Three Apples", "action primary")}${link(alternate, world ? "Go to Tabor Academy" : "Practice in Tabor World", "action")}</div>
    <form class="guide-search" action="${home}" method="get" role="search"><label for="topic-query">Find a topic</label>
      <div class="search-controls"><input id="topic-query" name="q" type="search" maxlength="80" value="${escape(query)}" placeholder="Try water, loans, or gaslighting"><button type="submit">Search</button></div>
    </form>
    ${query ? `<h2>Search results</h2><p class="result-count">${results.length} ${results.length === 1 ? "topic" : "topics"} for “${escape(query)}” · ${link(home, "Clear search")}</p>
      ${results.length ? topicList(results) : '<p>Try a shorter word or choose a topic below.</p>'}` : ""}
    <h2>What do you need to do?</h2>
    <ul class="guide-grid">${domains.map((domain) => `<li><h3>${link(domainUrl(mode, domain.id), domain.name)}</h3><p>${escape(domain.summary)}</p></li>`).join("")}</ul>
    <div class="actions">${link(fieldbook, "Open the Fieldbook", "action")}${link(fieldbook + "?print=1", "Printable workbook", "action")}
      ${world ? "" : link("/tabor-academy/way/mastery-civic/survival-field-drill-27/", "Try the six-domain capstone", "action")}</div>
    ${world ? "" : `<details class="guide-source"><summary>Course orientation and related work</summary><p>${link(home+"survival-mastery-zero/", "0 · Start from a real decision")} · ${link(home+"survival-field-drills/", "27 Field Drills")} · ${link("/tabor-academy/institution/", "Nine Operational Pillars")} · ${link("/tabor-academy/way/human-learning-arc/", "Complete Human Learning Arc")}</p></details>`}
  </div>`;
}

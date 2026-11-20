import { survivalDomains } from "../survival-mastery-domains-data.mjs";
import { labs, capstone } from "./labs.mjs";

export function fieldbook(survivalDomains, labs, capstone) {
  const course = "/way/survival-mastery-domains";
  const route = course + "/fieldbook";
  const academy = "/tabor-academy";
  const path = academy + route;
  const explorer = "https://tabor-world.nathantaboract.workers.dev/survival-mastery-domains/";
  const name = "Six Domains Fieldbook";
  const stages = [["Build", "1 + 1 = 2", "build"], ["Clear", "1 − 1 = 0", "clear"], ["Integrate", "1 × 1 = 1", "integrate"], ["Verify", "1 ÷ 1 = 1", "verify"]];
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const link = (href, text) => `<a href="${escape(href)}">${escape(text)}</a>`;
  const list = items => `<ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>`;
  const responseHeaders = {
    "content-type": "text/html; charset=utf-8",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "cache-control": "public, max-age=300",
  };

  function page(title, body) {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)} · Tabor Academy</title>
<style>
:root{color-scheme:dark;font:1rem/1.6 system-ui,sans-serif;background:#10140f;color:#f9f3e4}
*{box-sizing:border-box}body{margin:0}main{width:min(100%,72rem);margin:auto;padding:clamp(1rem,5vw,4rem)}
a{color:#ead18c;text-underline-offset:.2em}nav{display:flex;flex-wrap:wrap;gap:.5rem 1.35rem}
a:focus-visible,summary:focus-visible,input:focus-visible,button:focus-visible{outline:3px solid #f9f3e4;outline-offset:5px}
h1,h2,h3{font-family:Georgia,serif;font-weight:400;line-height:1.13}h1{font-size:clamp(2.35rem,8vw,5.5rem);margin:.2rem 0 1rem}
h2{font-size:clamp(1.65rem,4vw,2.65rem);margin:.2rem 0 1rem}h3{font-size:1.38rem;margin:.2rem 0 .6rem}
p,li{max-width:75ch}section{margin:2rem 0 0;border-top:1px solid #697659;padding-top:1.2rem}
.kicker{color:#e0c785;font-size:.93rem;margin:2.25rem 0 .55rem}
.deck{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:.9rem;padding:0;list-style:none}
.deck li,details,fieldset{border:1px solid #697659;padding:.9rem 1.1rem}
summary,label{cursor:pointer}details{margin-top:1rem}.stage{padding-left:1rem}.stage li{margin:.6rem 0}
.note{border-bottom:1px solid #849272;min-height:2rem}.score li{margin:.5rem 0}button{font:inherit;font-weight:700;padding:.45rem .8rem;background:#ead18c;color:#10140f;border:0}
input[type=checkbox]{accent-color:#ead18c}output{display:block;margin-top:.8rem;font-weight:700}
@media print{:root{color-scheme:light;color:#000;background:#fff}main{width:100%;padding:0}a{color:#000}nav,.no-print{display:none}section[data-lab]{break-before:page}.deck li,details,fieldset{border-color:#888}}
</style></head><body><main>
<nav aria-label="Academy navigation">${link(academy + "/", "Academy home")}${link(academy + course + "/", "All 27 modules")}${link(path + "/", "Fieldbook")}${link(explorer, "Tabor World explorer")}</nav>
<p class="kicker">Tabor Academy · The Nathan Tabor Way</p>
<h1>${escape(title)}</h1>${body}</main></body></html>`;
  }

  function labSection(domain, print = false) {
    const lab = labs[domain.id];
    const heading = print ? `<h2>${escape(lab.name)}</h2>` : "";
    const exercises = domain.stations.map(station => link(station.academy, station.title));
    return `<section data-lab="${domain.id}">${heading}
<p><strong>${escape(lab.heading)}</strong></p>
<p><strong>Finished outcome</strong> · ${escape(lab.outcome)}</p>
<h3>Scenario</h3><p>${escape(lab.scenario)}</p>
<ol class="stage">${stages.map(([title, math, key]) => `<li><strong>${title} · ${math}</strong><br>${escape(lab[key])}</li>`).join("")}</ol>
<h3>Change one condition</h3><p>${escape(lab.change)}</p>
<p>Mark what changed, who owns the next action, and when they will check it.</p>
<div class="note" aria-hidden="true"></div><div class="note" aria-hidden="true"></div>
${print ? "" : `<details><summary>Compare with the worked response</summary><p>${escape(lab.answer)}</p></details>`}
<h3>Continue in the Academy</h3>${list(exercises)}
<h3>Source trail</h3>${list(lab.sources.map(([title, href, text]) => `${escape(text)} ${link(href, title)}`))}
</section>`;
  }

  function showCapstone(print, query) {
    const items = [
      ...capstone.priorities,
      ["Arithmetic", "The figures can be reproduced from the input amounts and dates."],
      ["Uncertainty", "The decision record identifies which claims still need evidence."],
      ["Changed conditions", "The selected response changes with the new facts."],
      ["Teach-back", "The next shift can act from the written handoff without a verbal correction."],
    ];
    const marked = new Set(query.getAll("met").filter(key => items.some((_, index) => key === String(index + 1))));
    const graded = query.get("grade") === "1";
    const criteria = `<ol class="score">${items.map(([title, text], index) => {
      const key = String(index + 1);
      const check = print ? "☐ " : `<input type="checkbox" name="met" value="${key}"${marked.has(key) ? " checked" : ""}> `;
      return `<li><label>${check}<strong>${escape(title)}</strong> · ${escape(text)}</label></li>`;
    }).join("")}</ol>`;
    const score = graded ? `<output role="status">${marked.size}/10 · ${marked.size >= 9 ? "Mastery reached" : "Review the unchecked criteria and try again"}.</output>` : "";
    const assessment = print ? criteria : `<form method="get" action="${path}/capstone/#rubric"><fieldset id="rubric"><legend>Self-check · 9 of 10 criteria</legend>${criteria}<button type="submit" name="grade" value="1">Check mastery</button>${score}</fieldset></form>`;
    return `<section data-lab="capstone">${print ? `<h2>${capstone.name}</h2>` : ""}
<p><strong>Finished outcome</strong> · ${escape(capstone.outcome)}</p>
<h3>Scenario</h3><p>${escape(capstone.scenario)}</p>
<h3>Change the plan</h3><p>${escape(capstone.change)}</p>
<p>Use one row per decision. Record the observation, action, owner, time, and the evidence another person can check.</p>
${assessment}
${print ? "" : `<details><summary>Open the worked handoff</summary>${list(capstone.priorities.map(([title, text]) => `<strong>${escape(title)}</strong> · ${escape(text)}`))}</details>`}
<p>Preserve the original decision and add a dated correction when a fact changes.</p></section>`;
  }

  function home() {
    return page(name, `<p>Start with six field labs. Then combine the decisions in one storm-response plan.</p>
<p>${link(path + "/print/", "Printable workbook")} · ${link(path + "/catalog.json", "Lab catalog JSON")}</p>
<section><h2>Field labs</h2><ul class="deck">${survivalDomains.eras.map(domain => {
  const lab = labs[domain.id];
  return `<li><h3>${link(path + "/" + domain.id + "/", lab.name)}</h3><p><strong>${escape(lab.title)}</strong></p><p>${escape(lab.outcome)}</p></li>`;
}).join("")}</ul></section>
<section><h2>${link(path + "/capstone/", capstone.name)}</h2><p>Put all six decisions on a single record and have another learner run the handoff.</p></section>`);
  }

  function serve(request, slug, query) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    let status = 200;
    let body;
    let headers = responseHeaders;
    const domain = survivalDomains.eras.find(entry => entry.id === slug);
    if (!slug) body = home();
    else if (domain) body = page(labs[domain.id].name, labSection(domain));
    else if (slug === "capstone") body = page(capstone.name, showCapstone(false, query));
    else if (slug === "print") body = page("Six Domains Printable Workbook",
      survivalDomains.eras.map(entry => labSection(entry, true)).join("") + showCapstone(true, query));
    else if (slug === "catalog.json") {
      body = JSON.stringify({ name, domainCount: survivalDomains.eras.length, labCount: Object.keys(labs).length,
        lessonCount: survivalDomains.eras.reduce((total, entry) => total + entry.stations.length, 0),
        labs: survivalDomains.eras.map(entry => ({ id: entry.id, ...labs[entry.id], lessons: entry.stations })),
        stages: stages.map(([label, math]) => ({ label, math })), capstone });
      headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    } else {
      status = 404;
      body = page("Fieldbook page unavailable", `<p>${link(path + "/", "Return to the six labs")}</p>`);
    }
    return new Response(request.method === "HEAD" ? null : body, { status, headers });
  }

  return original => ({
    ...original,
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      const pathname = url.pathname.replace(/^\/tabor-academy(?=\/)/, "").replace(/\/$/, "");
      if (pathname === route || pathname.startsWith(route + "/")) return serve(request, pathname.slice(route.length + 1), url.searchParams);
      const response = await original.fetch(request, env, ctx);
      if (request.method === "GET" && pathname === course && response.ok && response.headers.get("content-type")?.includes("text/html")) {
        return new HTMLRewriter().on("main h1", {
          element(node) { node.after(`<p data-fieldbook>${link(path + "/", name)} · ${link(path + "/print/", "Printable workbook")}</p>`, { html: true }); },
        }).transform(response);
      }
      return response;
    },
  });
}

export const withFieldbook = fieldbook(survivalDomains, labs, capstone);

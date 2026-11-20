import { academyCourse, domains, escape, guideLanding, guideQuery, guideStyles, link, learningTopics, topicList, worldBase } from "./survival-guide.mjs";
import { survivalDomains } from "./survival-mastery-domains-data.mjs";

const mount = "/tabor-academy";
const home = mount + academyCourse + "/";
const fieldbook = home + "fieldbook/";
const topics = learningTopics(survivalDomains, "academy");
const headers = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=120",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "x-content-type-options": "nosniff",
};
const styles = `
  :root { color-scheme:dark; background:#171916; color:#f4eddb; font:17px/1.55 Inter, system-ui, sans-serif; }
  * { box-sizing:border-box; } body { margin:0; }
  main { width:min(100%,70rem); padding:clamp(1rem,5vw,4rem); margin:auto; }
  a { color:#f4ce91; text-underline-offset:.2em; overflow-wrap:anywhere; }
  h1,h2 { font:400 clamp(1.65rem,5vw,2.65rem)/1.12 "Instrument Serif", Georgia, serif; margin:.8rem 0; }
  h1 { font-size:clamp(2.2rem,7vw,4rem); max-width:24ch; }
  nav { display:flex; flex-wrap:wrap; gap:.5rem 1rem; }
  nav a { display:inline-flex; align-items:center; min-height:44px; }
  .exercise { display:grid; gap:.8rem; max-width:55rem; }
  .exercise section, .exercise details { padding:.75rem 1rem; border:1px solid #88795f; border-radius:.4rem; }
  .exercise li { padding-block:.3rem; }
  .exercise p { overflow-wrap:anywhere; }
  .exercise .note { min-height:2rem; border-bottom:1px solid #88795f; }
  .exercise blockquote { margin:.8rem 0; padding-left:.8rem; border-left:3px solid #f4ce91; }
  @media print {
    :root { color-scheme:light; color:#000; background:#fff; } main { width:100%; padding:0; }
    a { color:#000; } .screen-only { display:none!important; } section,details { break-inside:avoid; }
  }
`;

function page(request, title, body) {
  return new Response(request.method === "HEAD" ? null : `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · Tabor Academy</title><style>${styles}${guideStyles}</style></head><body><main>
<nav class="screen-only" aria-label="Academy navigation">${link(mount + "/", "Tabor Academy")}${link(home, "All six domains")}</nav>
<h1>${escape(title)}</h1>${body}</main></body></html>`, { headers });
}

function domainPage(request, domain) {
  return page(request, domain.name, `<div class="guide"><p class="lede">${escape(domain.summary)}</p>
    <h2>Choose a topic</h2>${topicList(topics.filter((topic) => topic.domain === domain.id))}
    <div class="actions">${link(fieldbook, "Open the Fieldbook", "action")}</div></div>`);
}

function drillPage(request, topic, mission) {
  const print = new URL(request.url).searchParams.get("print") === "1";
  const [scenario, choices] = mission.build.split(" Choices: ", 2);
  const options = choices?.split(" / ").map((choice) => choice.replace(/^\d+\.\s*/, ""));
  const authored = mission.flip.startsWith("Nathan Tabor’s words:");
  const authorName = "Nathan Tabor’s words:";
  const related = mission.link && /^\/?[a-z0-9][a-z0-9/-]*$/i.test(mission.link)
    ? link(mount + "/" + mission.link.replace(/^\/+/, ""), "Related Academy work", "action") : "";
  return page(request, topic.title, `<article class="guide exercise">
    <p class="lede">${escape(mission.outcome)}</p>
    <section><h2>Make a choice</h2><p>${escape(scenario)}</p>
    ${options ? `<ol>${options.map((option) => `<li>${escape(option)}</li>`).join("")}</ol>` : ""}</section>
    <section><h2>${authored ? "Nathan Tabor’s words" : "Think it through"}</h2>
    ${authored ? `<blockquote>${escape(mission.flip.slice(authorName.length).trim())}</blockquote>` : `<p>${escape(mission.flip)}</p>`}</section>
    <section><h2>Apply it</h2><p>${escape(mission.integrate)}</p>
    <div class="note" aria-hidden="true"></div><div class="note" aria-hidden="true"></div><div class="note" aria-hidden="true"></div></section>
    <details${print ? " open" : ""}><summary>Check your response</summary><p>${escape(mission.verify)}</p></details>
    <div class="actions screen-only">${link(topic.lesson, "Read the lesson", "action primary")}
    ${link(worldBase + topic.worldPath, "Try the interactive version", "action")}${link(topic.practice + "?print=1", "Print view", "action")}
    ${link(fieldbook, "Open the Fieldbook", "action")}${related}</div></article>`);
}

export default function withLearnerGuide(base) {
  return {
    ...base,
    async fetch(request, env, ctx) {
      const fallback = () => base.fetch(request, env, ctx);
      if (request.method !== "GET" && request.method !== "HEAD") return fallback();
      const pathname = new URL(request.url).pathname;
      const route = pathname.replace(/^\/tabor-academy(?=\/)/, "").replace(/\/$/, "");
      if (route === academyCourse) {
        return page(request, "Six Universal Human Survival & Mastery Domains", guideLanding("academy", guideQuery(request), topics));
      }
      const domain = domains.find((item) => route === "/way/mastery-" + item.id);
      if (domain) return domainPage(request, domain);
      const topic = topics.find((item) => item.practice === mount + route + "/");
      if (topic && env?.LIBRARY) {
        try {
          const mission = await env.LIBRARY.prepare(
            "SELECT outcome, build, flip, integrate, verify, link FROM academy_way_missions WHERE path = ? AND slug = ?",
          ).bind("mastery-" + topic.domain, topic.slug).first();
          if (mission) return drillPage(request, topic, mission);
        } catch (error) {
          console.error("Academy field drill guide unavailable", error.message);
        }
      }
      if (request.method === "GET" && typeof HTMLRewriter === "function") {
        if (route === "" || route === "/map") {
          const response = await fallback();
          if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return response;
          return new HTMLRewriter().on("main h1", {
            element(heading) {
              heading.after(`<p>${link(home, "Find a practical lesson or drill")}</p>`, { html:true });
            },
          }).transform(response);
        }
        const lesson = topics.find((item) => new URL(item.lesson).pathname === mount + route + "/");
        if (lesson) {
          const response = await fallback();
          if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return response;
          let inserted = false;
          return new HTMLRewriter().on("main h1", {
            element(heading) {
              if (inserted) return;
              inserted = true;
              heading.after(`<p><a href="${escape(lesson.practice)}">Try the matching field drill</a> · ${link(home, "All six domains")}</p>`, { html:true });
            },
          }).transform(response);
        }
      }
      return fallback();
    },
  };
}

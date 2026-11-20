import { learningArc } from "./human-learning-arc-data.mjs";

const root = "/human-learning-arc";
const title = "The Complete Human Learning Arc";
const styles = `
  :root { color-scheme: dark; font: 17px/1.55 Inter, system-ui, sans-serif; background: #171916; color: #f4eddb; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  a { color: #f4ce91; text-underline-offset: .22em; }
  a:hover { color: #fff2d4; }
  a:focus-visible, summary:focus-visible { outline: 2px solid #ffe3ae; outline-offset: 4px; }
  header, main, footer { max-width: 75rem; margin: auto; padding-inline: clamp(1rem, 5vw, 4rem); }
  header { padding-block: 1.4rem; display: flex; gap: 1.5rem; flex-wrap: wrap; border-bottom: 1px solid #514d40; }
  header a:first-child { color: inherit; font-weight: 700; }
  main { padding-block: clamp(2rem, 6vw, 5rem); }
  h1, h2 { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; line-height: 1.05; }
  h1 { font-size: clamp(2.65rem, 7vw, 6.2rem); max-width: 16ch; margin: 0 0 1rem; }
  h2 { font-size: clamp(1.8rem, 4vw, 2.65rem); margin: 0 0 .7rem; }
  .lead { max-width: 52ch; color: #e4ddca; font-size: 1.15rem; }
  .timeline { margin-block: 2.5rem; padding: 0; list-style: none; border-top: 1px solid #635a47; }
  .timeline li { border-bottom: 1px solid #635a47; padding: clamp(1rem, 3vw, 1.65rem) 0; display: grid; gap: .3rem 1.5rem; grid-template-columns: minmax(13rem, 1fr) 1.4fr; align-items: baseline; }
  .timeline h2 a { text-decoration-thickness: 1px; }
  .timeline p { margin: 0; }
  .tag { color: #d2b994; font-size: .9rem; margin-bottom: .5rem; }
  .stations { list-style: none; padding: 0; display: grid; gap: .7rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); }
  .stations a { display: grid; gap: .2rem; height: 100%; padding: 1rem; border: 1px solid #635a47; background: #22251e; }
  .stations span { color: #ddd3bc; font-size: .92rem; }
  .station { display: grid; gap: 1.2rem; max-width: 54rem; }
  .station section { padding: 1.3rem; border: 1px solid #635a47; background: #22251e; }
  .station p { margin: .3rem 0 .85rem; }
  details { border-top: 1px solid #635a47; padding-top: .8rem; }
  summary { cursor: pointer; color: #f4ce91; }
  .nav { display: flex; flex-wrap: wrap; gap: 1rem 1.6rem; margin-block: 1.7rem; }
  footer { border-top: 1px solid #514d40; padding-block: 1.5rem; }
  .sources li { margin-block: .35rem; }
  @media(max-width: 42rem) { .timeline li { grid-template-columns: 1fr; } }
`;
const headers = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "public, max-age=120",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
};
const escape = (value) => String(value).replace(/[&<>"']/g, (c) =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
const eraUrl = (era) => `${root}/${era.id}/`;
const stationUrl = (era, station) => `${eraUrl(era)}${station.id}/`;
const anchor = (href, label) => `<a href="${escape(href)}">${escape(label)}</a>`;

function page(heading, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(heading)} · Tabor World</title><style>${styles}</style></head>
<body><header>${anchor("/", "Tabor World")}${anchor(`${root}/`, title)}${anchor("/learning-methods/", "101 Hands-On Learning Methods")}</header>
<main><h1>${escape(heading)}</h1>${body}</main><footer>${anchor(learningArc.academy, "Open the course in Tabor Academy")}</footer></body></html>`;
}

function overview() {
  return page(title, `<p class="lead">From earlier hominins and open-air sites through cave records, settlements, workshops and networks. Follow 48 stations across five overlapping learning eras, then test a future scenario.</p>
  <ol class="timeline">${learningArc.eras.map((era) => `<li><div><p class="tag">${escape(era.tag)}</p><h2>${anchor(eraUrl(era), era.title)}</h2></div><p>${escape(era.purpose)}</p></li>`).join("")}</ol>
  <section><h2>Explore the records</h2><ul class="sources">${learningArc.sources.map((source) => `<li>${anchor(source.url, source.name)}</li>`).join("")}</ul></section>`);
}

function showEra(era) {
  return page(era.title, `<p class="lead">${escape(era.purpose)}</p><ul class="stations">
  ${era.stations.map((station) => `<li><a href="${stationUrl(era, station)}">${escape(station.title)}<span>${escape(station.station)}</span></a></li>`).join("")}</ul>`);
}

function showStation(era, station, position) {
  const previous = era.stations[position - 1];
  const next = era.stations[position + 1];
  return page(station.title, `<p class="tag">${anchor(eraUrl(era), era.title)}</p>
  <article class="station"><section><h2>${escape(station.station)}</h2><p>${escape(station.question)}</p>
  <details><summary>Check what the evidence can show</summary><p>${escape(station.check)}</p></details></section>
  <p>${anchor(station.academy, "Do the exercise in Tabor Academy")}</p></article>
  <nav class="nav" aria-label="Station navigation">${previous ? anchor(stationUrl(era, previous), "Previous station") : ""}
  ${anchor(eraUrl(era), "All stations in this era")}
  ${next ? anchor(stationUrl(era, next), "Next station") : anchor(`${root}/`, "Return to the timeline")}</nav>`);
}

export function serveLearningArc(request) {
  const { pathname } = new URL(request.url);
  if (pathname !== root && !pathname.startsWith(root + "/")) return null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method unavailable", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const send = (body, status = 200, extra = {}) =>
    new Response(request.method === "HEAD" ? null : body, { status, headers: { ...headers, ...extra } });
  if (pathname === root + "/catalog.json") {
    return send(JSON.stringify(learningArc), 200, { "content-type": "application/json; charset=utf-8" });
  }
  const tail = pathname.slice(root.length).replace(/^\//, "").replace(/\/$/, "");
  if (!tail) return send(overview());
  const [eraId, stationId, ...extra] = tail.split("/");
  const era = learningArc.eras.find((candidate) => candidate.id === eraId);
  if (era && !extra.length) {
    if (stationId === undefined) return send(showEra(era));
    const position = era.stations.findIndex((candidate) => String(candidate.id) === stationId);
    if (position >= 0) return send(showStation(era, era.stations[position], position));
  }
  return send(page("Station not found", `<p>${anchor(`${root}/`, "Open the timeline")}</p>`), 404);
}

export function withLearningArc(original) {
  const link = {
    id: "complete-human-learning-arc", name: title, kind: "Interactive timeline", area: "Worlds",
    desc: "Explore early human evidence, the cave and open air, living traditions, machines, networks and possible futures.",
  };
  return {
    ...original,
    async fetch(request, env, ctx) {
      const arc = serveLearningArc(request);
      if (arc) return arc;
      const response = await original.fetch(request, env, ctx);
      if (!response.ok || request.method !== "GET") return response;
      const { pathname, origin } = new URL(request.url);
      const type = response.headers.get("content-type") ?? "";
      if (pathname === "/api/destinations" && type.includes("application/json")) {
        const existing = await response.clone().json().catch(() => null);
        if (!Array.isArray(existing) || existing.some((item) => item?.id === link.id)) return response;
        const next = new Headers(response.headers);
        next.delete("content-length");
        next.delete("etag");
        return new Response(JSON.stringify([...existing, { ...link, url: origin + root + "/" }]), {
          status: response.status, headers: next,
        });
      }
      if ((pathname === "/" || pathname === "/learning-methods/") && type.includes("text/html")) {
        let inserted = false;
        return new HTMLRewriter().on("h1", {
          element(element) {
            if (inserted) return;
            inserted = true;
            element.after(`<p data-human-learning-arc>${anchor(root + "/", title)}</p>`, { html: true });
          },
        }).transform(response);
      }
      return response;
    },
  };
}

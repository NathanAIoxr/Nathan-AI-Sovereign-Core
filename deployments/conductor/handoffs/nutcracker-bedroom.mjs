const root = "/tabor-sites/conductor";
const handoff = "/handoffs/nutcracker-bedroom";
const publicOrigin = "https://unified-operations-cockpit.nathantaboract.workers.dev";
const sitePrefix = publicOrigin + "/18-plus/bronze-hands/";

export const bedroomRelease = {
  project: "The Nathan Tabor Trinity of the Nutcracker",
  section: "The Bedroom",
  audience: "18+ only",
  materialDirection: "Matte silicone",
  historicalReference: "Clasped bronze hands",
  artwork: {
    published: "Silicone color and packaging study",
    pending: "Three distinct silicone product renderings"
  },
  source: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/476",
  sites: [
    { name: "King Solomon", url: sitePrefix + "king-solomon-bronze-hands/" },
    { name: "Cleopatra", url: sitePrefix + "cleopatra-bronze-hands/" },
    { name: "Virgin Mary", url: sitePrefix + "virgin-mary-bronze-hands/" }
  ]
};

export function serveNutcrackerBedroomHandoff(request, path) {
  if (![handoff, handoff + "/", "/api" + handoff].includes(path)) return null;
  const headers = {
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow"
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  if (path.startsWith("/api/")) {
    return new Response(request.method === "HEAD" ? null : JSON.stringify(bedroomRelease), {
      headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
    });
  }
  const links = bedroomRelease.sites.map(({ name, url }) =>
    `<li><a href="${url}">${name} · 18+</a></li>`).join("");
  const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nutcracker Bedroom Handoff · Nathan AI Conductor</title>
<style>body{margin:0;background:#161310;color:#f5ebdc;font:1.05rem/1.65 system-ui,sans-serif}main{width:min(42rem,calc(100% - 3rem));margin:4rem auto}h1{font:400 clamp(2.35rem,8vw,4rem)/1.05 Georgia,serif}a{color:#efbc89}li{margin:.5rem 0}</style>
</head><body><main>
<p><a href="${root}">The Conductor</a> · <a href="${root}/api${handoff}">JSON receipt</a></p>
<h1>${bedroomRelease.project}</h1>
<p>The Bedroom · 18+ only</p>
<p>Proposed material is matte silicone. The clasped bronze hands are the historical shape reference.</p>
<h2>Live concept pages</h2><ul>${links}</ul>
<p>The pages display the silicone color and packaging study. Three distinct silicone product renderings are pending.</p>
<p><a href="${bedroomRelease.source}">GitHub source and review</a></p>
</main></body></html>`;
  return new Response(request.method === "HEAD" ? null : page, {
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" }
  });
}

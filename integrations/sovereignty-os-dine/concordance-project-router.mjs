import concordance from "./concordance.mjs";

const projects = {
  "pumpkin-patch": "pumpkin-patch-ct-inc-total-os",
  "sovereignty-os-dine": "sovereignty-os-dine",
};

export default {
  ...concordance,
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const match = /^\/projects\/(pumpkin-patch|sovereignty-os-dine)(\/.*)?$/.exec(url.pathname);
    if (!match) return concordance.fetch(request, env, ctx);
    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405, headers: { allow: "GET" } });
    }
    if (!match[2]) {
      url.pathname += "/";
      return Response.redirect(url, 308);
    }
    url.pathname = match[2];
    try {
      return await env.PROJECTS.get(projects[match[1]]).fetch(new Request(url));
    } catch (error) {
      console.error(JSON.stringify({ event: "project_dispatch_failed", project: match[1], type: error.name }));
      return Response.json({ error: "Project temporarily unavailable" }, {
        status: 503, headers: { "cache-control": "no-store" },
      });
    }
  },
};

// MIT · source: https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/bulk-redirects.mdx
// License and copyright notices: ../licenses/cloudflare-docs.txt
// Adapted from the Cloudflare Workers bulk redirects example (MIT).
const redirectMap = new Map([["/bulk1", "/docs"], ["/bulk2", "/about"], ["/bulk3", "/status"]]);
export default {
  async fetch(request) {
    const requestURL = new URL(request.url);
    const path = requestURL.pathname;
    const location = redirectMap.get(path);
    if (location) return Response.redirect(new URL(location, requestURL.origin), 302);
    if (path === "/redirects") return Response.json(Object.fromEntries(redirectMap));
    if (["/docs", "/about", "/status"].includes(path)) return Response.json({ page: path.slice(1) });
    return new Response("Visit /redirects for the route map.", { status: path === "/" ? 200 : 404 });
  },
};

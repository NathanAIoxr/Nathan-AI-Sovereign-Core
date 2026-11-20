const path = "/big-bang";
const link = '<a data-academy-big-bang href="/tabor-academy/big-bang/">BIG BANG TIMES NATHAN TABOR</a>';
const navTargets = new Map([
  ["/", "main h1"],
  ["/map/", "main h1"],
  ["/truth-lab/", "main h1"],
  ["/minds/", "main nav"]
]);

export function connectBigBang(academy, assets, revision, homeMotto) {
  return {
    ...academy,
    async fetch(request, env, ctx) {
      const { pathname } = new URL(request.url);
      if (pathname === path || pathname.startsWith(path + "/")) {
        if (request.method !== "GET" && request.method !== "HEAD") {
          return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
        }
        if (pathname === path) return new Response(null, { status: 308, headers: { location: "./big-bang/" } });
        if (pathname === path + "/healthz") {
          const headers = { "cache-control": "no-store" };
          if (request.method === "HEAD") return new Response(null, { headers });
          return Response.json({
            service: "tabor-academy-big-bang", ready: true, revision,
            ok: true, project: "tabor-academy-big-bang", release: revision
          }, { headers });
        }
        const asset = assets[pathname.slice(path.length + 1)];
        if (!asset) return new Response("Page not found", { status: 404 });
        return new Response(request.method === "HEAD" ? null : asset.body, {
          headers: {
            "content-type": asset.type,
            "cache-control": "no-cache",
            "content-security-policy": asset.policy ?? "default-src 'none'; script-src 'self'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'",
            "x-content-type-options": "nosniff",
            "x-tabor-big-bang-revision": revision
          }
        });
      }

      const response = await academy.fetch(request, env, ctx);
      const selector = navTargets.get(pathname);
      if (!selector || request.method !== "GET" || !response.ok ||
          !response.headers.get("content-type")?.startsWith("text/html")) return response;

      let inserted = false;
      let hasMotto = false;
      const rewriter = new HTMLRewriter();
      if (pathname === "/") {
        rewriter.on('section[aria-label="Tabor Academy motto"]', { element() { hasMotto = true; } });
        rewriter.on("main", {
          element(element) {
            element.onEndTag(end => {
              if (!hasMotto) end.before(homeMotto, { html: true });
              hasMotto = true;
            });
          }
        });
      }
      return rewriter.on(selector, {
        element(element) {
          if (inserted) return;
          inserted = true;
          if (pathname === "/minds/") element.append(link, { html: true });
          else element.after("<p>" + link + "</p>", { html: true });
        }
      }).transform(response);
    }
  };
}

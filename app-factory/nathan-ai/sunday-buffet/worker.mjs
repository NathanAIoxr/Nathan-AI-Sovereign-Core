const baseHeaders = {
  "Content-Security-Policy": "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};

const APP_PATH = "/tabor-apps/sunday-buffet";
const canonical = new Set(["/app/", "/game/", "/book/"]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const head = request.method === "HEAD";
    if (request.method !== "GET" && !head) {
      return new Response("Method not allowed", { status: 405, headers: { ...baseHeaders, Allow: "GET, HEAD" } });
    }
    if (url.pathname === APP_PATH) {
      return new Response(null, { status: 308, headers: { ...baseHeaders, Location: APP_PATH + "/" + url.search } });
    }
    const path = url.pathname.startsWith(APP_PATH + "/") ? url.pathname.slice(APP_PATH.length) : url.pathname;
    if (canonical.has(path)) {
      return new Response(null, { status: 308, headers: { ...baseHeaders, Location: url.pathname.slice(0, -1) + url.search } });
    }

    if (path === "/api/edition") {
      const headers = { ...baseHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" };
      try {
        const edition = await env.VAULT.prepare("SELECT title, version, sha256, published_at FROM public_editions WHERE id = ?")
          .bind("sunday-buffet-1.0.0").first();
        if (edition) return new Response(head ? null : JSON.stringify(edition), { headers });
      } catch (error) {
        console.error("Edition lookup failed", error);
      }
      return new Response(head ? null : JSON.stringify({ error: "Edition unavailable" }), { status: 503, headers });
    }

    if (!Object.hasOwn(assets, path)) {
      return new Response(head ? null : "Page not found", { status: 404, headers: baseHeaders });
    }
    const asset = assets[path];
    const headers = {
      ...baseHeaders,
      "Content-Type": asset.type,
      "Cache-Control": path === "/sw.js" ? "no-cache" : "public, max-age=300",
      "ETag": '"' + asset.digest + '"'
    };
    if (path === "/book.pdf") headers["Content-Disposition"] = 'inline; filename="Sunday-Buffet-Slam-Down.pdf"';
    if (request.headers.get("If-None-Match") === headers.ETag) return new Response(null, { status: 304, headers });
    const body = head ? null : Uint8Array.from(atob(asset.content), (character) => character.charCodeAt(0));
    return new Response(body, { headers });
  }
};

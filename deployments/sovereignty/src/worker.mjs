const prefix = "/tabor-sites/sovereignty";
const headers = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    const path = pathname === prefix || pathname.startsWith(prefix + "/")
      ? pathname.slice(prefix.length) || "/"
      : pathname;
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
    }
    if (path === "/health") {
      const body = { service: "nathan-ai-sovereignty-box", status: "ok", release: env.RELEASE_SHA ?? "local" };
      return new Response(request.method === "HEAD" ? null : JSON.stringify(body), {
        headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
      });
    }
    if (!Object.hasOwn(assets, path)) return new Response("Not found", { status: 404, headers });
    const { type, body } = assets[path];
    return new Response(request.method === "HEAD" ? null : body, {
      headers: { ...headers, "Content-Type": type },
    });
  },
};

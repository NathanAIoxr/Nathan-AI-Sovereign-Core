const headers = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

export function serve(request, site) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  const head = request.method === "HEAD";
  const url = new URL(request.url);
  const mount = "/tabor-apps/assessment-studio";
  if (url.pathname === mount) {
    url.pathname += "/";
    return Response.redirect(url, 308);
  }
  const pathname = url.pathname.startsWith(mount + "/") ? url.pathname.slice(mount.length) : url.pathname;
  if (pathname === "/healthz") {
    const body = { ok: true, site: site.id, release: site.release };
    return new Response(head ? null : JSON.stringify(body), {
      headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const path = pathname === "/" ? "/index.html" : pathname;
  if (!Object.hasOwn(site.assets, path)) return new Response(head ? null : "Page not found", { status: 404, headers });
  const asset = site.assets[path];
  const responseHeaders = { ...headers, "Content-Type": asset.type, "Cache-Control": "no-cache", ETag: asset.etag };
  if (request.headers.get("If-None-Match") === asset.etag) return new Response(null, { status: 304, headers: responseHeaders });
  const body = head ? null : Uint8Array.from(atob(asset.body), char => char.charCodeAt(0));
  return new Response(body, { headers: responseHeaders });
}

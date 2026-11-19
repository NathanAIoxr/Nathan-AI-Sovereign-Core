const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; worker-src 'self'; manifest-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};
const methods = ["GET", "HEAD"];

export function serve(request, site) {
  const head = request.method === "HEAD";
  const response = (body, status, headers) => new Response(head ? null : body, { status, headers: { ...security, ...headers } });
  if (!methods.includes(request.method)) return response("Method not allowed", 405, { Allow: methods.join(", ") });
  const url = new URL(request.url);
  const mount = "/tabor-apps/" + site.id;
  if (url.pathname === mount) {
    url.pathname += "/";
    return Response.redirect(url, 308);
  }
  const path = url.pathname.startsWith(mount + "/") ? url.pathname.slice(mount.length) : url.pathname;
  const json = (value, status = 200, headers = {}) => response(JSON.stringify(value), status, {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers,
  });
  if (path === "/healthz") return json({ ok: true, site: site.id, release: site.release });
  if (path === "/api/lexicon" && site.id === "alphabet-sdk") {
    const letter = (url.searchParams.get("letter") || "").toUpperCase();
    const query = url.searchParams.get("q") || "";
    const cors = { "Access-Control-Allow-Origin": "*" };
    if ((letter && !["A", "B", "C", "T", "V"].includes(letter)) || query.length > 100) {
      return json({ error: "Use letter A, B, C, T, or V and a query up to 100 characters." }, 400, cors);
    }
    const entries = queryEntries(site.records, query, letter);
    return json({ version: 1, entries }, 200, cors);
  }
  const asset = site.assets[path === "/" ? "/index.html" : path];
  if (!asset) return response("Page not found", 404, {});
  const headers = { "Content-Type": asset.type, "Cache-Control": "no-cache", ETag: asset.etag };
  const match = request.headers.get("If-None-Match")?.split(",").map(tag => tag.trim().replace(/^W\//, ""));
  if (match?.some(tag => tag === "*" || tag === asset.etag)) return response(null, 304, headers);
  return response(head ? null : Uint8Array.from(atob(asset.body), char => char.charCodeAt(0)), 200, headers);
}

const headers = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
};

function decode(body) {
  return Uint8Array.from(atob(body), char => char.charCodeAt(0));
}

export function serve(request, site) {
  const { pathname } = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  const head = request.method === "HEAD";
  if (pathname === "/healthz") {
    const payload = { ok: true, site: site.id, worker: site.worker, release: site.release, files: Object.keys(site.assets).length };
    return new Response(head ? null : JSON.stringify(payload), {
      headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const path = pathname === "/" ? "/index.html" : pathname;
  if (!Object.hasOwn(site.assets, path)) {
    return new Response(head ? null : "Page not found", { status: 404, headers });
  }
  const asset = site.assets[path];
  const responseHeaders = {
    ...headers,
    "Content-Type": asset.type,
    ETag: asset.etag,
    "Cache-Control": path.endsWith(".html") ? "no-cache" : "public, max-age=300",
  };
  if (request.headers.get("If-None-Match") === asset.etag) {
    return new Response(null, { status: 304, headers: responseHeaders });
  }
  const body = head ? null : decode(asset.body);
  return new Response(body, { headers: responseHeaders });
}

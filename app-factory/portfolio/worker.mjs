const aliases = new Map([
  ["/", "/index.html"],
  ["/api/catalog", "/catalog.json"],
  ["/api/progress", "/progress.json"],
]);

const policy = {
  "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

export function createWorker(files, source) {
  return {
    async fetch(request) {
      const respond = (body, status = 200, headers = {}) => new Response(request.method === "HEAD" ? null : body, {
        status, headers: {"cache-control":"no-store", ...policy, ...headers},
      });
      if (request.method !== "GET" && request.method !== "HEAD") {
        return respond("Method not allowed", 405, {"allow":"GET, HEAD"});
      }
      const path = new URL(request.url).pathname;
      if (path === "/docs/record/index.html") {
        return respond(null, 302, {"location":"https://nathanaiOxr.github.io/Nathan-AI-Sovereign-Core/docs/record/index.html"});
      }
      if (path === "/api/health") {
        return respond(JSON.stringify({status:"ok", service:"tabor-app-portfolio", source, bundledFiles:files.size}),
          200, {"content-type":"application/json; charset=utf-8"});
      }
      const asset = files.get(aliases.get(path) ?? path);
      if (!asset) return respond("Page not found", 404);
      const headers = {"content-type":asset.type, "cache-control":"public, max-age=300", "etag":asset.etag};
      if (request.headers.get("if-none-match") === asset.etag) return respond(null, 304, headers);
      if (request.method === "HEAD") return respond(null, 200, headers);
      const bytes = Uint8Array.from(atob(asset.gzip), char => char.charCodeAt(0));
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return respond(stream, 200, headers);
    },
  };
}

const origin = "https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const assets = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/style.css", ["style.css", "text/css; charset=utf-8"]],
  ["/app.mjs", ["app.mjs", "application/javascript; charset=utf-8"]],
  ["/assets/tabor-world.webp", ["assets/tabor-world.webp", "image/webp"]],
  ["/catalog.json", ["catalog.json", "application/json; charset=utf-8"]],
  ["/api/catalog", ["catalog.json", "application/json; charset=utf-8"]],
  ["/progress.json", ["progress.json", "application/json; charset=utf-8"]],
  ["/api/progress", ["progress.json", "application/json; charset=utf-8"]],
]);

const policy = {
  "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

function respond(request, body, status = 200, headers = {}) {
  return new Response(request.method === "HEAD" ? null : body, {
    status, headers: {"cache-control":"no-store", ...policy, ...headers},
  });
}

export function createWorker(originFetch = fetch) {
  return {
    async fetch(request, env) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return respond(request, "Method not allowed", 405, {"allow":"GET, HEAD"});
      }
      const path = new URL(request.url).pathname;
      if (path === "/docs/record/index.html") {
        return respond(request, null, 302, {
          "location":"https://nathanaiOxr.github.io/Nathan-AI-Sovereign-Core/docs/record/index.html",
        });
      }
      const health = path === "/api/health";
      const asset = assets.get(health ? "/api/catalog" : path);
      if (!asset) return respond(request, "Page not found", 404);
      const snapshot = env.PORTFOLIO_SOURCE;
      if (typeof snapshot !== "string" || !/^[0-9a-f]{40}$/.test(snapshot)) {
        return respond(request, "Portfolio source is unavailable", 503);
      }

      const [file, type] = asset;
      const target = origin + "/" + snapshot + "/app-factory/portfolio/" + file;
      let result;
      try {
        result = await originFetch(target, {
          method: health ? "HEAD" : request.method,
          redirect: "error",
          cf: {cacheEverything:true, cacheTtlByStatus:{"200-299":86400,"400-599":0}},
        });
      } catch {
        return respond(request, "Portfolio source is temporarily unavailable", 502);
      }
      if (!result.ok) return respond(request, "Portfolio source is temporarily unavailable", 502);
      if (health) {
        return respond(request, JSON.stringify({status:"ok", service:"tabor-app-portfolio", source:snapshot}), 200,
          {"content-type":"application/json; charset=utf-8"});
      }

      return respond(request, result.body, 200, {
        "content-type":type, "cache-control":"public, max-age=300",
        ...(result.headers.has("etag") ? {"etag":result.headers.get("etag")} : {}),
      });
    },
  };
}

export default createWorker();

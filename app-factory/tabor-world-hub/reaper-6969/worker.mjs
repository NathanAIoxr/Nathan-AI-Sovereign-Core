import { runModel } from "./lab.mjs";
import { css } from "./style.mjs";
import { overview, archivePage, labPage, downloadsPage, githubURL } from "./view.mjs";

const headers = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};

export function createApp(files) {
  const archive = new Map(files.map(file => ["/downloads/" + encodeURIComponent(file.filename), file]));
  const report = files.find(file => file.filename === "Reaper_6969_Recovery.md");
  const manifest = files.map(({ filename, title, bytes, sha256 }) => ({ filename, title, bytes, sha256 }));

  return {
    fetch(request, env, ctx) {
      const respond = (body, contentType, status = 200, extra = {}) => new Response(
        request.method === "HEAD" ? null : body, { status, headers: { ...headers, "Content-Type": contentType, ...extra } }
      );
      const json = (data, status) => respond(JSON.stringify(data), "application/json; charset=utf-8", status);
      const html = (data, status) => respond(data, "text/html; charset=utf-8", status);

      // Cloudflare supplies this context after validating the incoming Access application token.
      if (!env.REAPER_ACCESS_AUD || ctx?.access?.aud !== env.REAPER_ACCESS_AUD) {
        return json({ error: "Cloudflare Access sign-in required." }, 403);
      }
      if (!["GET", "HEAD"].includes(request.method)) {
        return respond("Method not allowed", "text/plain; charset=utf-8", 405, { Allow: "GET, HEAD" });
      }

      const { pathname: path, searchParams: params } = new URL(request.url);
      const sha = env.REAPER_GITHUB_SHA;
      const file = archive.get(path);
      if (file) return respond(file.content, file.type, 200, {
        "Content-Disposition": 'attachment; filename="' + file.filename + '"',
        "Content-Length": String(file.bytes)
      });
      if (path === "/") return html(overview(sha));
      if (path === "/workbench.css") return respond(css, "text/css; charset=utf-8");
      if (path === "/archive") return report ? html(archivePage(report.content, sha)) : json({ error: "Archive unavailable" }, 503);
      if (path === "/downloads") return html(downloadsPage(files, sha));
      if (path === "/healthz") return json({ ok: Boolean(report), project: "Reaper 6969", revision: sha ?? null }, report ? 200 : 503);
      if (path === "/api/manifest") return json({ project: "Reaper 6969", revision: sha ?? null, github: githubURL(sha), files: manifest });

      if (path === "/lab" || path === "/api/lab") {
        const id = params.get("model");
        if (path === "/lab" && id === null) return html(labPage(null, params, null, null, sha));
        try {
          const result = runModel(id, params);
          return path === "/api/lab" ? json(result) : html(labPage(id, params, result, null, sha));
        } catch (error) {
          if (!(error instanceof RangeError)) throw error;
          return path === "/api/lab" ? json({ error: error.message }, 400) :
            html(labPage(id, params, null, error.message, sha), 400);
        }
      }
      return json({ error: "Page not found" }, 404);
    }
  };
}

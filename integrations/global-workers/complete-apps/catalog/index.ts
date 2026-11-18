/**
 * Derived from the Cloudflare D1 starter, MIT.
 * Source https://github.com/cloudflare/templates/tree/1fa42412fd36fd4f265383493f3e548f66e39c5d/d1-template
 */
const escapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => escapes[character]);
}

type ImportedWorker = { name: string; title: string; source_url: string; endpoint: string };

export default {
  async fetch(request: Request, env: { DB: D1Database }) {
    const path = new URL(request.url).pathname;
    if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });
    if (path !== "/" && path !== "/api/workers") return new Response("Not found", { status: 404 });
    const { results } = await env.DB.prepare(
      "SELECT name, title, source_url, endpoint FROM imported_workers ORDER BY title, name LIMIT 100",
    ).all<ImportedWorker>();
    if (path === "/api/workers") return Response.json({ count: results.length, workers: results });
    const rows = results.map((row) => `<li><h2>${escapeHtml(row.title)}</h2>
      <a href="${escapeHtml(row.endpoint)}">Open Worker</a> <a href="${escapeHtml(row.source_url)}">Upstream source</a></li>`).join("");
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Tabor Worker Import Catalog</title><style>
      body{margin:auto;max-width:51rem;padding:1.25rem;font:1rem/1.6 system-ui;color:#1d2925;background:#f8f6ef}
      h1{font:2.25rem Georgia,serif;margin-bottom:.4rem} h2{font-size:1.13rem;margin:.2rem 0}
      ul{padding:0;list-style:none} li{padding:.8rem 0;border-top:1px solid #c5ccc5}
      li a{margin-right:1rem}a{color:#164b45}
      </style><main><h1>Tabor Worker Import Catalog</h1><p>${results.length} verified imports</p><ul>${rows}</ul></main></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8",
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
          "X-Content-Type-Options": "nosniff" } });
  },
};

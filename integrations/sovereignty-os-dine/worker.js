// Read-only deployment of the Sovereignty OS Diné seed registry.
const headers = {
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
};
const json = (body, status = 200, extra = {}) => Response.json(body, {
  status,
  headers: { ...headers, ...extra },
});

const homepage = "<!doctype html>\n<html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Sovereignty OS | Diné Living Universe and Tabor Earth</title>\n<style>body{font:16px/1.65 system-ui,sans-serif;max-width:55rem;margin:3rem auto;padding:0 1.25rem;color:#182c24;background:#f7f6ee}h1{font-size:clamp(2rem,6vw,3.25rem);line-height:1.12}a{color:#23563f}li{margin:.4rem 0}</style>\n<main><h1>Sovereignty OS</h1><h2>Diné Living Universe and Tabor Earth</h2>\n<p>Bedrock to Vine. Browse the source records and calculated antipodes. The concordance includes the author’s hypotheses and wordplay.</p>\n<ul>\n<li><a href=\"api/records/landmarks\">Landmarks</a></li>\n<li><a href=\"api/records/submerged_lands\">Submerged lands</a></li>\n<li><a href=\"api/records/linguistic_concordance\">Linguistic concordance</a></li>\n<li><a href=\"api/records/three_sisters_agronomy\">Three Sisters agronomy</a></li>\n<li><a href=\"api/records/ke_clans\">Kʼé clans</a></li>\n<li><a href=\"api/records/dine_lunar_months\">Diné months</a></li>\n<li><a href=\"api/records/community_projects\">Community projects</a></li>\n<li><a href=\"api/records/system_meta\">Bedrock-to-Vine framework</a></li>\n</ul><p><a href=\"api/sections\">Live record counts</a></p></main></html>";
const sourceId = "attachment-sha256-d270adf653fc52601daae3a6ee074b0f64a935aeb275bfd49da98ac73be27973";
const sections = new Set([
  "landmarks", "submerged_lands", "linguistic_concordance", "three_sisters_agronomy",
  "ke_clans", "dine_lunar_months", "community_projects", "system_meta",
]);

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, { allow: "GET" });
    if (pathname === "/") {
      return new Response(homepage, { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
    }
    if (pathname === "/health") {
      return json({ ok: true, service: "sovereignty-os-dine", mode: "read-only" });
    }
    try {
      if (pathname === "/api/sections") {
        const { results } = await env.DB.prepare(
          "SELECT section, COUNT(*) AS count FROM sovereignty_dine_records WHERE source_id = ? GROUP BY section ORDER BY section"
        ).bind(sourceId).all();
        return json({ count: results.reduce((sum, row) => sum + row.count, 0), sections: results });
      }
      const prefix = "/api/records/";
      const section = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : "";
      if (!sections.has(section)) return json({ error: "Not found" }, 404);
      const { results } = await env.DB.prepare(
        "SELECT record_id, content_status, payload_json FROM sovereignty_dine_records " +
        "WHERE source_id = ? AND section = ? ORDER BY ordinal"
      ).bind(sourceId, section).all();
      const records = results.map(row => ({
        id: row.record_id, status: row.content_status, data: JSON.parse(row.payload_json),
      }));
      return json({ section, count: records.length, records });
    } catch (error) {
      console.error(JSON.stringify({ event: "registry_read_failed", type: error.name }));
      return json({ error: "Registry temporarily unavailable" }, 503);
    }
  },
};

// Read-only deployment of the Pumpkin Patch / CT Inc. frontend and catalog.
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

const homepage = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"theme-color\" content=\"#D95D1E\"><title>Pumpkin Patch Community OS</title><style>body{font:16px system-ui,sans-serif;max-width:850px;margin:auto;padding:1.4rem;line-height:1.6}nav{display:flex;gap:1rem;flex-wrap:wrap}a{color:#87400a}section{border:1px solid #ddd;border-radius:12px;padding:1rem;margin-top:1rem}button{font:inherit;padding:.6rem}</style></head><body><header><h1>Pumpkin Patch Community OS</h1><p>Collyn Tabor’s year-round school, church, and nonprofit fundraiser preview</p></header><nav aria-label=\"Sections\"><a href=\"#store\">Store</a><a href=\"#giving\">Giving</a><a href=\"#community\">Community</a><a href=\"#apps\">Optional apps</a><a href=\"api/public/catalog\">Fundraiser catalog (JSON)</a></nav><main><section id=\"store\"><h2>Fundraising & Church Supplies</h2><p>Pumpkin lots, seasonal truck drops, take-home catalogs and Sunday school supplies. Pricing and church benefit percentages require approval.</p></section><section id=\"giving\"><h2>Giving</h2><p>Example: $10.00 monthly gift; fee coverage $0.00 by default. No donation is processed in this preview.</p><p>Giving must show its recipient, frequency, payment method, and explicit confirmation before activation. Pause, edit and cancel must remain visible after activation.</p></section><section id=\"community\"><h2>Community Care</h2><p>Groceries, meals, rides and volunteer opportunities. Personal details are not published without consent.</p></section><section id=\"apps\"><h2>Optional white-label apps</h2><p>Church operations, adults-only singles, care, youth games, study, blessing store and delivery/kiosk. Organizations choose modules individually.</p></section></main><footer><p>Read-only fundraiser preview. Payment, donor, and messaging features are offline.</p></footer></body></html>";
const sourceId = "attachment-sha256-c53e70468cfad4bb266eb7b42d6ea222e54adc433651703748fa5d30cc6116ff";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, { allow: "GET" });
    if (pathname === "/" || pathname === "/total-os-index.html") {
      return new Response(homepage, { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
    }
    if (pathname === "/health") {
      return json({ ok: true, service: "pumpkin-patch-ct-inc-total-os", mode: "read-only" });
    }
    if (pathname !== "/api/public/catalog") return json({ error: "Not found" }, 404);
    try {
      const { results } = await env.DB.prepare(
        "SELECT idea_id, title, category, description, decision, implementation_status " +
        "FROM pp_opportunity_ideas WHERE source_id = ? ORDER BY category, idea_id"
      ).bind(sourceId).all();
      return json({ count: results.length, catalog: results, source: "d1" });
    } catch (error) {
      console.error(JSON.stringify({ event: "catalog_read_failed", type: error.name }));
      return json({ error: "Catalog temporarily unavailable" }, 503);
    }
  },
};

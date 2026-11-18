import manifest from "./manifest.json" with { type: "json" };

const registry = {
  ...manifest,
  source: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/feature/tabor-worker-101-import/integrations/tabor-worker-101",
};

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD" } });
    }
    const { pathname } = new URL(request.url);
    const health = {
      service: "tabor-worker-101-registry",
      status: "ok",
      candidates: registry.totals.entries,
      deployed_upstreams: registry.entries.filter(entry => entry.worker?.kind === "upstream_template").length,
      ...registry.totals,
    };
    const payload = pathname === "/health" ? health : pathname === "/registry" ? registry : null;
    if (!payload) return new Response("Not Found", { status: 404 });
    const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
    return new Response(request.method === "HEAD" ? null : JSON.stringify(payload), { headers });
  },
};

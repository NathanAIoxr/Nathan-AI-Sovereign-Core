const handoff = {
  project: "nathan-ai-sovereign-engine",
  title: "Nathan AI Full-Spectrum Autonomous Sovereign Engine",
  doors: [
    { name: "The Immune System & CI Reflex", entry: "GitHub Actions CI triage artifacts" },
    { name: "The Storage & Ledger Governor", entry: "Two D1 shards and private R2 overflow" },
    { name: "The Logic & Forging Gate", entry: "Local leased intake and the Conductor Lasso release gate" },
    { name: "The Sensory & Swarm Edge", entry: "Hop In and Voice Box file intake with SHA-256 receipts" },
  ],
  health: "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/sovereign-engine/health",
  artifactScrollLedger: { health: "/tabor-sites/conductor/api/artifact-scroll/health", ingest: "/tabor-sites/conductor/api/artifact-scroll/ingest", query: "/tabor-sites/conductor/api/artifact-scroll/ledger", anchor: "AA55FF01312B313D327E312D313D300400F0" },
  nodeContract: "/tabor-sites/conductor/api/node-template/contract",
  source: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/deployments/conductor/sovereign-engine",
};

export function serveSovereignEngineHandoff(request, path) {
  if (request.method !== "GET" || path !== "/api/handoffs/sovereign-engine") return undefined;
  return Response.json(handoff, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

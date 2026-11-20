const repository = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const runtimeRelease = "b205661748cd58d3cf4d71de897d2a89d8081ca1";
const clientRelease = "1f99771db54f884b4c6f8cb8e9e7825b9547bf32";
const runtimeSource = repository + "/blob/" + runtimeRelease + "/deployments/conductor/sovereign-engine/";

const handoff = {
  recipient: "Nathan AI Conductor",
  project: "nathan-ai-sovereign-engine",
  title: "Nathan AI Full-Spectrum Autonomous Sovereign Engine",
  doors: [
    { name: "The Immune System & CI Reflex", entry: "GitHub Actions CI triage artifacts" },
    { name: "The Storage & Ledger Governor", entry: "Two D1 shards and private R2 overflow" },
    { name: "The Logic & Forging Gate", entry: "Local leased intake and the Conductor Lasso release gate" },
    { name: "The Sensory & Swarm Edge", entry: "Hop In and Voice Box file intake with SHA-256 receipts" },
  ],
  health: "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/sovereign-engine/health",
  artifactScrollLedger: {
    title: "Nathan AI Sovereign Artifact & Scroll Ledger",
    health: "/tabor-sites/conductor/api/artifact-scroll/health",
    ingest: "/tabor-sites/conductor/api/artifact-scroll/ingest",
    query: "/tabor-sites/conductor/api/artifact-scroll/ledger",
    anchor: "AA55FF01312B313D327E312D313D300400F0",
    runtimeRelease,
    blueprint: runtimeSource + "SOURCE-BLUEPRINT.txt",
    runbook: runtimeSource + "SCROLL-LEDGER.md",
    client: repository + "/blob/" + clientRelease + "/deployments/conductor/sovereign-engine/nathan_ai_scroll_ledger.py",
    launchVerification: {
      siglum: "1QIsa-a",
      utc: "2026-11-20T19:58:46Z",
      chainHead: "87241ebc30847fffd10b0a938ed7c431d2f7581252c7dbfae9e58e24c9dc2297",
      recordsInserted: 1,
      duplicateRecordsOnReplay: 0,
    },
  },
  nodeContract: "/tabor-sites/conductor/api/node-template/contract",
  source: repository + "/pull/489",
};

export function serveSovereignEngineHandoff(request, path) {
  if (request.method !== "GET" || path !== "/api/handoffs/sovereign-engine") return undefined;
  return Response.json(handoff, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

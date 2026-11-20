import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const base = "https://tabor-bridge.nathantaboract.workers.dev/rocket-conductor/";
async function get(path) {
  const response = await fetch(new URL(path, base), { redirect: "error", signal: AbortSignal.timeout(15_000) });
  assert.equal(response.status, 200, path + " response");
  return response.json();
}
const [policy, health, report] = await Promise.all([
  readFile(new URL("bitcoin-fleet-policy.json", import.meta.url)),
  get("health"),
  get("api/status"),
]);
assert.equal(health.conductor, "Nathan AI Rocket 🚀");
assert.match(health.release, /^[a-f0-9]{40}$/);
assert.equal(report.conductor, health.conductor);
assert.equal(report.observed.github.sha256, createHash("sha256").update(policy).digest("hex"));
for (const source of ["github", "cloudflare", "bitcoin", "goldenGoose", "fleet"]) {
  assert.equal(report.observed[source]?.ok, true, source + " integration check");
}
assert.match(report.observed.bitcoin.blockHash, /^[a-f0-9]{64}$/);
console.log(JSON.stringify({
  conductor: health.conductor, release: health.release,
  cloudflareConductor: report.observed.cloudflare.release,
  policySha256: report.observed.github.sha256,
  bitcoinHeaderHash: report.observed.bitcoin.blockHash,
  mining: report.mining.state,
  observedAt: report.observedAt,
}, null, 2));

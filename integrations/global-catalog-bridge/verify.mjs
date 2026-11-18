// Read-only GitHub <-> Cloudflare catalog reconciliation.
// Run with: node integrations/global-catalog-bridge/verify.mjs
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const file = new URL("../../app-factory/nathan-ai/global-infrastructure-atlas/public-github-discovery-205.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
const expected = [...new Set(data.entries.map((entry) => entry.repository))].sort();
assert.equal(expected.length, data.count, "GitHub mirror contains duplicates or missing identifiers");
const origin = process.env.GLOBAL_CATALOG_URL || "https://nathan-ai-global-catalog-bridge.nathantaboract.workers.dev";
const get = async (path) => {
  const res = await fetch(origin + path, {headers: {accept:"application/json"}, signal:AbortSignal.timeout(15000)});
  if (!res.ok) throw new Error(`Cloudflare bridge returned HTTP ${res.status} for ${path}`);
  return res.json();
};
const summary = await get("/api/summary");
assert.equal(summary.totals.public_repositories, expected.length);
const actual=[];
for (let offset=0; offset<expected.length; offset+=100) {
  const page=await get(`/api/repos?limit=100&offset=${offset}`);
  actual.push(...page.items.map((item)=>item.repo));
}
actual.sort();
assert.deepEqual(actual, expected, "Cloudflare D1 and GitHub mirror differ");
console.log(`PASS: ${actual.length} matching GitHub and Cloudflare public repository references; no third-party programs were installed.`);

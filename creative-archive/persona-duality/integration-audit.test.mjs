import test from "node:test";
import assert from "node:assert/strict";
import { INTEGRATIONS } from "./registry.mjs";
import { auditReferences, auditGraph } from "./integration-audit.mjs";

test("PD-012 references preserve six known read-only connections", () => {
  const result = auditReferences();
  assert.equal(result.ok, true, result.failures.join(", "));
  assert.equal(result.total, 6);
  assert.equal(result.checked_repository_paths.length, 3);
  assert.equal(result.declared_cloudflare_scripts.length, 3);
  assert.equal(result.remote_access_performed, false);
  assert.equal(result.repository_paths_verified_live, false);
  assert.equal(result.cloudflare_scripts_verified_live, false);
});
test("PD-012 refuses write-enabled, invented, or secret-bearing integration metadata", () => {
  for (const replacement of [
    { ...INTEGRATIONS[0], mode:"write" },
    { ...INTEGRATIONS[0], value:"https://unknown.invalid" },
    { ...INTEGRATIONS[0], token:"do-not-store" },
    { ...INTEGRATIONS[0], type:"external_api" }
  ]) {
    const modified = INTEGRATIONS.map((x,i)=>i===0?replacement:x);
    assert.equal(auditReferences(modified).ok,false);
  }
});
test("PD-012 reports missing and duplicated connections without guessing replacements", () => {
  assert.equal(auditReferences(INTEGRATIONS.slice(1)).ok,false);
  assert.equal(auditReferences([...INTEGRATIONS,INTEGRATIONS[0]]).ok,false);
});
test("PD-012 graph audit does not turn review rotations into completed development", () => {
  const g = auditGraph();
  assert.equal(g.missing_endpoints,0);
  assert.equal(g.completed_tasks_claimed,0);
  assert.equal(g.backlog,14);
});

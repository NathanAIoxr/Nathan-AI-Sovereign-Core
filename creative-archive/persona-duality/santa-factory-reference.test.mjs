import test from "node:test";
import assert from "node:assert/strict";
import { santaFactoryReference } from "./santa-factory-reference.mjs";
import { TASKS } from "./registry.mjs";

test("PD-009 remains in the 14-item review backlog", () => {
  assert.equal(TASKS.length, 14);
  assert.equal(TASKS.find(t => t.id === "PD-009")?.status, "pending_review");
});
test("Santa Factory integration is strictly a source reference", () => {
  const ref = santaFactoryReference();
  assert.equal(ref.source_path, "app-factory/sites/santa-claus-factory");
  assert.deepEqual(ref.allowed_operations, ["read"]);
  assert.equal(ref.mode, "reference_only");
});
test("No execution or publication is represented by the reference", () => {
  const ref = santaFactoryReference();
  assert.equal(ref.external_dispatch, false);
  assert.equal(ref.deployment_requested, false);
  assert.equal(ref.status, "review_only_not_connected");
  assert.equal(ref.persona_id, "santa");
});

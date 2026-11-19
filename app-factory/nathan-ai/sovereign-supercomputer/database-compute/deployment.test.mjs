import assert from "node:assert/strict";
import test from "node:test";
import { deployment } from "./deployment.mjs";

const sample = Array.from({ length: 55 }, (_, i) => ({
  name: "db-" + i,
  uuid: "aaaabbbb-cccc-dddd-eeee-" + String(i).padStart(12, "0"),
}));

test("assigns two slots per database in each pool and stages both at zero", () => {
  const layout = deployment(sample);
  assert.equal(layout.worker.bindings.filter(binding => binding.type === "d1").length, 55);
  assert.deepEqual(layout.apps.map(pool => [pool.configuration.instance_type, pool.instances, pool.max_instances]), [
    ["standard-2", 0, 110],
    ["standard-4", 0, 110],
  ]);
  assert.deepEqual(layout.worker.containers.map(pool => pool.class_name), layout.initialMigration.steps[0].new_sqlite_classes);
});

test("rejects a duplicate database or invalid provider identifier", () => {
  assert.throws(() => deployment([sample[0], sample[0]]), /unique/);
  assert.throws(() => deployment([{ name: "test", uuid: "bad" }]), /unique/);
});

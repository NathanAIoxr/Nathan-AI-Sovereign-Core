import { test } from "node:test";
import assert from "node:assert/strict";
import { projectNamespace, validateProjects } from "./reconcile.mjs";
import worker from "./worker.mjs";

test("staging project names cannot escape the resource prefix or duplicate a Zone", () => {
  for (const projects of [["../main"], ["abc", "abc"], ["A"], [], ["a".repeat(53)]]) {
    assert.throws(() => validateProjects(projects), /Invalid Zone project registry/);
  }
  assert.doesNotThrow(() => validateProjects(["tap-that-arcade"]));
  assert.doesNotThrow(() => validateProjects(Array.from({ length: 65 }, (_, i) => "project-" + i)));
  assert.equal(projectNamespace("tap-that-arcade"), "tap-that-arcade-holding");
  assert.notEqual(projectNamespace("tap-that-arcade"), projectNamespace("tap-that-command-center"));
  assert.throws(() => projectNamespace("../main"), /Invalid Zone project registry/);
});

test("the holding Worker checks the isolated D1 identity and exposes only health", async () => {
  const health = new Request("https://private.invalid/health");
  const env = {
    ZONE_PROJECT: "tap-that-arcade",
    ZONE_RELEASE: "digest",
    DB: { prepare: () => ({ bind: () => ({ first: async () =>
      ({ project: "tap-that-arcade", phase: "REHEARSAL" }) }) }) }
  };
  assert.deepEqual(await (await worker.fetch(health, env)).json(), {
    project: "tap-that-arcade", phase: "REHEARSAL", release: "digest"
  });
  assert.equal((await worker.fetch(health, { ...env, ZONE_PROJECT: "other" })).status, 503);
  assert.equal((await worker.fetch(new Request(health.url, { method: "POST" }), env)).status, 404);
});

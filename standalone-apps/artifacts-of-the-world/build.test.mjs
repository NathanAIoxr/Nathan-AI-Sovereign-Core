import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { apps, assignments, build, original, scopeDossier } from "./build.mjs";

test("the original remains byte-identical and the catalog keeps the count provisional", async () => {
  const { app, worker } = await build("catalog");
  const { default: service } = await import("data:text/javascript;base64," + Buffer.from(worker).toString("base64"));
  const response = await service.fetch(new Request(app.origin + "/original.txt"));
  assert.equal(await response.text(), original);
  assert.equal(createHash("sha256").update(original).digest("hex"), "6ccb5c53df786272306976fd6ca3637ae2581e3f721aaff215a0e593e0ceee76");
  const index = await service.fetch(new Request(app.origin + "/api/catalog")).json();
  assert.deepEqual(index.artifactCount, { provisional: 16, named: 4, scope: "unresolved" });
  assert.equal(index.artifactRegister.filter(entry => entry.id === null).length, 12);
  assert.equal(index.assignments, "/api/assignments");
  const board = await service.fetch(new Request(app.origin + index.assignments)).json();
  assert.deepEqual(board, assignments);
  assert.equal(new Set(Object.values(board.projects).map(job => job.priority)).size, apps.length);
  assert.deepEqual(index.apps.map(entry => entry.id), apps.slice(1).map(entry => entry.id));
  const html = await service.fetch(new Request(app.origin)).text();
  for (const dossier of apps.slice(1)) assert.ok(html.includes(dossier.origin), dossier.id);
});

test("each dossier serves independently and returns only its own record", async () => {
  assert.equal(new Set(apps.map(app => app.origin)).size, apps.length);
  for (const { id } of apps.slice(1)) {
    const { app, worker } = await build(id);
    const { default: service } = await import("data:text/javascript;base64," + Buffer.from(worker).toString("base64"));
    const request = (path, options) => new Request(app.origin + path, options);
    assert.equal((await service.fetch(request("/api/health")).json()).id, id);
    assert.equal((await service.fetch(request("/api/record")).json()).id, id);
    assert.deepEqual(await service.fetch(request("/api/assignment")).json(), {
      id, name: app.name, ...assignments.projects[id], roles: Object.keys(assignments.roles)
    });
    assert.equal((await service.fetch(request("/api/assignments"))).status, 404);
    assert.equal((await service.fetch(request("/api/catalog"))).status, 404);
    assert.equal((await service.fetch(request("/original.txt"))).status, 404);
    assert.equal((await service.fetch(request("/", { method: "POST" }))).status, 405);
    assert.equal(await service.fetch(request("/", { method: "HEAD" })).text(), "");
    assert.match(await service.fetch(request("/")).text(), /<main><h1>/);
  }
});


test("catalog scope preserves sixteen as creator claim, not independently established total", async () => {
  const { app, worker } = await build("catalog");
  const { default: service } = await import("data:text/javascript;base64," + Buffer.from(worker).toString("base64"));
  const result = await service.fetch(new Request(app.origin + "/api/scope"));
  assert.equal(result.status,200);
  const scope = await result.json();
  assert.deepEqual(scope,scopeDossier);
  assert.equal(scope.status,"open");
  assert.equal(scope.unidentified_positions,12);
  assert.equal(scope.named_candidates.length,4);
  assert.equal(scope.scope_hypotheses.filter(x=>x.status==="unverified").length,2);
  assert.equal(scope.source_records[0].exact_excerpt,"I believe 16 different artifacts");
  assert.equal(scope.source_records[0].citation,"standalone-apps/artifacts-of-the-world/original.txt");
  const html = await service.fetch(new Request(app.origin)).text();
  assert.match(html,/Count-of-16 evidence and open hypotheses/);
  assert.equal((await service.fetch(new Request(app.origin + "/original.txt")).text()),original);
  for (const dossier of apps.slice(1)) {
    const built = await build(dossier.id);
    const { default: independent } = await import("data:text/javascript;base64," + Buffer.from(built.worker).toString("base64"));
    assert.equal((await independent.fetch(new Request(dossier.origin + "/api/scope"))).status,404);
  }
});

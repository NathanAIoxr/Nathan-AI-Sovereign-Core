import assert from "node:assert/strict";
import { test } from "node:test";
import cases from "./cases.mjs";
import { serveTruthLab } from "./worker.mjs";

const run = (path, method = "GET") => serveTruthLab(new Request(`https://example.test${path}`, {method}), "test-release");

test("exposes the full public case catalog with unique IDs and HTTPS evidence links", async () => {
  const response = run("/truth-lab/cases.json");
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(payload.cases, cases);
  assert.equal(cases.length, 30);
  assert.equal(new Set(cases.map(item => item.id)).size, cases.length);
  for (const item of cases) {
    for (const field of ["date", "theme", "title", "status", "evidence", "retelling", "task"]) assert.ok(item[field]?.length);
    assert.ok(item.sources.length);
    for (const {url} of item.sources) assert.equal(new URL(url).protocol, "https:");
  }
});

test("handles the Academy mount, method boundaries, readiness and asset content types", async () => {
  const redirect = run("/truth-lab");
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get("Location"), "/tabor-academy/truth-lab/");
  assert.match(await run("/tabor-academy/truth-lab/").text(), /What the record shows/u);
  assert.match(run("/truth-lab/reader.js").headers.get("Content-Type"), /^text\/javascript/u);
  assert.match(run("/truth-lab/styles.css").headers.get("Content-Type"), /^text\/css/u);
  assert.equal(run("/truth-lab/unknown").status, 404);
  assert.equal(run("/truth-lab/cases.json", "POST").status, 405);
  assert.equal(await run("/truth-lab/cases.json", "HEAD").text(), "");
  assert.deepEqual(await run("/truth-lab/healthz").json(), {ready:true,service:"tabor-academy-truth-lab",release:"test-release",cases:30});
});

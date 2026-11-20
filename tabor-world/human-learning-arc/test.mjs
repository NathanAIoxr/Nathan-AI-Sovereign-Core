import assert from "node:assert/strict";
import test from "node:test";
import { learningArc } from "./human-learning-arc-data.mjs";
import { serveLearningArc, withLearningArc } from "./human-learning-arc-runtime.mjs";

const base = "https://tabor-world.nathantaboract.workers.dev";
const get = (path, method = "GET") => serveLearningArc(new Request(base + path, { method }));
test("every station opens independently and links to Academy practice", async () => {
  const root = "/human-learning-arc";
  const index = await get(root + "/").text();
  const seen = new Set();
  for (const era of learningArc.eras) {
    const path = `${root}/${era.id}/`;
    assert.ok(index.includes(path));
    const list = await get(path).text();
    for (const station of era.stations) {
      seen.add(station.id);
      assert.ok(list.includes(path + station.id + "/"));
      const response = get(path + station.id + "/");
      assert.equal(response.status, 200);
      const body = await response.text();
      assert.ok(body.includes(station.academy));
      assert.ok(body.includes("<details>"));
    }
  }
  assert.equal(seen.size, 48);
  assert.equal(get(root + "/early/999/").status, 404);
  assert.equal(get(root + "/early//").status, 404);
  assert.equal(get(root + "/", "POST").status, 405);
  assert.equal(await get(root + "/", "HEAD").text(), "");
});
test("the wrapper preserves existing routes and adds one World destination", async () => {
  const original = {
    async fetch(request) {
      const url = new URL(request.url);
      return url.pathname === "/api/destinations" ?
        Response.json([{id:"hands-on-learning"}]) : new Response("untouched");
    },
  };
  const worker = withLearningArc(original);
  const forwarded = await worker.fetch(new Request(base + "/another-route"));
  assert.equal(await forwarded.text(), "untouched");
  const destinations = await worker.fetch(new Request(base + "/api/destinations"));
  const entries = await destinations.json();
  assert.equal(entries[0].id, "hands-on-learning");
  assert.equal(entries[1].url, base + "/human-learning-arc/");
});

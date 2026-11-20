import assert from "node:assert/strict";
import test from "node:test";
import { domainExplorer } from "./runtime.mjs";
import { survivalDomains } from "./survival-mastery-domains-data.mjs";
import { withLearningArc } from "../human-learning-arc/human-learning-arc-runtime.mjs";

const origin = "https://tabor-world.nathantaboract.workers.dev";
const request = (path, method = "GET") => new Request(origin + path, { method });
const root = "/survival-mastery-domains";
test("all six domains and 27 stations link to their own Academy exercise", async () => {
  const home = await domainExplorer.serve(request(root + "/")).text();
  const ids = new Set();
  for (const domain of survivalDomains.eras) {
    const group = `${root}/${domain.id}/`;
    assert.ok(home.includes(group));
    const groupPage = await domainExplorer.serve(request(group)).text();
    for (const station of domain.stations) {
      const path = group + station.id + "/";
      assert.ok(groupPage.includes(path));
      const page = await domainExplorer.serve(request(path)).text();
      assert.ok(page.includes("<details>"));
      assert.ok(page.includes(station.academy));
      ids.add(station.id);
    }
  }
  assert.equal(survivalDomains.eras.length, 6);
  assert.equal(ids.size, 27);
  assert.equal(domainExplorer.serve(request(root + "/money/1/")).status, 404);
  assert.equal(domainExplorer.serve(request(root + "/", "POST")).status, 405);
  assert.equal(await domainExplorer.serve(request(root + "/", "HEAD")).text(), "");
});
test("both explorers coexist and retain the prior catalog", async () => {
  const original = {fetch: () => Response.json([{ id: "hands-on-learning" }])};
  const worker = domainExplorer.wrap(withLearningArc(original));
  const old = await worker.fetch(request("/human-learning-arc/catalog.json"));
  assert.equal((await old.json()).eras.length, 5);
  const newCatalog = await worker.fetch(request(root + "/catalog.json"));
  assert.equal((await newCatalog.json()).eras.length, 6);
  const destinations = await worker.fetch(request("/api/destinations"));
  const ids = (await destinations.json()).map((entry) => entry.id);
  assert.deepEqual(ids, ["hands-on-learning", "complete-human-learning-arc", "six-universal-survival-mastery-domains"]);
});

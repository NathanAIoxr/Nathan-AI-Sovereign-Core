import assert from "node:assert/strict";
import test from "node:test";
import { buildAcademy, buildZone, sequence } from "./build.mjs";

const baseline = `
const page = "<main>Academy</main>";
const teaser = { fetch(request) {
  const head = request.method === "HEAD";
  return new Response(head ? null : page, {});
} };
const renderGuides = (links, index) => \`<ul class="guide-links">\${links}</ul>\${index}\`;
export default {
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === "/workbench/") return new Response(renderGuides("", "Workbench"));
    return teaser.fetch(request);
  }
};`;
const load = async code => (await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"))).default;
const request = (pathname, method = "GET") => new Request("https://academy.example" + pathname, { method });

test("Academy index, Workbench link, lesson directory, and stable course rebuild", async () => {
  const compiled = buildAcademy(baseline);
  assert.equal(buildAcademy(compiled), compiled);
  const worker = await load(compiled);
  const fetch = (path, method) => worker.fetch(request(path, method));
  for (const path of ["/", "/workbench/"]) {
    assert.match(await (await fetch(path)).text(), /href="\/tabor-academy\/mining\/"/);
  }
  const catalog = await fetch("/mining/");
  assert.equal(catalog.status, 200);
  const directory = await (await fetch("/mining/modules.json")).json();
  assert.deepEqual(directory.modules.map(entry => entry.id), sequence);
  assert.equal(new Set(directory.modules.map(entry => entry.developmentZone)).size, sequence.length);
  const html = await catalog.text();
  for (const entry of directory.modules) {
    assert.ok(html.includes(entry.path));
    const path = entry.path.slice("/tabor-academy".length);
    const page = await fetch(path);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Z · Finished outcome[\s\S]+A · Replicate and verify/);
  }
  assert.equal((await fetch("/mining/zones/missing/")).status, 404);
  assert.equal((await fetch("/mining/", "POST")).status, 405);
  assert.equal(await (await fetch("/mining/", "HEAD")).text(), "");
});

for (const id of sequence) {
  test(id + " has an independent zone with a lesson and source data", async () => {
    const worker = await load(buildZone(id));
    const health = await (await worker.fetch(request("/healthz"))).json();
    assert.deepEqual(health, { status: "ok", id, namespace: "tabor-academy-mining-" + id });
    const model = await (await worker.fetch(request("/module.json"))).json();
    assert.equal(model.id, id);
    assert.ok(model.replicate.length > 0);
    assert.ok(model.sources.length > 0);
    assert.match(await (await worker.fetch(request("/"))).text(), /Check your answer/);
    assert.equal((await worker.fetch(request("/unknown"))).status, 404);
  });
}

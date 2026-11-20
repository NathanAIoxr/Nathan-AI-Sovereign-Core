import assert from "node:assert/strict";
import test from "node:test";
import { buildAcademy, buildZone, sequence } from "./build.mjs";
import { energyFor, genesisProof, mirrorFor, voiceCommand } from "./play.mjs";

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
  assert.match(html, /Start the first challenge/);
  const script = await fetch("/mining/play.js");
  assert.match(script.headers.get("Content-Type"), /^text\/javascript/);
  assert.match(await script.text(), /function setup/);
  for (const entry of directory.modules) {
    assert.ok(html.includes(entry.path));
    const path = entry.path.slice("/tabor-academy".length);
    const page = await fetch(path);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Hold on[\s\S]+Field notes and sources[\s\S]+Z · Finished outcome[\s\S]+A · Replicate and verify/);
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
    assert.ok(model.challenge.kind);
    assert.match(await (await worker.fetch(request("/"))).text(), /data-challenge="[\s\S]+src="\.\/play.js"/);
    assert.equal((await worker.fetch(request("/play.js"))).status, 200);
    assert.equal((await worker.fetch(request("/unknown"))).status, 404);
  });
}

test("energy practice uses its stated time and cost limits", () => {
  assert.equal(energyFor(5).fits, false);
  assert.equal(energyFor(6).cost.toFixed(3), "0.576");
  assert.equal(energyFor(6).fits, true);
  assert.equal(energyFor(7).fits, false);
});

test("the mirror changes order and can report the complementary set", () => {
  assert.equal(mirrorFor("Forward", "Other side"), "Receipt · 7, 4");
  assert.equal(mirrorFor("Backward", "Other side"), "Receipt · 4, 7");
  assert.equal(mirrorFor("Inverted", "Other side"), "Receipt · 17");
});

test("real historical header verification rejects its changed byte", async () => {
  const original = await genesisProof(false);
  assert.equal(original.hash, "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f");
  assert.equal(original.passes, true);
  assert.equal((await genesisProof(true)).passes, false);
});

test("voice phrases are limited to pausing and resuming", () => {
  assert.equal(voiceCommand("Hold on, I want to learn about this"), "pause");
  assert.equal(voiceCommand("Continue"), "resume");
  assert.equal(voiceCommand("What's the answer?"), null);
});

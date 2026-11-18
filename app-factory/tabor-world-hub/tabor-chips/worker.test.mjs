import assert from "node:assert/strict";
import test from "node:test";
import worker from "./worker.mjs";
import assets from "./assets.generated.mjs";
import { scheduleTicks } from "./model.mjs";
import rhythmWorker from "../rhythm-matrix/worker.mjs";

const revision = "a".repeat(40);
const fixture = { ok: true, redundancyFixture: { fields: 78, restored: true } };
const cloud = { name: "TRUE CLOUD COMPUTING BY NATHAN TABOR", state: "edge-online", version: "0.2.0" };
const binding = value => ({ fetch: async () => Response.json(value) });
const env = {
  TABOR_CHIPS_GITHUB_SHA: revision,
  RHYTHM: { fetch: async url => rhythmWorker.fetch(new Request(url), { RHYTHM_GITHUB_SHA: revision }) },
  SUPERCOMPUTER_2X: binding(fixture),
  TRUE_CLOUD: binding(cloud)
};
const call = (path, init, overrides) => worker.fetch(new Request("https://tabor.test" + path, init), { ...env, ...overrides });

test("serves the full architecture with source, projects, and 18 unchanged track names", async () => {
  const catalog = await (await call("/api/architecture")).json();
  assert.equal(catalog.chip.layers.length, 18);
  assert.equal(catalog.continuation.workstreams.length, 29);
  assert.deepEqual(catalog.chip, assets.chip);
  assert.equal(catalog.anchors.length, 4);
  assert.deepEqual(catalog.anchors.flatMap(x => x.layers).sort(), catalog.chip.layers.map(x => x.number));
  assert.equal(catalog.reference.nvlinkBandwidthTbPerS, 130);
  assert.equal((await (await call("/source/architecture.md")).text()), assets.ownerSource);
  const html = await (await call("/")).text();
  for (const track of catalog.chip.layers) assert.ok(html.includes('id="track-' + track.number + '"'));
  assert.match(html, /Run the timing lab/);
  assert.match((await call("/client.mjs")).headers.get("content-type"), /javascript/);
  assert.match((await call("/style.css")).headers.get("content-type"), /css/);
  const receipt = await (await call("/api/receipt")).json();
  assert.equal(receipt.revision, revision);
  assert.equal(receipt.hplMeasurement, null);
});

test("verifies the live interface contract using the actual Rhythm Matrix Worker", async () => {
  for (const [year, expected] of [[1803, [0, 0]], [2024, [0, 0]], [2037, [0, 13]], [2041, [4, 0]], [-10000, [1, 12]], [2245, [0, 0]]]) {
    const response = await call("/api/run?year=" + year + "&clockHz=110&bpm=96");
    const value = await response.json();
    assert.equal(response.status, 200, JSON.stringify(value));
    assert.deepEqual(value.rhythm.broods.map(b => b.phase), expected);
    assert.equal(value.rhythm.atlasRecords, 86);
    assert.equal(value.timer.edges.length, 54);
    assert.equal(value.timer.totalTicks, 3712);
    assert.deepEqual(value.steps.map(s => s.name), ["CLEAR","BUILD","INTEGRATE","VERIFY"]);
    assert.equal(value.computer.fields, 78);
  }
});

test("carries fractional pulse intervals without drift", () => {
  const edges = scheduleTicks(110, 96, 54);
  assert.deepEqual(edges.slice(0,4).map(x => x.ticksSincePrevious), [68,69,69,69]);
  assert.ok(edges.every(x => x.errorNumerator <= 0 && x.errorNumerator > -96));
  assert.equal(scheduleTicks(1000000000,20,300).at(-1).elapsedTicks, 900000000000);
});

test("rejects out-of-range input and reports missing or inconsistent upstream data", async () => {
  for (const query of ["bpm=19","clockHz=0","year=10001","bpm=5.4","clockHz=1000000001"]) {
    assert.equal((await call("/api/run?" + query)).status, 400);
  }
  assert.equal((await call("/api/run", { method: "POST" })).status, 405);
  assert.equal(await (await call("/api/run", { method: "HEAD" })).text(), "");
  assert.equal((await call("/api/run", undefined, { SUPERCOMPUTER_2X: binding({ ...fixture, ok: false }) })).status, 502);
  assert.equal((await call("/api/run", undefined, { RHYTHM: binding({}) })).status, 502);
  assert.equal((await call("/api/run", undefined, { TRUE_CLOUD: undefined })).status, 502);
});

test("Will Wheel Way retains all nine author lines and both directions", async () => {
  const data = await (await call("/api/will-wheel-way")).json();
  const expected = ["Will = wheel", "Will = way", "Wheel = will", "Wheel = way", "Way = will", "Way = wheel", "Will = Will", "Wheel = Wheel", "Way = Way"];
  assert.deepEqual(data.relations.map(relation => relation.ownerLine).sort(), expected.sort());
  assert.equal(data.relations.filter(r => r.kind === "Identity").length, 3);
  assert.equal(await (await call("/source/will-wheel-way.txt")).text(), data.originalText);
  assert.match(data.originalText, /there’s a way where’s there a will/);
  assert.match(data.originalText, /and where’s there’s a way there’s a wheel/);
  assert.deepEqual(data.route, ["Will", "Wheel", "Way", "Will"]);
  assert.deepEqual(data.reference.edges.map(edge => edge.elapsedTicks), [68, 137, 206]);
  for (const relation of data.relations) {
    const { from, to } = relation;
    const query = "?from=" + from.toLowerCase() + "&to=" + to.toLowerCase();
    const selection = await (await call("/api/will-wheel-way" + query)).json();
    assert.deepEqual(selection.route.slice(0,2), [from,to]);
    assert.equal(selection.route.at(-1), from);
    assert.equal(selection.reference.edges.length, from === to ? 1 : 3);
    const inverse = selection.reverse.split("?")[1].split("#")[0];
    const reversed = await (await call("/api/will-wheel-way?" + inverse)).json();
    assert.deepEqual(reversed.route.slice(0,2), [to,from]);
    const next = selection.next.split("?")[1].split("#")[0];
    const step = await (await call("/api/will-wheel-way?" + next)).json();
    assert.equal(step.selected.from, to);
  }
  assert.equal((await call("/api/will-wheel-way?from=none")).status, 400);
  const html = await (await call("/will-wheel-way?from=way&to=wheel")).text();
  assert.match(html, /aria-current="true" href="[^"]+">Way = Wheel/);
  assert.match(html, /Rhythm Matrix beat lab/);
});

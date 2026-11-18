import assert from "node:assert/strict";
import test from "node:test";
import worker from "./worker.mjs";
import { timeline, docs, pillars, naturalRhythms } from "./catalog.mjs";
import { cycleAt, heartbeat, pitchMultiplier, pulseCount, score, scaleValue } from "./model.mjs";

const revision = "a".repeat(40);
const call = (path, init) => worker.fetch(new Request("https://rhythm.test" + path, init), { RHYTHM_GITHUB_SHA: revision });

test("the anchored pair aligns in 1803, 2024 and 2245", () => {
  for (const year of [1803, 2024, 2245]) assert.equal(cycleAt(year).shared, true);
  assert.equal(cycleAt(2024).nextSharedYear, 2245);
  assert.equal(cycleAt(2023).sharedAtOrBefore, 1803);
  assert.deepEqual(cycleAt(2037).broods.map(b => b.scheduled), [true, false]);
  assert.deepEqual(cycleAt(2041).broods.map(b => b.scheduled), [false, true]);
  assert.deepEqual(cycleAt(2023).broods.map(b => b.phase), [12, 16]);
  assert.throws(() => cycleAt(0.5), /whole year/);
});

test("retains the exact score, motion counts and named registry", () => {
  assert.deepEqual(score.map(row => row[1]), [10,8,6,5,4,10,9,2]);
  assert.equal(pulseCount, 54);
  assert.deepEqual(heartbeat.slice(0,4), ["up","down","up","down"]);
  assert.equal(heartbeat.length, 17);
  assert.deepEqual(pillars.map(([, names]) => names.length), [4,4,4,5]);
  assert.deepEqual(naturalRhythms.map(([id]) => id), Array.from({length:34}, (_, i) => 49+i));
  assert.match(naturalRhythms[2][1], /Heartbeat Constant/);
  assert.ok(timeline.every((row, i) => i === 0 || row.date >= timeline[i-1].date));
  for (const row of timeline) for (const ref of row.references) assert.ok(docs[ref].url.startsWith("https://"));
});

test("frequency scaling matches the archive", () => {
  assert.equal(pitchMultiplier.toFixed(10), "5.0830969135");
  assert.equal(scaleValue(423).toFixed(4), "2150.1500");
  assert.equal(scaleValue(202.8).toFixed(4), "1030.8521");
  assert.equal(scaleValue(10).toFixed(4), "50.8310");
  assert.equal(scaleValue(13).toFixed(4), "66.0803");
  assert.throws(() => scaleValue(Infinity), /Enter a number/);
});

test("renders named sections and the GitHub revision with fetchable scripts", async () => {
  const home = call("/");
  assert.match(home.headers.get("Content-Security-Policy"), /script-src 'self'/);
  const html = await home.text();
  for (const section of ["cycles","music","earth","voice","chronology"]) assert.match(html, new RegExp('id="' + section + '"'));
  assert.match(html, /Play 54 pulses/);
  assert.match(html, /P17/);
  assert.match(html, new RegExp(revision));
  for (const href of ["/style.css","/app.mjs","/model.mjs"]) {
    const response = call(href);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).length > 300);
  }
});

test("validates public routes, receipts, and invalid requests", async () => {
  const receipt = await call("/api/receipt").json();
  assert.equal(receipt.revision, revision);
  assert.equal(receipt.pulseCount, 54);
  assert.equal(receipt.rhythmRegisterCount, 34);
  assert.equal((await call("/api/catalog").json()).timeline.length, timeline.length);
  assert.equal((await call("/api/cycles?year=2245").json()).shared, true);
  assert.equal(call("/api/cycles?year=1.4").status, 400);
  assert.equal(call("/api/cycles?year=10001").status, 400);
  assert.equal(call("/api/catalog", {method:"POST"}).status, 405);
  assert.equal(await call("/api/catalog", {method:"HEAD"}).text(), "");
  assert.equal(call("/toString").status, 404);
});

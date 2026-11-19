import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { parseValue, providers, qeItems, qiItems, rankAttempts, scoreBigFive, scorePractice } from "./public/assessments.mjs";
import { ipipItems } from "./public/ipip.mjs";

test("IPIP instrument retains each official reverse key and raw scoring range", () => {
  assert.equal(ipipItems.length, 50);
  const reverseKeys = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 29, 30, 32, 34, 36, 38, 39, 44, 46, 49];
  assert.deepEqual(ipipItems.flatMap(([, , reverse], i) => reverse ? [i + 1] : []), reverseKeys);
  assert.deepEqual(scoreBigFive(Array(50).fill(3)).map(result => result.value), Array(5).fill(30));
  assert.deepEqual(scoreBigFive(ipipItems.map(([, , reverse]) => reverse ? 1 : 5)).map(result => result.value), Array(5).fill(50));
  assert.deepEqual(scoreBigFive(ipipItems.map(([, , reverse]) => reverse ? 5 : 1)).map(result => result.value), Array(5).fill(10));
  assert.throws(() => scoreBigFive(Array(50)), RangeError);
});

test("QI and QE practice score only complete attempts against their own keys", () => {
  for (const items of [qiItems, qeItems]) {
    assert.equal(scorePractice(items, items.map(item => item.answer)), items.length);
    assert.equal(scorePractice(items, items.map(item => (item.answer + 1) % item.choices.length)), 0);
    assert.throws(() => scorePractice(items, []), RangeError);
    assert.throws(() => scorePractice(items, items.map(() => 99)), RangeError);
  }
});

test("results preserve labels, numeric scores, percentiles and provider ranks", () => {
  assert.equal(parseValue(" INFJ ", "label"), "INFJ");
  assert.equal(parseValue(" 120 ", "iq"), 120);
  assert.equal(parseValue("99.2", "percentile"), 99.2);
  assert.equal(parseValue("2", "rank"), 2);
  for (const [value, unit] of [["NaN", "iq"], ["1e2", "iq"], ["101", "percentile"], ["0", "rank"], ["2.1", "rank"]]) {
    assert.throws(() => parseValue(value, unit), RangeError);
  }
});

test("personal rankings match instrument, edition, measure, unit and comparison group", () => {
  const base = { instrument: "Example", edition: "1", measure: "Total", unit: "raw", comparison: "Group A", at: "2026-11-19" };
  const records = [
    { ...base, value: 10, id: "first" },
    { ...base, value: 10, id: "tie" },
    { ...base, value: 2, id: "third" },
    { ...base, value: 120, unit: "iq" },
    { ...base, value: 100, edition: "2" },
    { ...base, value: 100, measure: "Different measure" },
    { ...base, value: 100, comparison: "Group B" },
    { ...base, value: 100, instrument: "Other test" },
  ];
  assert.deepEqual(rankAttempts(records, records[0]).map(record => [record.id, record.rank]), [["first", 1], ["tie", 1], ["third", 3]]);
  const providerRanks = [10, 1, 3].map(value => ({ ...base, value, unit: "rank" }));
  assert.deepEqual(rankAttempts(providerRanks, providerRanks[0]).map(record => record.value), [1, 3, 10]);
  assert.deepEqual(rankAttempts(records, { ...base, unit: "label", value: "Type A" }), []);
  assert.deepEqual(rankAttempts(records, { ...base, comparison: "", value: 10 }), []);
});

test("published Worker serves the standalone app and accepts read-only routes", async t => {
  const build = await mkdtemp(join(tmpdir(), "assessment-build-"));
  t.after(() => rm(build, { recursive: true, force: true }));
  const manifest = JSON.parse(await readFile(new URL("./app.json", import.meta.url)));
  const release = execFileSync(process.execPath, [fileURLToPath(new URL("./build.mjs", import.meta.url)), build], { encoding: "utf8" }).trim();
  const { default: worker } = await import(pathToFileURL(join(build, manifest.worker + ".mjs")));
  const request = (path, init) => worker.fetch(new Request(new URL(path.replace(/^\//, ""), manifest.origin), init));
  const home = await request("/");
  assert.equal(home.status, 200);
  assert.equal(await home.text(), await readFile(new URL("./public/index.html", import.meta.url), "utf8"));
  for (const path of ["/page.mjs", "/style.css", "/assessments.mjs", "/ipip.mjs"]) assert.equal((await request(path)).status, 200);
  assert.deepEqual(await (await request("/healthz")).json(), { ok: true, site: manifest.id, release });
  assert.equal((await request("/", { method: "HEAD" })).body, null);
  assert.equal((await request("/", { method: "POST" })).status, 405);
  assert.equal((await request("/missing")).status, 404);
  const mount = new URL(manifest.origin);
  mount.pathname = mount.pathname.slice(0, -1);
  const redirect = await worker.fetch(new Request(mount));
  assert.equal(redirect.status, 308);
  assert.equal(redirect.headers.get("Location"), manifest.origin);
  assert.equal((await request("/", { headers: { "If-None-Match": home.headers.get("ETag") } })).status, 304);
  assert.equal(new Set(providers.map(provider => provider.id)).size, providers.length);
  assert.ok(providers.every(provider => new URL(provider.url).protocol === "https:"));
});

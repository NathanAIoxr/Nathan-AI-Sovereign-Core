import test from "node:test";
import assert from "node:assert/strict";
import { withFieldbook } from "./runtime.mjs";
import { buildFieldbook, wireEntry } from "./build.mjs";

const base = "/way/survival-mastery-domains/fieldbook";
const legacy = { fetch: request => Response.json({ original: new URL(request.url).pathname }) };
const worker = withFieldbook(legacy);
const request = (path, method = "GET") => new Request("https://academy.example" + path, { method });
const call = (path, method) => worker.fetch(request(path, method));

test("the fieldbook indexes six labs and preserves 27 distinct Academy lessons", async () => {
  const home = await (await call(base + "/")).text();
  const result = await (await call(base + "/catalog.json")).json();
  assert.equal(result.labCount, 6);
  assert.equal(result.lessonCount, 27);
  const lessonURLs = result.labs.flatMap(lab => lab.lessons.map(lesson => lesson.academy));
  assert.equal(new Set(lessonURLs).size, 27);
  for (const lab of result.labs) {
    assert.ok(home.includes(base + "/" + lab.id + "/"));
    const page = await (await call(base + "/" + lab.id + "/")).text();
    for (const stage of result.stages) assert.ok(page.includes(stage.label));
    assert.match(page, /Compare with the worked response/);
    for (const lesson of lab.lessons) assert.ok(page.includes(lesson.academy));
    for (const [, url] of lab.sources) assert.ok(page.includes(url));
  }
});

test("capstone checks distinct criteria at the 90% boundary", async () => {
  const score = async count => {
    const params = new URLSearchParams({ grade: "1" });
    for (let i = 1; i <= count; i++) params.append("met", String(i));
    params.append("met", "1");
    params.append("met", "fake");
    return (await call(base + "/capstone/?" + params)).text();
  };
  assert.match(await score(8), /8\/10 · Review/);
  assert.match(await score(9), /9\/10 · Mastery reached/);
});

test("print edition includes all six labs and capstone with empty writing space", async () => {
  const response = await call(base + "/print/");
  const text = await response.text();
  assert.equal((text.match(/data-lab=/g) ?? []).length, 7);
  assert.match(text, /class="note"/);
  assert.doesNotMatch(text, /type="checkbox"/);
  assert.equal((await call(base + "/unknown/")).status, 404);
  assert.equal((await call(base, "POST")).status, 405);
  assert.equal((await call(base, "HEAD")).body, null);
});

test("other Academy routes pass through and the release inserts exactly one wrapper", async () => {
  const other = await call("/institution/");
  assert.deepEqual(await other.json(), { original: "/institution/" });
  const wrapped = wireEntry("export default { fetch() {} };\n");
  assert.equal(wireEntry(wrapped), wrapped);
  assert.match(wrapped, /export default withFieldbook\(academyBeforeFieldbook\)/);
  const bundle = await import("data:text/javascript," + encodeURIComponent(buildFieldbook()));
  const bundled = await (await bundle.default(legacy).fetch(request(base + "/catalog.json"))).json();
  assert.equal(bundled.labCount, 6);
  assert.equal(bundled.lessonCount, 27);
});

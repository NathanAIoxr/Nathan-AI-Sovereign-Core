import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

const get = (path, method = "GET") => worker.fetch(new Request("https://example.test" + path, { method }));

test("the index and every chapter link to their source and KJV reading", async () => {
  const home = await (await get("/")).text();
  const index = await (await get("/api/index.json")).json();
  assert.equal(index.chapters.length, 9);
  assert.equal(index.datasets.length, 12);
  assert.equal(new Set(index.chapters.map(chapter => chapter.id)).size, index.chapters.length);
  for (const chapter of index.chapters) {
    const path = "/chapter/" + chapter.id + "/";
    assert.ok(home.includes(path));
    const res = await get(path);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /version=KJV/);
    assert.ok(chapter.sources.every(([, url]) => url.startsWith("https://") && html.includes(url)));
  }
});

test("search escapes markup and the archive and Conductor resolve", async () => {
  assert.match(await (await get("/?q=maxwell")).text(), /2 of 9 chapters/);
  assert.doesNotMatch(await (await get("/?q=%3Cscript%3E")).text(), /<script>/);
  assert.match(await (await get("/archives/")).text(), /https:\/\/www\.justice\.gov\/epstein/);
  assert.equal((await (await get("/conductor.json")).json()).workflow, "review-before-publication");
  assert.equal((await get("/chapter/unknown/")).status, 404);
  assert.equal((await get("/", "HEAD")).body, null);
  assert.equal((await get("/", "POST")).status, 405);
});

test("the Academy mount preserves other routes and generates canonical links", async () => {
  const { withJeffreyEpsteinBible } = await import("./worker.mjs");
  const { mountJeffreyEpsteinBible } = await import("./mount.mjs");
  const mount = "/tabor-academy/jeffrey-epstein-bible";
  const academy = withJeffreyEpsteinBible({ fetch: () => new Response("Academy fallback") });
  const get = path => academy.fetch(new Request("https://academy.test" + path));
  assert.match(await (await get(mount + "/")).text(), /action="\/tabor-academy\/jeffrey-epstein-bible\/"/);
  assert.equal((await get("/jeffrey-epstein-bible/chapter/accesspoint/")).status, 200);
  assert.equal(await (await get("/jeffrey-epstein-bible-other")).text(), "Academy fallback");
  const source = "export default withApprenticeshipZone(academy);\n";
  const patched = mountJeffreyEpsteinBible(source);
  assert.match(patched, /withJeffreyEpsteinBible\(withApprenticeshipZone\(academy\)\)/);
  assert.equal(mountJeffreyEpsteinBible(patched), patched);
});

test("each chapter opens already laid out, with investigation available on demand", async () => {
  const index = await (await get("/api/index.json")).json();
  for (const chapter of index.chapters) {
    const path = "/chapter/" + chapter.id + "/";
    assert.ok(chapter.verse.length > 20);
    assert.ok(chapter.reading.length > 20);
    const normal = await (await get(path)).text();
    assert.match(normal, /<h2>Laid over each other<\/h2>/);
    assert.doesNotMatch(normal, /<h2>Investigate the record<\/h2>/);
    assert.ok(normal.includes('href="' + path + '?mode=investigate"'));
    const investigation = await (await get(path + "?mode=investigate")).text();
    assert.match(investigation, /<h2>Investigate the record<\/h2>/);
    assert.doesNotMatch(investigation, /<h2>Laid over each other<\/h2>/);
    assert.ok(investigation.includes('href="' + path + '">Back to Reading Mode'));
  }
  const search = await (await get("/?q=maxwell&mode=investigate")).text();
  assert.match(search, /name="mode" value="investigate"/);
  assert.match(search, /href="\/chapter\/maxwell-proceedings\/\?mode=investigate"/);
  assert.match(search, /href="\/\?q=maxwell">Back to Reading Mode/);
});

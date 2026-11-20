import assert from "node:assert/strict";
import test from "node:test";
import worker from "../src/worker.mjs";

const call = (pathname, method = "GET") =>
  worker.fetch(new Request(new URL(pathname, "https://academy.example"), { method }));

test("opens with Nathan Tabor's nine lines", async () => {
  const page = await call("/");
  assert.equal(page.status, 200);
  const text = (await page.text()).replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
  assert.match(text, /TABOR ACADEMY BY NATHAN TABOR U R my family - one blood - cousins/);
  assert.match(text, /Open Tabor Workbench/);
  assert.doesNotMatch(text, /COMING SOON/);
});

test("exposes service health", async () => {
  const health = await call("/healthz");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { service: "tabor-academy", status: "ok" });
});

test("handles HEAD, missing pages, and unsupported methods", async () => {
  assert.equal(await (await call("/", "HEAD")).text(), "");
  assert.equal((await call("/missing")).status, 404);
  const response = await call("/", "POST");
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("library only displays hash-matching records and keeps archive text private", async () => {
  const privateText = "Unpublished voice transcript";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(privateText));
  const recordId = Buffer.from(digest).toString("hex");
  const record = {
    record_id: recordId, loc_call_number: "LA", cud_index: 1,
    title_bottom: "Archive <test>", end_outcome_z: "Result", root_origin_a: "Root",
    public_explanation: "Public interpretation", sources_json: "[]", verbatim_body: privateText,
  };
  const library = {
    prepare: (query) => query,
    batch: async () => [
      { results: [record, { ...record, title_bottom: "Tampered entry", verbatim_body: "Changed" }] },
      { results: [] },
      { results: [] },
    ],
  };
  const response = await worker.fetch(new Request("https://academy.example/library/"), { LIBRARY: library });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /Archive &lt;test&gt;/);
  assert.match(body, /Public interpretation/);
  assert.doesNotMatch(body, /Unpublished voice transcript|Tampered entry/);
});

test("knotted cord sandbox distinguishes square, non-square and impossible triangles", async () => {
  assert.match(await (await call("/workbench/47/")).text(), /first two sides is square/);
  assert.match(await (await call("/workbench/47/?a=3&b=4&c=6")).text(), /is not square/);
  assert.match(await (await call("/workbench/47/?a=1&b=2&c=9")).text(), /cannot close/);
  assert.equal((await call("/workbench/?guide=8")).status, 404);
});

test("a Workbench zone displays its brief and field activity", async () => {
  const record = {
    number: 65, guide: 5, title: "Weaving & Loom Patterns", media: "GW",
    namespace_name: "tabor-academy-065-dev", brief: "Warp & Weft",
  };
  const env = { LIBRARY: { prepare: () => ({ bind: (number) => ({ first: async () => number === 65 ? record : null }) }) } };
  const response = await worker.fetch(new Request("https://academy.example/workbench/zones/65/"), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /tabor-academy-065-dev/);
  assert.equal((await worker.fetch(new Request("https://academy.example/workbench/zones/102/"), env)).status, 404);
});

test("survival track renders all three card sections and supports category filters and printing", async () => {
  const row = {
    number: 2, category: 1, modern: "Brita Water Filter", root: "Bio-Sand & Charcoal Filtration",
    mechanic: "Test mechanism", field_test: "Test setup", original_context: null,
    namespace_name: "tabor-academy-survival-002-dev",
  };
  const env = { LIBRARY: { prepare: () => ({
    bind: (number, category) => ({ all: async () => ({
      results: (!number || number === 2) && (!category || category === 1) ? [row] : [],
    }) }),
  }) } };
  const open = (path) => worker.fetch(new Request("https://academy.example"+path), env);
  const html = await (await open("/survival/2/")).text();
  assert.match(html, /Z · Modern convenience/);
  assert.match(html, /Mechanics/);
  assert.match(html, /A · Field test/);
  assert.match(await (await open("/survival/?category=1&print=1")).text(), /class="mastery-card"/);
  assert.deepEqual((await (await open("/survival/cards.json?category=7")).json()).cards, []);
  assert.equal((await open("/survival/102/")).status, 404);
});

test("Workbench printable guide renders the published D1 activity", async () => {
  const row = {
    number: 1, guide: 1, guide_title: "Direct Observation", title: "Unrestricted Shadowing",
    media: "AB", namespace_name: "tabor-academy-001-dev", brief: "Watch and repeat",
    outcome: "A paper envelope", demonstration: "Watch the folds", verification: "Repeat the folds",
  };
  const env = { LIBRARY: { prepare: () => ({
    bind: (guide) => ({ all: async () => ({ results: guide === 1 ? [row] : [] }) }),
  }) } };
  const response = await worker.fetch(new Request("https://academy.example/workbench/?guide=1&print=1"), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /A paper envelope/);
  assert.match(html, /Repeat the folds/);
});

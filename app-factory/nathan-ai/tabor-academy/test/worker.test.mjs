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

test("Nathan Tabor Way mission begins with outcome and ends with repeatable proof", async () => {
  const track = { slug: "math", title: "Make the Numbers Hold", purpose: "Measure", coverage: "Geometry" };
  const mission = { slug: "square-a-corner", path: "math", title: "Square a corner", outcome: "A square corner",
    build: "Build it", flip: "Change one assumption", integrate: "Try a second method", verify: "Repeat the test", link: "workbench/47/" };
  const env = { LIBRARY: {
    prepare: (sql) => ({ bind: (...params) => ({ sql, params }) }),
    batch: async ([p,m]) => [
      { results: !p.params[0] || p.params[0] === "math" ? [track] : [] },
      { results: (!m.params[0] || m.params[0] === "math") && (!m.params[1] || m.params[1] === mission.slug) ? [mission] : [] },
    ],
  } };
  const open = (path) => worker.fetch(new Request("https://academy.example" + path), env);
  const response = await open("/way/math/square-a-corner/");
  const page = await response.text();
  assert.equal(response.status, 200);
  assert.ok(page.indexOf("Z · Finished outcome") < page.indexOf("12 · Build"));
  assert.ok(page.indexOf("3 · Flip and clear") < page.indexOf("9 · Verify"));
  assert.match(page, /Proof sheet/);
  assert.match(page, /workbench\/47\//);
  assert.equal((await open("/way/math/unknown/")).status, 404);
  assert.equal((await (await open("/way/catalog.json")).json()).missions.length, 1);
});

test("Law of Order preserves Nathan's wording and opens with the community view", async () => {
  const home = await (await call("/order/")).text();
  assert.match(home, /you can do everything and do it anyway you want to, but if you don’t do it in the right order, it doesn’t count and it doesn’t matter cause it won’t work/);
  assert.match(home, /Luke 10:25–37 \(KJV\)/);
  assert.ok(home.indexOf("<h3>Home and community") < home.indexOf("<h3>Church, government, and state"));
  const reverse = await (await call("/order/?view=state&first=paid")).text();
  assert.ok(reverse.indexOf("<h3>Church, government, and state") < reverse.indexOf("<h3>Home and community"));
  assert.match(reverse, /The payment comes the next day/);
  assert.match(await (await call("/order/?first=saw")).text(), /Yes. The Samaritan first saw/);
});

test("Miss Wilson’s Porch keeps the four scenes and gives case-specific evidence prompts", async () => {
  const response = await call("/order/porch/");
  const html = await response.text();
  assert.equal(response.status, 200);
  for (const place of ["Chihuahua", "Tequila", "Geneva", "Jamaica"]) assert.match(html, new RegExp(place + " \\(1826\\)"));
  assert.match(html, /cold cup of water and cut you a warm slice of apple pie/);
  assert.match(await (await call("/order/porch/?case=report")).text(), /Institutional surveillance/);
  assert.match(await (await call("/order/porch/?case=repair")).text(), /Open accountability/);
  assert.match(await (await call("/order/porch/?case=water")).text(), /Help meets a need/);
  assert.match(await (await call("/order/")).text(), /order\/porch\//);
});

test("1626 history extends both syllabus views and preserves chronology", async () => {
  const page = await (await call("/order/1626/")).text();
  for (const region of ["Ethiopia", "Mainland China", "Tierra del Fuego", "Tidewater Virginia"]) assert.match(page,new RegExp(region));
  for (const date of ["1636","1624","1820","1911"]) assert.ok(page.includes(date));
  assert.ok(page.indexOf("<h3>Home and community") < page.indexOf("<h3>Church, court, and state"));
  const reverse = await (await call("/order/1626/?view=state")).text();
  assert.ok(reverse.indexOf("<h3>Church, court, and state") < reverse.indexOf("<h3>Home and community"));
  assert.match(await (await call("/order/")).text(), /order\/1626\//);
});

test("Time of Peace begins with the Age of Innocence and links the family lessons", async () => {
  const path = "/order/time-of-peace/";
  const forward = await (await call(path)).text();
  assert.match(forward, /The Time of Peace: Where Innocence Was Not a Commodity/);
  assert.ok(forward.indexOf("<h3>The Age of Innocence") < forward.indexOf("<h3>State and church authority enters"));
  assert.ok(forward.indexOf("<h3>State and church authority enters") < forward.indexOf("<h3>Innocence becomes a commodity"));
  assert.equal((forward.match(/<details>/g) || []).length, 18);
  const reverse = await (await call(path+"?view=reverse")).text();
  assert.ok(reverse.indexOf("<h3>Innocence becomes a commodity") < reverse.indexOf("<h3>The Age of Innocence"));
  const lessons = await (await call(path+"?view=lessons")).text();
  assert.equal((lessons.match(/Family activity/g) || []).length, 4);
  assert.match(await (await call("/order/1626/")).text(), /order\/time-of-peace\//);
  assert.match(await (await call("/order/porch/")).text(), /order\/time-of-peace\//);
});

test("verbatim Time of Peace route returns exact bytes and excludes private notes", async () => {
  const text = "\nFirst line\n\n• Words as supplied.";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const hash = Buffer.from(digest).toString("hex");
  let verbatim_body = text;
  const env = { LIBRARY: { prepare: (sql) => ({ bind: (slug) => ({
    first: async () => {
      assert.equal(slug, "time-of-peace");
      assert.match(sql, /visibility = 'public'/);
      return { record_id: hash, verbatim_body };
    },
  }) }) } };
  const open = (path) => worker.fetch(new Request("https://academy.example"+path), env);
  const path = "/order/time-of-peace/source.txt";
  const found = await open(path);
  assert.equal(found.status, 200);
  assert.equal(await found.text(), text);
  assert.equal(found.headers.get("etag"), '"'+hash+'"');
  assert.equal((await open("/order/time-of-peace/history-as-supplied.txt")).status, 404);
  assert.match(await (await call("/order/time-of-peace/")).text(), /Read the original source text/);
  verbatim_body += "\nchanged";
  assert.equal((await open(path)).status, 503);
});

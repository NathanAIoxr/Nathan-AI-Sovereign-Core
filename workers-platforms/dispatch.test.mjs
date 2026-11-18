import assert from "node:assert/strict";
import test from "node:test";
import dispatch from "./dispatch.mjs";
import tenant from "./tenant.mjs";
import { platforms } from "./platforms.mjs";

const req = (path, init) => new Request("https://test.example" + path, init);

test("the directory and dispatch routes cover every distinct named platform", async () => {
  assert.equal(new Set(platforms.map(({ id }) => id)).size, platforms.length);
  const dir = await (await dispatch.fetch(req("/api/platforms"))).json();
  assert.equal(dir.platforms.length, platforms.length);
  for (const p of platforms) {
    const env = { PLATFORMS: { get(id, args, options) {
      assert.equal(id, p.id);
      assert.deepEqual(options.limits, p.limits);
      return { fetch(request) {
        assert.equal(request.headers.has("authorization"), false);
        assert.equal(request.headers.has("cookie"), false);
        return Response.json({ id, path: new URL(request.url).pathname });
      } };
    } } };
    const res = await dispatch.fetch(req(p.route + "api/platform", { headers: { authorization: "Bearer test", cookie: "a=b" } }), env);
    assert.deepEqual(await res.json(), { id: p.id, path: p.route + "api/platform" });
  }
});

test("unknown routes and writes stop at the hub", async () => {
  for (const id of ["constructor", "unregistered", "unregistered%2fcompute"]) {
    const response = await dispatch.fetch(req("/p/" + id + "/"), {});
    assert.notEqual(response.status, 503);
    assert.equal(response.status, 404);
  }
  assert.equal((await dispatch.fetch(req("/p/languages/", { method: "POST" }), {})).status, 405);
  assert.equal((await dispatch.fetch(req("/p/languages/"), {})).status, 503);
});

test("tenant mismatch and malformed language filters cannot reach the database", async () => {
  assert.equal((await tenant.fetch(req("/p/compute/"), { PLATFORM_ID: "languages" })).status, 404);
  for (const filter of ["kind=table", "sign=2", "period=wrong", "offset=-1", "offset=1.5"]) {
    const response = await tenant.fetch(req("/p/languages/api/catalog?" + filter), { PLATFORM_ID: "languages" });
    assert.equal(response.status, 400);
  }
});

test("catalog shards are individually routed within the purchased fleet size", async () => {
  const first = await (await dispatch.fetch(req("/api/shards"))).json();
  const last = await (await dispatch.fetch(req("/api/shards?start=951"))).json();
  assert.equal(first.shards[0].id, "language-shard-0001");
  assert.equal(first.nextStart, 51);
  assert.equal(last.shards.at(-1).id, "language-shard-0989");
  assert.equal(last.nextStart, null);
  assert.equal(platforms.length + first.total, 1000);
  const get = (id, _, { limits }) => {
    assert.equal(id, "language-shard-0989");
    assert.deepEqual(limits, { cpuMs: 20, subRequests: 1 });
    return { fetch: () => Response.json({ id }) };
  };
  assert.equal((await dispatch.fetch(req(last.shards.at(-1).route), { PLATFORMS: { get } })).status, 200);
  for (const id of ["language-shard-0000", "language-shard-0990", "language-shard-1"]) {
    assert.equal((await dispatch.fetch(req("/p/" + id + "/"), {})).status, 404);
  }
});

test("all 1000 library duties have a unique address and cover 133,333,333 accession numbers once", async () => {
  const { assignment, bookAssignment, corpusSize, lccClasses } = await import("./library-plan.mjs");
  const all = Array.from({ length: 1000 }, (_, index) => assignment(index));
  assert.equal(new Set(all.map((row) => row.worker)).size, 1000);
  assert.equal(new Set(all.map((row) => row.dewey)).size, 1000);
  assert.equal(new Set(all.map((row) => row.duodecimal)).size, 1000);
  assert.deepEqual(new Set(all.flatMap((row) => row.lccReview)), new Set(Object.keys(lccClasses)));
  let start = 1;
  for (const row of all) {
    assert.equal(row.bookRange.start, start);
    assert.ok([133333, 133334].includes(row.bookRange.capacity));
    assert.equal(bookAssignment(start).worker, row.worker);
    assert.equal(bookAssignment(row.bookRange.end).worker, row.worker);
    start = row.bookRange.end + 1;
  }
  assert.equal(start, corpusSize + 1);
  assert.equal(all.filter((row) => row.bookRange.capacity === 133334).length, 333);
  const final = await (await dispatch.fetch(req("/p/language-shard-0989/library"))).json();
  const byBase12 = await (await dispatch.fetch(req("/library/api/locate?base12=6B3"))).json();
  assert.deepEqual(final, byBase12);
  assert.equal(final.bookRange.end, corpusSize);
  assert.equal((await dispatch.fetch(req("/library/api/locate?base12=BBB"))).status, 404);
  assert.equal((await dispatch.fetch(req("/library/api/capacity?copies=-1"))).status, 400);
  const capacity = await (await dispatch.fetch(req("/library/api/capacity"))).json();
  assert.equal(capacity.totalNodes, 105);
  const csv = await (await dispatch.fetch(req("/library/assignments.csv"))).text();
  assert.equal(csv.trimEnd().split("\r\n").length, 1001);
});

test("ACT preserves the original values and yields a bounded expansion", async () => {
  const source = await (await dispatch.fetch(req("/library/api/act"))).json();
  const expanded = await (await dispatch.fetch(req("/library/api/act?view=expanded"))).json();
  assert.equal(source.nodes.length, 20);
  assert.equal(expanded.nodes.length, 160);
  assert.equal(new Set(expanded.nodes.map(node => node.slug)).size, 160);
  assert.equal(source.nodes.find(node => node.slug === "act-recorded-value-1-168").value_text, "1.168");
  assert.equal(source.nodes.find(node => node.slug === "alias-phi-glyph").target_slug, "phi");
  assert.equal(source.nodes.find(node => node.slug === "alias-pie").target_slug, "pie-pi-phi");
});

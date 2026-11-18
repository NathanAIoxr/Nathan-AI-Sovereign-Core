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

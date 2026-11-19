import test from "node:test";
import assert from "node:assert/strict";
import { catalogBatch, probeCatalog } from "./catalog-health.mjs";

test("five minute buckets cover the allowlisted catalogs", () => {
  const batches = Array.from({ length: 5 }, (_, minute) => catalogBatch(minute));
  assert.equal(new Set(batches.flat()).size, 1000);
  assert.equal(new Set(batches.flat().filter(name => name.startsWith("language-shard-"))).size, 989);
  assert.deepEqual(catalogBatch(0), catalogBatch(5));
  assert.ok(batches.every(names => names.length <= 209 && names.includes("languages")));
});

test("catalog probes bind one fixed route per Worker and validate the response", async () => {
  const name = "language-shard-0001";
  const portal = "languages";
  const pool = {
    get(target, params, options) {
      assert.deepEqual(params, {});
      assert.deepEqual(options.limits, { cpuMs: 10, subRequests: target === portal ? 1 : 0 });
      return {
        fetch(url, init) {
          assert.equal(init.method, "GET");
          assert.equal(init.redirect, "manual");
          assert.equal(url, "https://catalog.internal/p/" + target + (target === portal ? "/api/platform" : ""));
          return Response.json(target === name
            ? { id: name, source: "Glottolog CLDF v5.4", first: "abcd1234", last: "abcd1234", records: [{ id: "abcd1234" }] }
            : { id: "incorrect", title: "Languages" });
        },
      };
    },
  };
  assert.deepEqual(await probeCatalog(pool, name), [name, "PASS", "catalog_response_verified"]);
  assert.deepEqual(await probeCatalog(pool, portal), [portal, "FAIL", "unexpected_catalog_response"]);
  assert.deepEqual(await probeCatalog({}, "unapproved"), ["unapproved", "FAIL", "not_allowlisted"]);
});

test("catalog probes reject redirects", async () => {
  const pool = { get: () => ({ fetch: () => Response.redirect("https://elsewhere.example/", 302) }) };
  assert.deepEqual(await probeCatalog(pool, "cloud"), ["cloud", "FAIL", "http_302"]);
});

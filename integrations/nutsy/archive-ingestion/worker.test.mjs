import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import worker from "./worker.ts";

function fixture(topics) {
  const sql = new DatabaseSync(":memory:");
  sql.exec(readFileSync(new URL("./migrations/0001_archive.sql", import.meta.url), "utf8"));
  const objects = new Map();
  const kv = new Map();
  return {
    sql, objects, kv,
    env: {
      ARCHIVE_TOPICS: JSON.stringify(topics),
      SOURCE_USER_AGENT: "NutsyArchive Test/1.0 (https://example.test)",
      ARCHIVE_CATALOG: {
        prepare: statement => ({
          bind: (...bindings) => ({
            first: async () => sql.prepare(statement).get(...bindings),
            run: async () => sql.prepare(statement).run(...bindings),
          }),
        }),
        async batch(statements) {
          sql.exec("BEGIN");
          try {
            for (const statement of statements) await statement.run();
            sql.exec("COMMIT");
          } catch (error) {
            sql.exec("ROLLBACK");
            throw error;
          }
        },
      },
      ARCHIVE_RAW: {
        async put(key, bytes, options) {
          assert.equal(Buffer.from(options.sha256).toString("hex"), createHash("sha256").update(bytes).digest("hex"));
          assert.equal(options.onlyIf.etagDoesNotMatch, "*");
          if (!objects.has(key)) objects.set(key, Buffer.from(bytes));
        },
      },
      WIKIMEDIA_TOKENS: {
        get: async key => JSON.parse(kv.get(key) ?? "null"),
        put: async (key, value) => kv.set(key, value),
      },
    },
  };
}

test("identical captures deduplicate and keep exact raw bytes and revision IDs", async t => {
  const { env, objects, sql } = fixture([{ source: "wikimedia", input: "Henry Ford" }]);
  const bytes = '{ "query": { "pages": [{ "pageid": 33, "revisions": [{ "revid": 51 }] }] } }';
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url.hostname, "en.wikipedia.org");
    assert.equal(url.searchParams.get("titles"), "Henry Ford");
    assert.match(init.headers["User-Agent"], /NutsyArchive Test/);
    return new Response(bytes);
  });
  await worker.scheduled({}, env);
  await worker.scheduled({}, env);
  const rows = sql.prepare("SELECT * FROM nutsy_archive_snapshots").all();
  assert.equal(rows.length, 1);
  assert.equal(objects.size, 1);
  assert.equal(objects.get(rows[0].r2_key).toString(), bytes);
  assert.equal(rows[0].sha256, createHash("sha256").update(bytes).digest("hex"));
  const entity = sql.prepare("SELECT entity_id, source_version FROM nutsy_archive_entities").get();
  assert.equal(entity.entity_id, "33");
  assert.equal(entity.source_version, "51");
});

test("Enterprise refreshes expired access tokens from encrypted KV", async t => {
  const { env, kv, sql } = fixture([{ source: "wikimedia-enterprise", input: "Henry Ford" }]);
  Object.assign(env, {
    WIKIMEDIA_USER: "TEST", WIKIMEDIA_PASS: "fixture-password",
    WIKIMEDIA_CACHE_KEY: Buffer.alloc(32, 7).toString("base64"),
  });
  const paths = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    paths.push(url.pathname);
    if (url.pathname === "/v1/login") {
      assert.equal(JSON.parse(init.body).username, "test");
      return Response.json({ access_token: "fixture-access", refresh_token: "fixture-refresh", expires_in: 1 });
    }
    if (url.pathname === "/v1/token-refresh") {
      assert.equal(JSON.parse(init.body).refresh_token, "fixture-refresh");
      return Response.json({ access_token: "fixture-updated-access", expires_in: 86400 });
    }
    assert.equal(url.pathname, "/v2/articles/Henry%20Ford");
    assert.match(init.headers.Authorization, /^Bearer fixture-(updated-)?access$/);
    return Response.json([{ identifier: 42, name: "Henry Ford" }]);
  });
  await worker.scheduled({}, env);
  await worker.scheduled({}, env);
  assert.deepEqual(paths, ["/v1/login", "/v2/articles/Henry%20Ford", "/v1/token-refresh", "/v2/articles/Henry%20Ford"]);
  assert.ok([...kv.values()].every(value => !value.includes("fixture-")));
  assert.equal(sql.prepare("SELECT count(*) AS count FROM nutsy_archive_snapshots").get().count, 1);
});

test("rate-limited provider records a cooldown and leaves the other source running", async t => {
  const { env, objects, sql } = fixture([{ source: "loc", input: "Henry Ford" }, { source: "openalex", input: "assembly" }]);
  env.OPENALEX_API_KEY = "fixture-openalex-key";
  let locRequests = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (url.hostname === "www.loc.gov") {
      locRequests++;
      return new Response("Slow down", { status: 429, headers: { "Retry-After": "120" } });
    }
    assert.equal(init.headers.Authorization, "Bearer fixture-openalex-key");
    assert.ok(!url.href.includes("fixture-openalex-key"));
    return Response.json({ results: [{ id: "https://openalex.org/W1" }] });
  });
  await assert.rejects(worker.scheduled({}, env), /failed for: loc/);
  await worker.scheduled({}, env);
  assert.equal(locRequests, 1);
  assert.equal(objects.size, 1);
  assert.ok(sql.prepare("SELECT until_ms FROM nutsy_archive_cooldowns WHERE provider = 'loc'").get().until_ms > Date.now());
});

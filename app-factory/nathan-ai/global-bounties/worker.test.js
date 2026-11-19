import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "./dist/worker.js";

const base = "https://example.invalid/global-bounties";

function fixture() {
  const database = new DatabaseSync(":memory:");
  const DB = {
    prepare(sql) {
      const stmt = () => database.prepare(sql);
      let params = [];
      return {
        bind(...values) { params = values; return this; },
        async all() { return { results: stmt().all(...params) }; },
        async run() { return { meta: stmt().run(...params) }; }
      };
    },
    async batch(statements) {
      database.exec("BEGIN");
      try {
        for (const statement of statements) await statement.run();
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    }
  };
  const seed = () => database.exec(readFileSync(new URL("seed.sql", import.meta.url), "utf8"));
  const request = (path, init) => worker.fetch(new Request(base + path, init),
    { DB, API_KEY: "test-owner-key", PUBLIC_BASE_URL: base });
  return { request, seed };
}

function post(payload, headers = {}) {
  return { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(payload) };
}

test("a fresh database seeds sourced records and distinguishes prizes from pools", async () => {
  const { request, seed } = fixture();
  const math = await (await request("/bounties?category=math&status=OPEN")).json();
  assert.equal(math.count, 6);
  assert(math.bounties.every((row) => row.source_url.startsWith("https://")));
  const review = await (await request("/bounties?status=UNDER_REVIEW")).json();
  assert.deepEqual(review.bounties.map((row) => row.id), ["clay-navier-stokes"]);
  seed();
  const stats = await (await request("/stats")).json();
  assert.deepEqual(stats.totals, { count: 9, prize_usd: 6_000_000, pool_usd: 7_000_000 });
  assert.equal((await request("/bounties?limit=0")).status, 400);
});

test("owner corrections change open totals and same-date seed preserves the correction", async () => {
  const { request, seed } = fixture();
  assert.equal((await request("/bounties", post({}))).status, 401);
  assert.equal((await request("/bounties", post({}, { Authorization: "Bearer bad" }))).status, 401);
  const { bounties: [row] } = await (await request("/bounties?q=P%20vs%20NP")).json();
  const authorized = { Authorization: "Bearer test-owner-key" };
  const changed = await request("/bounties", post({ ...row, status: "CLOSED" }, authorized));
  assert.equal(changed.status, 200);
  seed();
  const stats = await (await request("/stats")).json();
  assert.deepEqual(stats.totals, { count: 8, prize_usd: 5_000_000, pool_usd: 7_000_000 });
  assert.equal((await request("/bounties", post({ ...row, source_url: "file:///private" }, authorized))).status, 400);
  assert.equal((await request("/recall")).status, 404);
});

test("public discovery and MCP invite both scopes and expose only read tools", async () => {
  const { request } = fixture();
  const discovery = await (await request("/.well-known/agent.json")).json();
  assert.deepEqual(discovery.scope, ["system", "non-system"]);
  assert.equal(discovery._covenant.math.clear, "1-1=0");
  assert.equal(discovery.mcp.url, base + "/mcp");
  const api = await (await request("/openapi.json")).json();
  assert.equal(api.openapi, "3.1.0");
  assert.deepEqual(api.paths["/bounties"].post.security, [{ ownerToken: [] }]);

  const rpc = (method, extra, headers) => request("/mcp", post({ jsonrpc: "2.0", method, ...extra }, headers));
  assert.equal((await request("/mcp")).status, 405);
  assert.equal((await rpc("tools/list", { id: 1 }, { Origin: "https://other.invalid" })).status, 403);
  const init = await (await rpc("initialize", { id: 1, params: { protocolVersion: "2025-11-25" } })).json();
  assert.equal(init.result.protocolVersion, "2025-11-25");
  assert.equal((await rpc("notifications/initialized")).status, 202);
  const listed = await (await rpc("tools/list", { id: 2 })).json();
  assert.deepEqual(listed.result.tools.map((tool) => tool.name), ["search_bounties", "get_prize_stats"]);
  const call = await (await rpc("tools/call", {
    id: 3, params: { name: "search_bounties", arguments: { category: "math", status: "OPEN" } }
  })).json();
  assert.equal(JSON.parse(call.result.content[0].text).count, 6);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { serveSovereignEngine, digest } from "./worker.mjs";

const migration = readFileSync(new URL("./migrations/0001_receipts.sql", import.meta.url), "utf8");
const secret = "test-token-only-abcdefghijklmnopqrstuvwxyz";
const seed = { source: "voice-box", verdict: "verified", input_sha256: "a".repeat(64) };
const receipt = char => ({ ...seed, evidence_sha256: char.repeat(64) });

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(migration);
  return {
    prepare(sql) {
      return {
        all: () => db.prepare(sql).all(),
        bind: (...args) => () => ({ results: db.prepare(sql).all(...args) }),
      };
    },
    async batch(statements) {
      db.exec("BEGIN");
      try {
        const result = statements.map(statement => statement());
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    count: () => db.prepare("SELECT count(*) AS total FROM engine_receipts").get().total,
  };
}

async function post(env, body, token = secret) {
  const response = await serveSovereignEngine(new Request("https://example.test/api/sovereign-engine/receipts", {
    method: "POST", body: JSON.stringify(body), headers: { Authorization: `Bearer ${token}` },
  }), { ENGINE_TOKEN: secret, ...env }, "/api/sovereign-engine/receipts");
  return [response.status, await response.json()];
}

test("validates credentials and bound input before writing", async () => {
  const db = database();
  assert.equal((await post({ ENGINE_DB_PRIMARY: db }, [receipt("a")], "wrong"))[0], 401);
  assert.equal((await post({ ENGINE_DB_PRIMARY: db }, [{ sql: "SELECT 1" }]))[0], 400);
  assert.equal((await post({ ENGINE_DB_PRIMARY: db }, [" ".repeat(17000)]))[0], 413);
  assert.equal(db.count(), 0);
});

test("deduplicates, enforces the UTC budget and archives overflow", async () => {
  const ENGINE_DB_PRIMARY = database();
  const spills = new Map();
  const env = { ENGINE_DB_PRIMARY, ENGINE_DAILY_RECEIPTS_PER_SHARD: 1, ENGINE_OVERFLOW_R2: {
    async put(key, text, options) {
      assert.equal(options.onlyIf.get("if-none-match"), "*");
      if (!spills.has(key)) spills.set(key, text);
    },
  } };
  const [code, first] = await post(env, [receipt("a"), receipt("a"), receipt("b")]);
  assert.equal(code, 202);
  assert.deepEqual(first.receipts.map(item => item.state), ["committed", "committed", "buffered"]);
  assert.equal(ENGINE_DB_PRIMARY.count(), 1);
  assert.equal(spills.size, 1);
  const [, retry] = await post(env, [receipt("a"), receipt("b")]);
  assert.deepEqual(retry.receipts.map(item => item.state), ["already_committed", "buffered"]);
  assert.equal(retry.receipts[0].seal, await digest(JSON.stringify(receipt("a"))));
});

test("routes by digest and provides a deferred receipt when overflow is unavailable", async () => {
  const ENGINE_DB_PRIMARY = database();
  const ENGINE_DB_SHARD_2 = database();
  const env = { ENGINE_DB_PRIMARY, ENGINE_DB_SHARD_2, ENGINE_DAILY_RECEIPTS_PER_SHARD: 1 };
  const inputs = ["a", "b", "c", "d", "e", "f"].map(receipt);
  const [status, result] = await post(env, inputs);
  assert.equal(status, 202);
  assert.equal(ENGINE_DB_PRIMARY.count(), 1);
  assert.equal(ENGINE_DB_SHARD_2.count(), 1);
  assert.equal(result.receipts.filter(item => item.state === "deferred").length, 4);
});

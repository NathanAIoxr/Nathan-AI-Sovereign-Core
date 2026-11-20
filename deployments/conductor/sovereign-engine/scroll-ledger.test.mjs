import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { serveScrollLedger, sealInput } from "./scroll-ledger.mjs";
import { anchorHex } from "./worker.mjs";

const root = "/api/artifact-scroll";
const token = "test-only-secret-abcdefghijklmnopqrstuvwxyz";
const seed = JSON.parse(readFileSync(new URL("./fixtures/scroll-seed.json", import.meta.url))).records[0];
const records = [{ ...seed, unix_timestamp: 1700000000, raw_text: "  e\u0301 — שָׁלוֹם\n" },
  { ...seed, unix_timestamp: 1700000001, scroll_siglum: "3Q15", medium: "copper" }];
function fixture() {
  const sql = new DatabaseSync(":memory:");
  for (const file of ["0002_artifact_scroll_ledger.sql", "0003_scroll_write_budget.sql"]) {
    sql.exec(readFileSync(new URL("./migrations/" + file, import.meta.url), "utf8"));
  }
  const statement = (source, bindings) => ({
    bind: (...values) => statement(source, values),
    first: () => sql.prepare(source).get(...bindings),
    all: () => ({ results: sql.prepare(source).all(...bindings) }),
    run: () => /^(SELECT|PRAGMA)/.test(source)
      ? { results: sql.prepare(source).all(...bindings) }
      : sql.prepare(source).run(...bindings),
  });
  const env = { SCROLL_LEDGER_TOKEN: token, ENGINE_DB_PRIMARY: {
    prepare: source => statement(source, []),
    async batch(stmts) {
      sql.exec("BEGIN");
      try {
        const results = stmts.map(stmt => stmt.run());
        sql.exec("COMMIT");
        return results;
      } catch (error) {
        sql.exec("ROLLBACK");
        throw error;
      }
    },
  } };
  return { sql, env };
}
async function call(env, route, options = {}) {
  const headers = { "x-sovereign-anchor": options.anchor ?? anchorHex,
    authorization: "Bearer " + (options.token ?? token) };
  const request = new Request("https://example.test" + root + route, {
    method: options.records ? "POST" : "GET",
    headers,
    body: options.records ? JSON.stringify({ records: options.records }) : undefined,
  });
  const response = await serveScrollLedger(request, env, new URL(request.url).pathname,
    async req => new Uint8Array(await req.arrayBuffer()));
  return [response.status, await response.json()];
}
test("requires the exact anchor and private credential before accessing the ledger", async () => {
  const pretend = { SCROLL_LEDGER_TOKEN: token };
  assert.equal((await call(pretend, "/ledger", { anchor: "" }))[0], 403);
  assert.equal((await call(pretend, "/ledger", { token: "wrong" }))[0], 401);
});

test("stamps and seals both records, queries by siglum, and returns stable retry receipts", async () => {
  const { sql, env } = fixture();
  assert.equal((await call(env, "/health"))[0], 200);
  const [status, first] = await call(env, "/ingest", { records });
  assert.equal(status, 200);
  assert.equal(first.inserted, 2);
  const [, { records: stored }] = await call(env, "/ledger");
  assert.equal(stored[0].content_nfc, "é — שָׁלוֹם");
  assert.equal(stored[0].iso_timestamp, "2023-11-14T22:13:20Z");
  assert.equal(stored[1].prev_chain_sha256, stored[0].payload_sha256);
  assert.equal((await call(env, "/ledger?siglum=3Q15"))[1].count, 1);
  const [, retry] = await call(env, "/ingest", { records });
  assert.equal(retry.inserted, 0);
  assert.deepEqual(retry.records, first.records);
  assert.throws(() => sql.exec("DELETE FROM artifact_scroll_ledger"), /append_only/);
});

test("rolls back the whole batch when it exceeds the daily budget", async () => {
  const { sql, env } = fixture();
  sql.exec("INSERT INTO artifact_scroll_write_budget VALUES(date('now'),999)");
  assert.equal((await call(env, "/ingest", { records }))[0], 429);
  assert.equal(sql.prepare("SELECT count(*) AS total FROM artifact_scroll_ledger").get().total, 0);
});

test("Python and Workers agree on NFC fingerprints and the chain head", async () => {
  const path = fileURLToPath(new URL(".", import.meta.url));
  const child = spawnSync("python3", ["-c", `
import json, sqlite3, sys
from nathan_ai_scroll_ledger import MIGRATIONS, append_batch, verify_entire_chain
db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
for file in sorted(MIGRATIONS.glob("000[23]*.sql")):
    db.executescript(file.read_text())
append_batch(db, json.load(sys.stdin))
print(json.dumps(verify_entire_chain(db)))
`], { cwd: path, input: JSON.stringify(records), encoding: "utf8" });
  assert.equal(child.status, 0, child.stderr);
  const { env } = fixture();
  const [status, actual] = await call(env, "/ingest", { records });
  assert.equal(status, 200);
  assert.equal(actual.head_sha256, JSON.parse(child.stdout).head_sha256);
  assert.equal(actual.records[0].fingerprint_sha256, (await sealInput(records[0], 0)).fingerprint);
});

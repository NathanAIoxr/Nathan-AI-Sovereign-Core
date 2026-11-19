import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import worker from "./worker.js";

function d1(schema) {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(schema);
  const database = {
    sqlite,
    withSession: () => database,
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = statements.map(statement => statement.execute());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    prepare(sql) {
      const numbered = /\?[0-9]+/.test(sql);
      const query = sqlite.prepare(sql.replace(/\?([0-9]+)/g, "$p$1"));
      const statement = values => {
        const args = numbered ? [Object.fromEntries(values.map((value, index) => ["$p" + (index + 1), value]))] : values;
        const execute = () => query.columns().length ? { results: query.all(...args) } :
          { meta: { changes: query.run(...args).changes } };
        return {
          execute,
          bind: (...params) => statement(params),
          all: async () => execute(),
          run: async () => execute(),
          first: async column => query.get(...args)?.[column] ?? null,
        };
      };
      return statement([]);
    },
  };
  return database;
}

const registry = `
CREATE TABLE unified_catalog (uid TEXT PRIMARY KEY,source_db TEXT,source_table TEXT,source_id TEXT,name TEXT,category TEXT,
  repo_url TEXT,source_status TEXT,integration_status TEXT DEFAULT 'INDEXED',updated_at TEXT,UNIQUE(source_db,source_table,source_id));
CREATE TABLE restored_resources_v1 (uid TEXT PRIMARY KEY,source_db TEXT,source_table TEXT,source_id TEXT,resource_kind TEXT,
  custody TEXT,label TEXT,source_url TEXT,declared_status TEXT,operational_state TEXT,license_declared TEXT,
  original_record_json TEXT,observed_at TEXT,restored_at TEXT);
`;
const migration = readFileSync(new URL("./reconcile.sql", import.meta.url), "utf8");

test("discovers renamed and empty tables, retains composite identities, and preserves archived records", async () => {
  const global = "tabor-global-import-catalog";
  const ownership = "global_atlas_owner_resources";
  const env = {
    DB: d1(registry + migration),
    GLOBAL_DB: d1(`
      CREATE TABLE ${ownership}(resource_type TEXT, resource_name TEXT, status TEXT, PRIMARY KEY(resource_type,resource_name));
      INSERT INTO ${ownership} VALUES ('worker','sample','declared');
      INSERT INTO ${ownership} VALUES ('worker','with|delimiter','declared');
      CREATE TABLE global_atlas_sources(name TEXT PRIMARY KEY); INSERT INTO global_atlas_sources VALUES('source');
    `),
    FLEET_DB: d1("CREATE TABLE future_fleet(id INTEGER PRIMARY KEY, title TEXT)"),
    MASTER_DB: d1("CREATE TABLE events(event_id INTEGER PRIMARY KEY, event_type TEXT); INSERT INTO events VALUES(42,'recorded')"),
    COCKPIT_KEY: "local-test-only",
    PLATFORMS: {},
  };
  const url = "https://local.example";
  const call = (path, method, owner = true) => worker.fetch(new Request(url + path, {
    method, headers: owner ? { Authorization: "Bearer local-test-only" } : {},
  }), env);
  const importTable = (source, table) =>
    call("/api/import?" + new URLSearchParams({ source, table }), "POST");
  assert.equal((await call("/api/catalog", "GET", false)).status, 401);
  assert.equal((await call("/api/import", "POST", false)).status, 401);
  assert.equal((await call("/api/clear", "POST")).status, 404);
  const fixedTime = Date.UTC(2026, 10, 19, 1, 5);
  await worker.scheduled({ scheduledTime: fixedTime }, env);
  await worker.scheduled({ scheduledTime: fixedTime + 300_000 }, env);
  const initial = await (await call("/api/summary", "GET", false)).json();
  assert.equal(initial.ready, true);
  assert.equal(initial.verified_tables, 4);
  assert.equal(initial.live_source_rows, 4);
  assert.equal(initial.archived_records, 4);
  assert.equal(Object.hasOwn(initial, "sources"), false);
  const archived = env.DB.sqlite.prepare("SELECT uid FROM restored_resources_v1 WHERE source_table=? ORDER BY uid").all(ownership);
  assert.deepEqual(archived.map(row => row.uid), [
    global + ":" + ownership + ':["worker","with|delimiter"]',
    global + ":" + ownership + ":worker|sample",
  ]);
  env.GLOBAL_DB.sqlite.exec(`UPDATE ${ownership} SET status='changed' WHERE resource_name='sample';
    INSERT INTO ${ownership} VALUES ('database','new','pending');`);
  const imported = await importTable(global, ownership);
  assert.equal(imported.status, 200);
  assert.deepEqual((await imported.json()).results.map(row => [row.rows, row.added]), [[3, 1]]);
  const repeated = await (await importTable(global, ownership)).json();
  assert.deepEqual(repeated.results.map(row => row.added), [0]);
  const existing = env.DB.sqlite.prepare("SELECT source_status,integration_status FROM unified_catalog WHERE source_id=?").get("worker|sample");
  assert.equal(existing.source_status, "declared");
  assert.equal(existing.integration_status, "INDEXED");
});

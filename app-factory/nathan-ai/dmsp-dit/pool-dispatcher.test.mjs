import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { departmentBuilds } from "./department-builds.mjs";
import department from "./department-worker.mjs";
import dispatcher from "./pool-dispatcher.mjs";

function fixture(t) {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec(`
    CREATE TABLE dmsp_departments (id TEXT PRIMARY KEY, title TEXT);
    CREATE TABLE dmsp_runbooks (id TEXT PRIMARY KEY, department_id TEXT, approval_required INTEGER, enabled INTEGER);
    CREATE TABLE dmsp_worker_pool (script_name TEXT PRIMARY KEY, namespace TEXT, pool_state TEXT,
      execution_enabled INTEGER, health_state TEXT, last_verified_at TEXT);
    CREATE TABLE grid_build_queue (job_id TEXT PRIMARY KEY, kind TEXT, target TEXT, state TEXT, requires_approval INTEGER);
  `);
  db.exec(readFileSync(new URL("./pool-dispatch-schema.sql", import.meta.url), "utf8"));
  for (const id of Object.keys(departmentBuilds)) {
    db.prepare("INSERT INTO dmsp_departments VALUES (?, ?)").run(id, id);
    db.prepare("INSERT INTO dmsp_runbooks VALUES (?, ?, 1, 0)").run("rb-" + id + "-baseline", id);
  }
  const requests = [];
  const env = {
    DB: {
      prepare(sql) {
        const stmt = db.prepare(sql);
        function statement(params) {
          return {
            bind: (...next) => statement(next),
            all: () => ({ results: stmt.all(...params) }),
            run: () => stmt.run(...params),
          };
        }
        return statement([]);
      },
      batch(statements) {
        db.exec("BEGIN");
        try {
          const results = statements.map(stmt => stmt.run());
          db.exec("COMMIT");
          return results;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      },
    },
    POOL: {
      get(name, args, options) {
        requests.push(name);
        assert.deepEqual(options.limits, { cpuMs: 10, subRequests: 0 });
        const departmentId = name.slice("dmsp-dit-".length);
        const [deliverable, input, evidence] = departmentBuilds[departmentId];
        return { fetch: (url, init) => department.fetch(new Request(url, init), {
          DEPARTMENT: { departmentId, deliverable, input, evidence },
        }) };
      },
    },
  };
  return { db, env, requests };
}

test("scheduled pool dispatches all approved departments and stores distinct, idempotent receipts", async t => {
  const { db, env, requests } = fixture(t);
  const scheduledTime = Date.now();
  await dispatcher.scheduled({ scheduledTime }, env);
  await dispatcher.scheduled({ scheduledTime }, env);
  assert.equal(new Set(requests).size, 28);
  assert.equal(db.prepare("SELECT count(*) AS count FROM dmsp_pool_receipts WHERE result='PASS'").get().count, 28);
  const response = await dispatcher.fetch(new Request("https://pool.example/status"), env);
  const status = await response.json();
  assert.equal(status.scheduled_departments, 28);
  assert.equal(status.active_departments, 28);
  const helpdesk = status.departments.find(row => row.department_id === "helpdesk");
  assert.equal(helpdesk.build.deliverable, "Support intake and escalation plan");
  assert.equal(helpdesk.build.state, "PENDING_INPUT");
  assert.equal((await dispatcher.fetch(new Request("https://pool.example/status", { method: "POST" }), env)).status, 404);
});

test("disabled, unapproved and mismatched jobs do not dispatch, and invalid baselines degrade", async t => {
  const { db, env, requests } = fixture(t);
  db.exec(`
    UPDATE dmsp_worker_pool SET execution_enabled=0, pool_state='DISABLED' WHERE script_name='dmsp-dit-apps';
    UPDATE grid_build_queue SET requires_approval=1 WHERE job_id='dmsp-department:asset';
    UPDATE grid_build_queue SET target='dmsp-dit-helpdesk' WHERE job_id='dmsp-department:automation';
    UPDATE dmsp_runbooks SET enabled=1 WHERE department_id='identity';
  `);
  await dispatcher.scheduled({ scheduledTime: Date.now() }, env);
  for (const id of ["apps", "asset", "automation"]) assert.ok(!requests.includes("dmsp-dit-" + id));
  assert.equal(requests.filter(name => name === "dmsp-dit-helpdesk").length, 1);
  assert.equal(db.prepare("SELECT pool_state FROM dmsp_worker_pool WHERE script_name='dmsp-dit-identity'").get().pool_state, "DEGRADED");
  assert.equal(db.prepare("SELECT detail FROM dmsp_pool_receipts WHERE job_id='dmsp-department:identity'").get().detail, "invalid_baseline");
});

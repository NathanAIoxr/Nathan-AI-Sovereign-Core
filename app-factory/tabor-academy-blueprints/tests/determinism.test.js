import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { answerColumns, answerLayer } from "../public/answer-layer.js";
import { syncCurriculum } from "../public/integrity.js";
import { branchFor, COLUMNS, contentSha256, idempotencyKey, identifySnapshot,
  mechanicsRoot, MECHANICS, rowSha256 } from "../shared/merkle.js";
import { commitObservation, gatekeeper, purgeBlueprint, transitionBlueprint } from "../worker/gatekeeper.js";
import { curriculumProof, readVerified } from "../worker/integrity.js";
import worker from "../worker/index.js";

const root = new URL("../", import.meta.url);
const fixture = JSON.parse(readFileSync(new URL("public/exports/blueprints.json", root), "utf8"));
const expected = JSON.parse(readFileSync(new URL("public/exports/blueprints.integrity.json", root), "utf8"));
const hash = text => createHash("sha256").update(text, "utf8").digest("hex");

function database() {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys=ON");
  const directory = new URL("migrations/", root);
  for (const file of readdirSync(directory).filter(name => name.endsWith(".sql")).sort()) {
    sql.exec(readFileSync(new URL(file, directory), "utf8"));
  }
  const db = {
    prepare(query) {
      const compiled = sql.prepare(query);
      const statement = params => ({
        bind: (...next) => statement(next),
        run: async () => ({ meta: compiled.run(...params) }),
        first: async () => compiled.get(...params) ?? null,
        all: async () => ({ results: compiled.all(...params) }),
        execute: read => read ? { results: compiled.all(...params) } : { meta: compiled.run(...params) },
      });
      return statement([]);
    },
    async batch(statements) {
      sql.exec("BEGIN IMMEDIATE");
      try {
        const results = statements.map((statement, i) => statement.execute(i === statements.length - 1));
        sql.exec("COMMIT");
        return results;
      } catch (e) {
        sql.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return { sql, db };
}

test("all 30 stored mechanics hashes and both roots agree with GitHub and Node crypto", async () => {
  const { db, sql } = database();
  try {
    const rows = await readVerified(db);
    assert.deepEqual(rows, fixture);
    assert.equal(rows[0] && Object.keys(rows[0]).length, 15);
    assert.equal(await rowSha256(rows[0]), hash(JSON.stringify(["academy-mechanics-v1", ...MECHANICS.map(key => rows[0][key].normalize("NFC").trim())])));
    assert.equal(await contentSha256(rows[0]), hash(JSON.stringify(["academy-row-v1", ...COLUMNS.map(key => rows[0][key])])));
    assert.deepEqual(await identifySnapshot(rows), { version: expected.version, root: expected.root, branches: expected.branches, count: expected.count });
    assert.equal(await mechanicsRoot(rows), expected.mechanicsRoot);
  } finally { sql.close(); }
});

test("field order and row order are irrelevant while full content remains committed", async () => {
  const shuffled = [...fixture].reverse().map(row => Object.fromEntries(Object.entries(row).reverse()));
  assert.equal((await identifySnapshot(shuffled)).root, expected.root);
  const edited = { ...fixture[0], clue_prompt: "A new verified prompt." };
  assert.equal(await rowSha256(edited), await rowSha256(fixture[0]));
  assert.notEqual(await contentSha256(edited), await contentSha256(fixture[0]));
  const unicode = { ...fixture[0], operations: "Café work" };
  assert.equal(await rowSha256(unicode), await rowSha256({ ...unicode, operations: " Cafe\u0301 work " }));
  const boundary = { ...fixture[0], core_parts: "ab", operations: "c" };
  assert.notEqual(await rowSha256(boundary), await rowSha256({ ...boundary, core_parts: "a", operations: "bc" }));
});

test("binary gate rejects wrong keys, placeholders, hedges and invalid Unicode", () => {
  const row = fixture[0];
  assert.equal(gatekeeper(row), 1);
  for (const operations of ["", "unknown", "TBD", "N/A", "It seems to turn.", "It might be a gear.", "a\uD800"]) {
    assert.equal(gatekeeper({ ...row, operations }), 0, operations);
  }
  assert.equal(gatekeeper({ ...row, extra: "unexpected" }), 0);
  assert.equal(gatekeeper({ ...row, id: "1" }), 0);
  assert.equal(gatekeeper({ ...row, operations: "a".repeat(1201) }), 0);
});

test("Investigative Mode creates no answer elements or answer text before reveal", () => {
  const document = { createElement: tag => ({
    tag, children: [], append(...nodes) { this.children.push(...nodes); },
  }) };
  const hidden = answerLayer(document, fixture[0], false);
  const revealed = answerLayer(document, fixture[0], true);
  assert.equal(hidden.children.length, 0);
  assert.equal(hidden.tag, "div");
  assert.equal(revealed.tag, "dl");
  assert.equal(revealed.children.length, 8);
  assert.deepEqual(revealed.children.map(pair => pair.children[1].textContent), answerColumns.map(([key]) => fixture[0][key]));
});

test("100 outbox observations, replayed in different orders with dropped responses, commit exactly once", async () => {
  const { db, sql } = database();
  try {
    for (let n = 0; n < 100; n++) {
      const id = `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
      const payload = [id, 1, `Test sighting ${n}`, null, "", null];
      const key = await idempotencyKey("field-observation", "tabor-academy", payload);
      const response = await worker.fetch(new Request("https://academy.test/api/sightings", {
        method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify({ id, lessonId: 1, objectName: payload[2] }),
      }), { DB: db });
      assert.equal(response.status, 202);
      if (n % 3 !== 0) await response.json();
    }
    const ids = sql.prepare("SELECT id,fingerprint,object_name FROM blueprint_observations ORDER BY id DESC").all();
    await Promise.all(ids.map(row => commitObservation(db, [row.id, row.fingerprint, 1, row.object_name, null, "", null])));
    assert.equal(sql.prepare("SELECT count(*) AS total FROM blueprint_observations").get().total, 100);
    assert.equal(sql.prepare("SELECT count FROM blueprint_usage WHERE action='field'").get().count, 100);
    assert.equal((await identifySnapshot(await readVerified(db))).root, expected.root);
  } finally { sql.close(); }
});

test("competing lifecycle updates have one winner, retries reuse receipts, and purge failure rolls back", async () => {
  const { db, sql } = database();
  try {
    const [quarantine, other] = await Promise.all([
      transitionBlueprint(db, { id: 19, version: 1, state: "quarantined", key: "a".repeat(64) }),
      transitionBlueprint(db, { id: 19, version: 1, state: "verified", key: "b".repeat(64) }),
    ]);
    assert.equal(quarantine.version_int, 2);
    assert.equal(other, null);
    assert.deepEqual(await transitionBlueprint(db, { id: 19, version: 1, state: "quarantined", key: "a".repeat(64) }), quarantine);
    assert.equal((await readVerified(db)).some(row => row.id === 19), false);
    await assert.rejects(purgeBlueprint(db, { id: 19, version: 2, key: "c".repeat(64) }), /FOREIGN KEY/);
    assert.equal(sql.prepare("SELECT count(*) AS n FROM blueprint_write_receipts WHERE key=?").get("c".repeat(64)).n, 0);
    assert.equal(sql.prepare("SELECT state FROM blueprint_lifecycle WHERE lesson_id=19").get().state, "quarantined");
    const restored = await transitionBlueprint(db, { id: 19, version: 2, state: "verified", key: "d".repeat(64) });
    assert.equal(restored.version_int, 3);
    assert.equal((await identifySnapshot(await readVerified(db))).root, expected.root);
    assert.throws(() => sql.exec("UPDATE blueprint_lessons SET operations='No version bump' WHERE id=1"), /version transition/);
    await transitionBlueprint(db, { id: 1, version: 1, state: "quarantined", key: "e".repeat(64) });
    const purged = await purgeBlueprint(db, { id: 1, version: 2, key: "f".repeat(64) });
    assert.equal(purged.state, "purged");
    assert.equal(sql.prepare("SELECT id FROM blueprint_lessons WHERE id=1").get(), undefined);
  } finally { sql.close(); }
});

test("equal roots transfer no row data, and a changed root transfers only its changed branch", async () => {
  const { db, sql } = database();
  try {
    const calls = [];
    const fetcher = (path, init) => {
      calls.push(path);
      const url = new URL(path, "https://academy.test");
      return curriculumProof(new Request(url, init), { DB: db }, url.searchParams);
    };
    const baseline = await syncCurriculum(null, fetcher);
    assert.equal(baseline.manifest.root, expected.root);
    assert.equal(calls.length, 2);
    calls.length = 0;
    assert.equal(await syncCurriculum(baseline, fetcher), baseline);
    assert.deepEqual(calls, ["/api/integrity"]);
    calls.length = 0;
    sql.exec("UPDATE blueprint_lessons SET clue_prompt='Verified revised wording',version_int=version_int+1 WHERE id=7");
    const updated = await syncCurriculum(baseline, fetcher);
    assert.equal(calls.length, 2);
    assert.match(calls[1], new RegExp("branches=" + branchFor(7) + "&"));
    assert.notEqual(updated.manifest.root, expected.root);
    assert.equal(updated.rows.find(row => row.id === 7).clue_prompt, "Verified revised wording");
    const stale = new URL(`https://academy.test/api/integrity?branches=7&root=${expected.root}`);
    assert.equal((await curriculumProof(new Request(stale), { DB: db }, stale.searchParams)).status, 409);
  } finally { sql.close(); }
});

test("modified DB mechanics and tampered offline rows fail verification", async () => {
  const { db, sql } = database();
  try {
    const matching = { manifest: expected, rows: structuredClone(fixture) };
    matching.rows[0].clue_prompt = "Tampered offline content";
    await assert.rejects(syncCurriculum(matching, async () => new Response(null, { status: 304 })), /Offline integrity/);
    sql.exec("UPDATE blueprint_lessons SET operations='Corrupted mechanic',version_int=version_int+1 WHERE id=7");
    await assert.rejects(readVerified(db), /Integrity check failed for lesson 7/);
  } finally { sql.close(); }
});

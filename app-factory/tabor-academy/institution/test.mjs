import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import assert from "node:assert/strict";
import { blueprint, blueprintSource, buildWorker, civics, release } from "./build.mjs";
import { createInstitution } from "./runtime.mjs";

const call = createInstitution(blueprint, release, civics);
const staffToken = "local-test-staff-key-that-is-at-least-thirty-two";
const url = "https://academy.invalid/institution";
const migration = name => readFileSync(new URL("migrations/" + name + ".sql", import.meta.url), "utf8");

function fixtures() {
  const db = new DatabaseSync(":memory:");
  for (const name of ["0001_institution", "0002_foundations", "0003_comparative_civics"]) {
    db.exec(migration(name));
    db.exec(migration(name));
  }
  const cache = new Map();
  const reads = [];
  const env = {
    ACADEMY_STAFF_TOKEN: staffToken,
    ACADEMY_CACHE: { get: key => cache.get(key), put: async (key, value) => cache.set(key, value) },
    ACADEMY_LIBRARY: { get: async key => {
      reads.push(key);
      return { text: async () => blueprintSource };
    } },
    ACADEMY_DB: { prepare: sql => {
      const statement = db.prepare(sql);
      const bind = (...args) => ({
        all: async () => ({ results: statement.all(...args) }),
        first: async () => statement.get(...args) ?? null,
        run: async () => ({ meta: { changes: statement.run(...args).changes } }),
      });
      return { bind, ...bind() };
    } },
  };
  const ctx = { waitUntil: promise => { void promise; } };
  const get = (path, init) => call(new Request(url + path, init), env, ctx);
  const post = (path, value, staff = false) => get(path, {
    method: "POST", body: JSON.stringify(value),
    headers: { "content-type": "application/json", ...(staff && { authorization: "Bearer " + staffToken }) },
  });
  return { db, get, post, reads };
}

test("preserves the live Academy structure and replaces its Institution block on redeploy", () => {
  const source = 'const page = "<main>Academy</main>";\nexport default {\n  async fetch(request, env) {\n    const { pathname } = new URL(request.url);\n    return new Response(pathname);\n  }\n};\n';
  const assembled = buildWorker(source);
  assert.match(assembled, /Academy<p><a[^>]+institution\//);
  assert.match(assembled, /async fetch\(request, env, ctx\)/);
  assert.match(assembled, /new Response\(pathname\)/);
  assert.equal(buildWorker(assembled), assembled);
});

test("serves all nine pillars, public data and the R2 blueprint through KV", async () => {
  const { get, reads } = fixtures();
  const home = await get("/?score=90");
  assert.match(await home.text(), /90% · Mastery reached/);
  const health = await (await get("/healthz")).json();
  assert.equal(health.pillars, 9);
  assert.equal(health.release, release);
  for (const name of ["curricula", "syllabi", "scope", "lessons", "assessments", "pedagogy", "library", "governance"]) {
    assert.equal((await get("/api/" + name)).status, 200);
  }
  assert.equal((await (await get("/blueprint.json")).json()).meta.institution, "Tabor Academy");
  assert.equal((await get("/blueprint.json")).status, 200);
  assert.deepEqual(reads, ["institution/blueprint-1.0.0.json"]);
  assert.equal((await get("/", { method: "HEAD" })).body, null);
});

test("practice validates scores without creating any student record", async () => {
  const { db, post } = fixtures();
  for (const score of [89.99, 90, 100]) {
    const result = await post("/api/assessments/grade", { assessment_id: "evidence-mastery", score, student_id: "untrusted" });
    assert.equal(result.status, 200);
    const value = await result.json();
    assert.equal(value.mastery_achieved, score >= 90);
    assert.equal(value.transcript_recorded, false);
  }
  for (const score of [101, -1, "90", null]) {
    assert.equal((await post("/api/assessments/grade", { assessment_id: "evidence-mastery", score })).status, 400);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM transcript_ledger").get().n, 0);
});

test("staff enrollment, attendance, and transcript writes respect access and append-only rules", async () => {
  const { db, get, post } = fixtures();
  assert.equal((await get("/api/transcripts?student_id=local-student")).status, 401);
  const student = { student_id: "local-student", full_name: "Local test enrollment", enrollment_date: "2026-11-20" };
  assert.equal((await post("/api/students", student)).status, 401);
  assert.equal((await post("/api/students", student, true)).status, 201);
  assert.equal((await post("/api/attendance", { ...student, syllabus_id: "question-to-evidence", session_date: "2026-11-20", status: "present" }, true)).status, 200);
  const grade = { student_id: student.student_id, assessment_id: "evidence-mastery", score: 90 };
  assert.equal((await post("/api/transcripts/record", { ...grade, assessment_id: "source-check" }, true)).status, 400);
  assert.equal((await (await post("/api/transcripts/record", { ...grade, score: 89 }, true)).json()).transcript_recorded, false);
  assert.equal((await post("/api/transcripts/record", grade, true)).status, 201);
  assert.equal((await post("/api/transcripts/record", grade, true)).status, 200);
  assert.equal((await post("/api/transcripts/record", { ...grade, score: 100 }, true)).status, 409);
  const result = await get("/api/transcripts?student_id=local-student", { headers: { authorization: "Bearer " + staffToken } });
  const [record] = await result.json();
  assert.equal(record.score, 90);
  assert.equal(record.credits_earned, 0);
  assert.throws(() => db.exec("UPDATE transcript_ledger SET score = 100"), /append-only/);
  assert.throws(() => db.exec("DELETE FROM transcript_ledger"), /append-only/);
});

test("publishes and grades the comparative civics unit without creating student records", async () => {
  const { db, get, post } = fixtures();
  assert.match(await (await get("/civics/")).text(), /Comparative Civics/);
  assert.match(await (await get("/civics/?score=90")).text(), /Mastery reached/);
  assert.equal(await (await get("/civics/source.txt")).text(), civics.source);
  for (const score of [89, 90]) {
    const response = await post("/api/assessments/grade", { assessment_id: "civics-mastery", score });
    assert.equal(response.status, 200);
    const grade = await response.json();
    assert.equal(grade.mastery_achieved, score === 90);
    assert.equal(grade.transcript_recorded, false);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM transcript_ledger").get().count, 0);
});

test("registers the civics lesson once in the deployed Academy map", () => {
  const base = 'const page = "<main>Academy</main>";\nexport default { async fetch(request, env) {\n    const { pathname } = new URL(request.url);\n  } };\n';
  const initial = buildWorker(base).replace("export default {", "const academyApp = {");
  const existing = { catalog: { "History and the record": [["/existing/", "Existing", "existing"]] }, relations: {} };
  const assembled = buildWorker(initial + "export default createAcademyNavigation(academyApp, " + JSON.stringify(existing) + ");\n");
  assert.match(assembled, /"\/institution\/civics\/","Comparative Civics/);
  assert.match(assembled, /"\/existing\/","Existing"/);
  assert.equal(buildWorker(assembled), assembled);
});

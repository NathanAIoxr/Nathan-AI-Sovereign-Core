import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import assert from "node:assert/strict";
import { blueprint, blueprintSource, buildWorker, civics, foundation, release } from "./build.mjs";
import { foundationQuote } from "./foundation.mjs";
import { createInstitution } from "./runtime.mjs";
import { learningMethods, seedSql } from "./learning-methods/data.mjs";
import { createLearningMethods } from "./learning-methods/runtime.mjs";
import { academyLearningSite, worldLearningSite } from "./learning-methods/sites.mjs";

const call = createInstitution(blueprint, release, civics, foundation, foundationQuote);
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

const expectedFoundation = `If you don’t know truth, you don’t know True love because love without truth is tough love …

while love with truth is unconditional love

The motto, heart, soul, shadow, spirit, nothing and everything of Tabor Academy`;
const expectedFoundationHTML = "<blockquote>" +
  expectedFoundation.split("\n\n").map(paragraph => "<p>" + paragraph + "</p>").join("") +
  "</blockquote>";

test("preserves the Academy structure and renders the assembled release without duplicate panels", async () => {
  const source = `const page = "<main><h1>Academy</h1></main>";
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    return new Response(pathname === "/" ? page : pathname);
  }
};
`;
  const assembled = buildWorker(source);
  assert.match(assembled, /<\/h1><!-- BEGIN TABOR ACADEMY FOUNDATION -->/);
  assert.equal(assembled.match(/BEGIN TABOR ACADEMY FOUNDATION/g).length, 1);
  assert.equal(buildWorker(assembled), assembled);
  const { default: worker } = await import("data:text/javascript;base64," + Buffer.from(assembled).toString("base64"));
  const get = path => worker.fetch(new Request("https://academy.invalid" + path), {});
  const home = await (await get("/")).text();
  assert.ok(home.includes(foundation.path));
  assert.match(home, /Nine-Pillar Academy/);
  assert.ok(home.includes(expectedFoundationHTML));
  const lesson = await get("/institution/foundation/");
  assert.equal(lesson.status, 200);
  assert.ok((await lesson.text()).includes(expectedFoundationHTML));
  const architecture = await get("/institution/foundation/architecture/");
  assert.equal(architecture.status, 200);
  const architectureHTML = await architecture.text();
  assert.match(architectureHTML, /Conductor blueprint/);
  assert.match(architectureHTML, /href="[^"]+library-handoff\/"/);
  assert.equal(await (await get("/institution/foundation/architecture/source.txt")).text(), foundation.architecture.source);
  assert.equal(await (await get("/library/")).text(), "/library/");
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

test("serves Nathan’s entire foundation statement verbatim without a database", async () => {
  const get = (path, init) => call(new Request(url + path, init), {});
  const source = await get("/foundation/source.txt");
  assert.equal(source.status, 200);
  assert.equal(await source.text(), expectedFoundation);
  const page = await get("/foundation/");
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes(expectedFoundationHTML));
  assert.doesNotMatch(html, /Seven principles|Worked response|Build the record/i);
  assert.match(html, /href="\/tabor-academy\/truth-lab\/"/);
  assert.equal((await get("/foundation/", { method: "HEAD" })).body, null);
  assert.equal((await get("/foundation/", { method: "POST" })).status, 405);
});

test("serves the authored Library of Tabor packet and its exact copy-and-paste block", async () => {
  const path = "/foundation/library-handoff";
  const get = suffix => call(new Request(url + path + suffix), {});
  const original = readFileSync(new URL("library-handoff.txt", import.meta.url), "utf8");
  assert.equal(await (await get("/source.txt")).text(), original);
  const [, fromHeader] = original.split("\ntext\n");
  const [expectedBlock] = fromHeader.split("\nUse code with caution.");
  const block = await (await get("/conductor.txt")).text();
  assert.equal(block, expectedBlock);
  assert.match(block, /^=== CONDUCTOR HANDOFF: THE LIBRARY OF TABOR/);
  assert.match(block, /5\. CONDUCTOR EXECUTION RULES:/);
  const html = await (await get("/")).text();
  assert.match(html, /The Nine Cars Axiom: Nine real cars/);
  assert.match(html, /href="[^"]+conductor\.txt"/);
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
  assert.match(assembled, /"\/institution\/foundation\/","Tabor Academy Foundation"/);
  assert.match(assembled, /"\/institution\/foundation\/library-handoff\/","Library of Tabor Conductor Handoff"/);
  assert.equal(buildWorker(assembled), assembled);
});

test("stores all original learning methods and five channels in an idempotent D1 migration", () => {
  const { db } = fixtures();
  const sql = migration("0004_learning_methods");
  assert.equal(sql, seedSql());
  db.exec(sql);
  db.exec(sql);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM academy_learning_methods").get().count, 101);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM academy_learning_channels").get().count, 5);
  assert.equal(db.prepare("SELECT original_text FROM academy_learning_methods WHERE id=101").get().original_text, learningMethods.methods[100].original);
});

test("both programs have all 101 activities, five checkpoints and verbatim downloads", async () => {
  for (const site of [academyLearningSite, worldLearningSite]) {
    const fetch = createLearningMethods(learningMethods, site);
    const call = (suffix, init) => fetch(new Request("https://learn.invalid" + site.route + suffix, init));
    const ids = learningMethods.methods.map(method => method.id);
    for (const id of ids) {
      const html = await (await call("/" + id + "/")).text();
      assert.equal((html.match(/type="checkbox"/g) ?? []).length, 5);
      assert.ok(html.includes(site.sibling + "/" + id + "/"));
    }
    const i = await (await call("/?q=Stargazing")).text();
    assert.match(i, /Stargazing/);
    assert.doesNotMatch(i, /Lunar Cycles/);
    assert.equal(await (await call("/source.txt")).text(), learningMethods.source);
    assert.equal((await call("/102/")).status, 404);
    assert.equal((await call("/", { method: "POST" })).status, 405);
    assert.equal(await (await call("/1/", { method: "HEAD" })).text(), "");
    assert.equal((await (await call("/api/methods")).json()).methods.length, 101);
  }
});

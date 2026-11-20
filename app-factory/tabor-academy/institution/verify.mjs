import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import { blueprintSource, civics, foundation, release } from "./build.mjs";

const config = JSON.parse(await readFile(new URL("cloudflare.json", import.meta.url), "utf8"));
const curl = promisify(execFile);
async function fetchRoute(path, options = {}) {
  const args = ["--silent", "--show-error", "--max-time", "20", "--write-out", "\n%{http_code}", "--url", config.publicUrl + path];
  if ("body" in options) args.push("--header", "Content-Type: application/json", "--data", JSON.stringify(options.body));
  const { stdout } = await curl("curl", args, { maxBuffer: 2 ** 22 });
  const status = +stdout.slice(-3);
  assert.equal(status, options.status ?? 200, path + " status");
  return stdout.slice(0, -4);
}

const checks = [
  async () => assert.match(await fetchRoute("/"), /Nine-Pillar Academy/),
  async () => {
    const home = await fetchRoute("/");
    const lesson = await fetchRoute("/institution/foundation/");
    for (const paragraph of foundation.statement.split("\n\n")) {
      assert.ok(home.includes(paragraph));
      assert.ok(lesson.includes(paragraph));
    }
    assert.equal(await fetchRoute("/institution/foundation/source.txt"), foundation.statement);
    const architecture = await fetchRoute("/institution/foundation/architecture/");
    assert.match(architecture, /Conductor blueprint/);
    assert.equal(await fetchRoute("/institution/foundation/architecture/source.txt"), foundation.architecture.source);
    const path = "/institution/foundation/architecture/";
    const handoff = JSON.parse(await fetchRoute(path + "conductor.json"));
    assert.deepEqual(handoff, { ...foundation.architecture.conductor, release });
    assert.match(await fetchRoute(path + "practice/?source=object&index=edition&equation=version&family=cleared"), /4 of 4 correct/);
    assert.ok((await fetchRoute("/map/")).includes(foundation.title));
    assert.match(await fetchRoute("/map/"), /The Architecture of Everything and Nothing/);
    const coursePath = path + "course/";
    const course = await fetchRoute(coursePath);
    assert.match(architecture, /architecture\/course\//);
    assert.match(course, /8 modules/);
    await Promise.all(foundation.architecture.course.modules.map(async module => {
      const html = await fetchRoute(coursePath + module.id + "/?answer=" + module.check.correct);
      assert.match(html, /How to operate without this world stupidity/);
      assert.match(html, /Correct\./);
    }));
    assert.match(await fetchRoute(coursePath + "worksheet.txt"), /PROTECT THE ONE/);
    const libraryHandoff = "/institution/foundation/library-handoff/";
    assert.match(await fetchRoute(libraryHandoff), /The Nine Cars Axiom/);
    assert.equal(await fetchRoute(libraryHandoff + "source.txt"), foundation.libraryHandoff.source);
    assert.equal(await fetchRoute(libraryHandoff + "conductor.txt"), foundation.libraryHandoff.block);
    const realityMath = await fetchRoute("/institution/foundation/reality-math/");
    assert.match(realityMath, /9 × 0 = 0 dollars/);
    assert.match(realityMath, /1 − 1 = 0 active registrations/);
    assert.match(realityMath, /id="capstone"/);
    const money = "/institution/foundation/reality-math/million-dollar/";
    assert.match(await fetchRoute(money), /\$800,000 taken out \+ \$200,000 paid/);
    assert.match(await fetchRoute(money + "?rate=0"), /\$0 taken out \+ \$1,000,000 paid/);
    assert.equal(await fetchRoute(money + "source.txt"), foundation.millionDollar.source);
    assert.match(await fetchRoute("/map/"), /The Million-Dollar Multiplication Test/);
    const apples = "/institution/foundation/three-apples/";
    const applesPage = await fetchRoute(apples);
    assert.match(applesPage, /id="infancy"/);
    assert.match(applesPage, /id="graduate"/);
    assert.match(applesPage, /id="practice-audit"/);
    assert.match(applesPage, /id="tabor-materials"/);
    assert.match(applesPage, /id="references"/);
    assert.equal(await fetchRoute(apples + "source.txt"), foundation.threeApples.source);
    assert.match(await fetchRoute("/map/"), /The Three Apples Reality/);
    assert.match(await fetchRoute("/map/"), /Reality Math · Multiplication and Subtraction/);
    assert.match(await fetchRoute("/map/"), /Library of Tabor Conductor Handoff/);
  },
  async () => assert.match(await fetchRoute("/library/"), /Library of Tabor/),
  async () => assert.match(await fetchRoute("/workbench/"), /Workbench/),
  async () => assert.match(await fetchRoute("/order/ancient-servitude/"), /Ancient Servitude/),
  async () => assert.match(await fetchRoute("/institution/"), /From Question to Evidence/),
  async () => assert.match(await fetchRoute("/institution/?score=90"), /Mastery reached/),
  async () => assert.match(await fetchRoute("/institution/civics/?score=90"), /Mastery reached/),
  async () => assert.equal(await fetchRoute("/institution/civics/source.txt"), civics.source),
  async () => assert.match(await fetchRoute("/map/"), /Comparative Civics/),
  async () => {
    const base = "/institution/learning-methods";
    const data = JSON.parse(await fetchRoute(base + "/api/methods"));
    assert.equal(data.methods.length, 101);
    assert.equal(data.channels.length, 5);
    assert.match(await fetchRoute(base + "/101/"), /Self-Mastery/);
    assert.match(await fetchRoute("/map/"), /101 Hands-On Learning Methods/);
  },
  async () => {
    const base = "/institution/mastery/";
    const catalog = JSON.parse(await fetchRoute(base + "curriculum.json"));
    assert.equal(catalog.historical.methods, 131);
    assert.match(await fetchRoute(base + "timeline/"), /18 later stations/);
    assert.match(await fetchRoute(base + "conductor.json"), /Human Learning, Survival & Mastery/);
    assert.match(await fetchRoute("/map/"), /Human Learning, Survival &amp; Mastery|Human Learning, Survival & Mastery/);
    assert.match(await fetchRoute(base + "practice.js"), /localStorage/);
    await Promise.all(catalog.tracks.map(async track => {
      assert.ok((await fetchRoute(base + track.id + "/")).includes("Capstone"));
      const first = base + track.id + "/" + track.courses[0].id + "/";
      assert.match(await fetchRoute(first), /Check your reasoning/);
      assert.match(await fetchRoute(first + "worksheet.txt"), /Independent review/);
      assert.match(await fetchRoute(base + "capstone/" + track.capstone + "/"), /First decision/);
    }));
  },
  async () => assert.equal(await fetchRoute("/institution/blueprint.json"), blueprintSource),
  async () => {
    const health = JSON.parse(await fetchRoute("/institution/healthz"));
    assert.equal(health.pillars, 9);
    assert.equal(health.release, release);
  },
  async () => {
    for (const score of [89, 90]) {
      const grade = JSON.parse(await fetchRoute("/institution/api/assessments/grade", {
        body: { assessment_id: "evidence-mastery", score },
      }));
      assert.equal(grade.mastery_achieved, score >= 90);
      assert.equal(grade.transcript_recorded, false);
    }
  },
  async () => {
    await fetchRoute("/institution/api/transcripts?student_id=verification", { status: 401 });
    await fetchRoute("/institution/api/students", { status: 401, body: { student_id: "verification" } });
  },
];
await Promise.all(checks.map(check => check()));
console.log("Live Academy checks passed", release);

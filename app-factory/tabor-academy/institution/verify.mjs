import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import { blueprintSource, civics, release } from "./build.mjs";
import { foundation } from "./foundation.mjs";

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
    assert.ok((await fetchRoute("/map/")).includes(foundation.title));
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

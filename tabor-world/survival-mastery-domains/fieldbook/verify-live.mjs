import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { survivalDomains } from "../survival-mastery-domains-data.mjs";

const curl = promisify(execFile);
const fieldbook = survivalDomains.academy + "fieldbook/";
const world = "https://tabor-world.nathantaboract.workers.dev/survival-mastery-domains/";
async function read(url) {
  const { stdout } = await curl("curl", ["-fsS", "--retry", "2", "--max-time", "25", url], { maxBuffer: 2 ** 20 });
  return stdout;
}
const [home, worldHome, course, catalogText, print] = await Promise.all([
  read(fieldbook), read(world), read(survivalDomains.academy), read(fieldbook + "catalog.json"), read(fieldbook + "print/"),
]);
assert.match(home, /Six Domains Fieldbook/);
assert.ok(worldHome.includes(fieldbook));
assert.match(course, /data-fieldbook/);
assert.equal((print.match(/data-lab=/g) ?? []).length, 7);
const catalog = JSON.parse(catalogText);
assert.equal(catalog.labCount, 6);
assert.equal(catalog.lessonCount, 27);
const allLessons = [];
await Promise.all(catalog.labs.map(async lab => {
  const page = await read(fieldbook + lab.id + "/");
  assert.match(page, /Compare with the worked response/);
  for (const lesson of lab.lessons) {
    assert.ok(page.includes(lesson.academy));
    allLessons.push(lesson);
  }
}));
assert.equal(new Set(allLessons.map(lesson => lesson.academy)).size, 27);
for (let offset = 0; offset < allLessons.length; offset += 7) {
  await Promise.all(allLessons.slice(offset, offset + 7).map(async lesson => {
    const html = await read(lesson.academy);
    assert.match(html, /<!doctype html>/i, lesson.academy);
    assert.doesNotMatch(html, /mission not found|lesson not found/i, lesson.academy);
  }));
}
for (const count of [8, 9]) {
  const query = new URLSearchParams({ grade: "1" });
  for (let i = 1; i <= count; i++) query.append("met", String(i));
  const result = await read(fieldbook + "capstone/?" + query);
  assert.match(result, count === 9 ? /9\/10 · Mastery reached/ : /8\/10 · Review/);
}
console.log("Verified six labs, 27 Academy lesson destinations, print edition, both entry links, and the capstone mastery boundary.");

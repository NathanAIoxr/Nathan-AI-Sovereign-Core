import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/";
const revision = process.argv[2];
assert.match(revision ?? "", /^[a-f0-9]{40}$/);
async function get(path) {
  const response = await fetch(root + path, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
  assert.equal(response.status, 200, path);
  return response;
}
const health = await (await get("big-bang/healthz")).json();
assert.deepEqual(health, { service: "tabor-academy-big-bang", ready: true, revision, ok: true, project: "tabor-academy-big-bang", release: revision });
for (const [path, filename] of [["big-bang/", "index.html"], ["big-bang/style.css", "style.css"], ["big-bang/app.js", "app.js"]]) {
  const response = await get(path);
  assert.equal(response.headers.get("x-tabor-big-bang-revision"), revision);
  assert.ok(await response.text() === await readFile(new URL(filename, import.meta.url), "utf8"), filename);
}
for (const path of ["", "map/", "truth-lab/", "minds/?mind=creator.nathan-tabor"]) {
  assert.match(await (await get(path)).text(), /data-academy-big-bang/);
}
assert.ok(await (await get("big-bang/source.txt")).text() === await readFile(new URL("author.txt", import.meta.url), "utf8"));
assert.match(await (await get("big-bang/lesson/")).text(), /One line, four checks/);
assert.match(await (await get("")).text(), /aria-label="Tabor Academy motto"/);
console.log(JSON.stringify(health));

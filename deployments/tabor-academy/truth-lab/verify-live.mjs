import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import expectedCases from "./cases.mjs";

const academy = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/";
const get = path => execFileSync("curl", ["--fail", "--silent", "--show-error", "--retry", "2", "--max-time", "25", academy + path], {encoding:"utf8"});
const health = JSON.parse(get("truth-lab/healthz"));
assert.equal(health.service, "tabor-academy-truth-lab");
assert.equal(health.ready, true);
assert.match(health.release, /^[a-f0-9]{40}$/u);
if (process.argv[2]) assert.equal(health.release, process.argv[2]);

const {cases} = JSON.parse(get("truth-lab/cases.json"));
assert.deepEqual(cases, expectedCases);
assert.equal(health.cases, cases.length);
const html = get("truth-lab/");
assert.match(html, /Build your proof sheet/u);
assert.match(html, /Compare with another case/u);

const {missions} = JSON.parse(get("way/catalog.json"));
const indexed = new Set(missions.filter(item => item.path === "humanities").map(item => item.slug));
for (const {id} of cases) assert.ok(indexed.has(`truth-map-${id}`), id);
assert.ok(indexed.has("truth-vs-the-made-up-truth"));
assert.match(get("way/humanities/truth-vs-the-made-up-truth/"), /truth-lab\//u);
console.log(JSON.stringify({ready:true,release:health.release,cases:cases.length,academyIndex: true}));

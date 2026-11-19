import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { units } from "./units.mjs";
import { findEntries, records } from "./public/common/tools.mjs";
import { newRound, swapped, twisted } from "./public/common/games.mjs";
import { originalT, sections } from "./public/common/corpus.mjs";

const project = new URL("./", import.meta.url);
const out = await mkdtemp(join(tmpdir(), "alphabet-test-"));
after(() => rm(out, { recursive: true, force: true }));
execFileSync(process.execPath, ["build.mjs", out], { cwd: project });
const manifest = JSON.parse(await readFile(join(out, "manifest.json"), "utf8"));

test("the 23 featured letter groups, their central entries, and source line retain their identity", async () => {
  assert.equal(sections.map(section => section.letter).join(""), "ABCGHIJKLMNOPQRSTUVWXYZ");
  assert.ok(sections.every(section => section.core.length === 3));
  assert.equal(records.length, 170);
  assert.equal(new Set(records.map(record => record.id)).size, records.length);
  assert.deepEqual(findEntries("ma’at").map(record => record.name), ["Anubis"]);
  assert.ok(findEntries("truth", "v").every(record => record.letter === "V"));
  const exact = await readFile(new URL("public/alphabet-books/t-original.txt", project), "utf8");
  assert.equal(exact.trimEnd(), originalT);
});

test("games provide scored clue options and a two-swap solution for every trio", () => {
  for (let seed = 0; seed < 20; seed++) {
    let state = seed;
    const questions = newRound(() => ((state = (state * 1103515245 + 12345) >>> 0) / 2 ** 32));
    assert.equal(questions.length, 6);
    assert.equal(new Set(questions.map(q => q.correct.id)).size, questions.length);
    for (const { correct, choices } of questions) {
      assert.equal(choices.length, 4);
      assert.equal(new Set(choices.map(choice => choice.id)).size, 4);
      assert.ok(choices.includes(correct));
      assert.ok(choices.every(choice => choice.letter === correct.letter));
    }
  }
  for (const section of sections.filter(s => s.core.length)) {
    const target = section.core.map(entry => entry[0]);
    assert.notDeepEqual(twisted(target), target);
    assert.deepEqual(swapped(swapped(twisted(target), 0, 1), 1, 2), target);
  }
});

async function request(unit, path = "", options) {
  const { default: worker } = await import(pathToFileURL(join(out, unit.id + ".mjs")));
  return worker.fetch(new Request(unit.url + path, options));
}

test("all independent Workers serve the correct release and route static content", async () => {
  assert.equal(new Set(units.map(unit => unit.worker)).size, 8);
  for (const unit of units) {
    assert.equal((await request(unit, "healthz")).status, 200);
    assert.deepEqual(await (await request(unit, "healthz")).json(), {
      ok: true, site: unit.id, release: manifest.find(row => row.id === unit.id).release,
    });
    const page = await request(unit);
    assert.ok((await page.text()).includes("<h1>" + unit.name + "</h1>"));
    assert.match(page.headers.get("Content-Security-Policy"), /default-src 'none'/);
    assert.equal((await request(unit, "common/style.css")).status, 200);
    const conditional = await request(unit, "", { headers: { "If-None-Match": 'W/' + page.headers.get("ETag") } });
    assert.equal(conditional.status, 304);
    const head = await request(unit, "", { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assert.equal((await request(unit, "", { method: "POST" })).status, 405);
    assert.equal((await request(unit, "missing")).status, 404);
  }
});

test("the SDK and downloadable assets are real files with usable media types", async () => {
  const get = id => units.find(unit => unit.id === id);
  const sdk = get("alphabet-sdk");
  const { entries } = await (await request(sdk, "api/lexicon?letter=a&q=strategic")).json();
  assert.deepEqual(entries.map(entry => entry.name), ["Athena"]);
  assert.equal((await request(sdk, "api/lexicon?letter=D")).status, 400);
  assert.deepEqual((await (await request(sdk, "api/lexicon?letter=K&q=Arjuna")).json()).entries.map(entry => entry.name), ["Krishna"]);
  for (const number of [1, 2, 3, 4, 5]) {
    const epub = await request(get("alphabet-books"), "volume-" + number + ".epub");
    assert.equal(epub.headers.get("content-type"), "application/epub+zip");
    assert.equal(new Uint8Array(await epub.arrayBuffer())[0], 0x50);
  }
  const rtl = await request(get("alphabet-hardware"), "alphabet-registers.sv");
  assert.match(await rtl.text(), /always_ff @\(posedge clock\)/);
  const pwa = get("alphabet-field-app");
  const app = await (await request(pwa, "manifest.webmanifest")).json();
  assert.equal(app.scope, "./");
  for (const icon of app.icons) assert.equal((await request(pwa, icon.src)).headers.get("content-type"), "image/png");
});

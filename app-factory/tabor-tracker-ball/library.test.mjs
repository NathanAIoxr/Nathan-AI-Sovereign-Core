import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";
import { catalog } from "./public/games.mjs";
import { applyCharge, cartridgeRecord, cast, clearRecords, initialRound, pilots, searchRecords, toggleRecord, verifySelection } from "./public/library-core.mjs";

const data = JSON.parse(await readFile(new URL("./public/library-catalog.json", import.meta.url), "utf8"));
const { cartridges, classes, trackerDraft } = data;

test("101 original positions and all 21 main classes are recoverable", () => {
  assert.deepEqual(cartridges.map(item => item.id), Array.from({length: 101}, (_, i) => i + 1));
  assert.deepEqual(new Set(cartridges.map(item => item.class)), new Set(Object.keys(classes)));
  assert.equal(Object.keys(classes).length, 21);
  assert.deepEqual(searchRecords(cartridges, {text: "anatomy qm"}).map(x => [x.id, x.class]), [[77, "Q"]]);
  assert.ok(searchRecords(cartridges, {category: "E"}).length > 0);
  assert.ok(searchRecords(cartridges, {category: "F"}).length > 0);
});

test("the Tracker Ball fragment keeps its recorded stopping point and valid cross-references", () => {
  assert.deepEqual(trackerDraft.map(item => item.id), Array.from({length: 65}, (_, i) => i + 1));
  assert.equal(trackerDraft.filter(row => row.complete).length, 64);
  assert.equal(trackerDraft.at(-1).complete, false);
  assert.ok(trackerDraft.every(row => row.related.every(id => cartridges.some(item => item.id === id))));
  assert.ok(searchRecords(trackerDraft, {category: "E"}).some(item => item.class === "E/F"));
});

test("each advertised exercise is resolvable and linked games exist", () => {
  assert.deepEqual(cartridges.filter(item => item.status === "prototype").map(item => item.id), Object.keys(pilots).map(Number));
  assert.ok(cartridges.filter(item => item.game).every(item => Object.hasOwn(catalog, item.game)));
  assert.ok(cartridges.every(item => cartridgeRecord(item).kind === "non-character"));
  assert.ok(cast.every(actor => actor.kind === "character" && actor.functionalities.length));
  for (const pilot of Object.values(pilots)) {
    assert.equal(pilot.records.length, 3);
    let round = pilot.required.reduce(toggleRecord, initialRound());
    round = verifySelection(round, pilot.required);
    assert.equal(round.charge, 1);
    assert.equal(verifySelection(round, pilot.required), round);
    round = applyCharge(round);
    assert.equal(round.points, 1);
    assert.equal(round.charge, 0);
    assert.equal(applyCharge(round), round);
  }
});

test("bad or repeated selections do not generate a charge", () => {
  const starting = initialRound();
  assert.equal(applyCharge(starting), starting);
  assert.equal(toggleRecord(starting, "Other"), starting);
  const partial = toggleRecord(starting, "A");
  assert.equal(verifySelection(partial, pilots[68].required), partial);
  assert.deepEqual(clearRecords(partial), starting);
  assert.deepEqual(toggleRecord(partial, "A"), starting);
});

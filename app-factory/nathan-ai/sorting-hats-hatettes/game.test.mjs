import assert from "node:assert/strict";
import { test } from "node:test";
import { alphabet, canOpen, catalogSize, materials, pairAt, realms, restoreProgress, spinWord } from "./public/game.mjs";

test("2,498 individual hats and hatettes have unique realm-specific catalog entries", () => {
  const pairs = new Set(["winter"]);
  for (let r=0;r<realms.length;r++) {
    for (let l=0;l<alphabet.length;l++) {
      for (let m=0;m<materials.length;m++) pairs.add(pairAt(r,l,m).id);
    }
  }
  assert.equal(pairs.size*2,catalogSize);
  assert.equal(catalogSize,2498);
  assert.match(pairAt(0,0,0,true).hatette,/Solstice Crown/u);
});

test("every gate evaluates dial order, reading direction and held items", () => {
  for (const [index,realm] of realms.entries()) {
    const claims = [pairAt(index,0,0).id];
    assert.ok(canOpen(index,realm.turns,realm.reverse,claims));
    assert.ok(!canOpen(index,[...realm.turns].reverse(),realm.reverse,claims));
    assert.ok(!canOpen(index,realm.turns,!realm.reverse,claims));
    assert.ok(!canOpen(index,realm.turns,realm.reverse,["winter"]));
  }
});

test("the suffix spinner keeps the named pairs and accepts other words", () => {
  assert.equal(spinWord("  Girl "), "girlette");
  assert.equal(spinWord("Dude"),"dudette");
  assert.equal(spinWord("crown"),"crownette");
  assert.equal(spinWord(""),"");
});

test("reopening a realm preserves progress and accepts older saves", () => {
  const claims = [pairAt(4, 0, 0).id];
  const gates = [4];
  assert.deepEqual(restoreProgress(JSON.stringify({ claims, gates, current: 4 })), {
    claims: new Set(claims), gates: new Set(gates), current: 4,
  });
  assert.deepEqual(restoreProgress(JSON.stringify({ claims, gates })), {
    claims: new Set(claims), gates: new Set(gates), current: 1,
  });
  assert.equal(restoreProgress('{"current":99}').current, 1);
  assert.equal(restoreProgress("{").current, 1);
});

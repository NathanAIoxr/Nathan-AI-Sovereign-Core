import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { crosswalk } from "./mas-crosswalk.mjs";
const canon = JSON.parse(readFileSync(new URL("../nexus-mas-spirit/canon.json", import.meta.url), "utf8"));
test("crosswalk retains both literal spelling variants", () => {
  const out = crosswalk(canon);
  assert.deepEqual(out.spellings.map(x=>x.spelling), ["SANTA SUPMALG","SANTA SUPMALS"]);
  assert.equal(out.unresolved.length,1);
});
test("relationship names are present in the authoritative source", () => {
  const out = crosswalk(canon);
  assert.equal(out.relationships.length,2);
  assert.equal(out.relationships[0].group,"MAS");
  assert.equal(out.relationships[1].group,"SPIRIT");
});
test("crosswalk rejects incomplete canon and cannot publish private assets", () => {
  assert.throws(()=>crosswalk({nodes:[]}),/Missing source/);
  assert.equal(crosswalk(canon).publishesPrivateAssets,false);
});

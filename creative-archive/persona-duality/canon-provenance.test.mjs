import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const canon = JSON.parse(readFileSync(new URL("../nexus-mas-spirit/canon.json", import.meta.url), "utf8"));
const byId = new Map(canon.nodes.map(node => [node.id, node]));

test("MAS SPIRIT author canon keeps both exact spellings with separate provenance", () => {
  assert.equal(canon.author, "Nathan Tabor");
  assert.equal(canon.principles.no_silent_merging, true);
  assert.equal(canon.principles.latest_spelling, "SANTA SUPMALG, supersedes earlier SANTA SUPMALS");
  assert.equal(byId.get("N026")?.name, "SANTA SUPMALG");
  assert.equal(byId.get("N026")?.authority, "user_authored");
  assert.equal(byId.get("N027")?.name, "SANTA SUPMALS");
  assert.equal(byId.get("N027")?.authority, "source_variant");
  assert.notEqual(byId.get("N026")?.type, byId.get("N027")?.type);
});

test("creative names, assistant suggestions and folklore remain distinguishable", () => {
  assert.equal(byId.get("N022")?.authority, "assistant_suggested");
  assert.equal(byId.get("N023")?.authority, "user_authored");
  assert.equal(byId.get("N028")?.description, "MAS SPIRIT = MORE SPIRIT");
  assert.equal(byId.get("N009")?.type, "folklore_figure");
  assert.equal(byId.get("N010")?.type, "scriptural_figure");
  assert.equal(canon.principles.no_spying_expansion.includes("do not invent broader rules"), true);
});

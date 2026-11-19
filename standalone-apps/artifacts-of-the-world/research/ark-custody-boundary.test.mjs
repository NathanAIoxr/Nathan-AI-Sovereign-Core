import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const base = new URL("../", import.meta.url);
const dossier = readFileSync(new URL("./ark-custody-boundary.md", import.meta.url), "utf8");
const original = readFileSync(new URL("../original.txt", import.meta.url), "utf8").trim();
test("author's original request is preserved verbatim", () => assert.ok(dossier.includes("> " + original)));
test("biblical references are not presented as proof of surviving custody", () => {
  for (const passage of ["Exodus 25:10", "1 Samuel 4", "1 Kings 8:1", "2 Chronicles 35:3", "Revelation 11:19"]) assert.ok(dossier.includes(passage));
  assert.match(dossier, /custody unresolved/);
  assert.match(dossier, /unverified/);
  assert.doesNotMatch(dossier, /verified modern location|authenticated surviving ark/i);
});

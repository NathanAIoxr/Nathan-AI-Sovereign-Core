import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("./", import.meta.url);
const dossier = JSON.parse(readFileSync(new URL("ark-custody-boundary.json",root),"utf8"));
const app = JSON.parse(readFileSync(new URL("apps/ark-of-the-covenant/app.json",root),"utf8"));
test("Ark dossier is separately attributed and keeps physical custody unresolved",()=>{
 assert.equal(dossier.project,app.id);
 assert.equal(dossier.identity_status,"unverified");
 assert.equal(dossier.modern_custody_status,"unverified");
 assert.equal(dossier.release,"research_only_not_published");
});
test("Sources identify the limits of their claims",()=>{
 assert.equal(dossier.sources.length,4);
 for(const s of dossier.sources){assert.match(s.url,/^https:\/\//);assert.ok(s.supports.length>40);}
 assert.ok(dossier.unresolved.length>=3);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const source=readFileSync(new URL("original.txt",root),"utf8");
const dossier=JSON.parse(readFileSync(new URL("./elemental-charge-worked-examples.json",import.meta.url),"utf8"));
test("author excerpt remains verbatim",()=>assert.ok(source.includes(dossier.author_excerpt)));
test("positive negative and neutral worked charges are correct",()=>{
 assert.deepEqual(dossier.examples.map(e=>e.charge_e),[1,-1,0]);
 for(const e of dossier.examples)assert.equal(e.protons-e.electrons,e.charge_e);
});
test("claims are source-tagged and custody stays open",()=>{
 assert.ok(dossier.sources.every(s=>s.url.startsWith("https://")&&s.supports));
 assert.ok(dossier.unresolved.length);
 assert.equal(dossier.source_types.author_excerpt,"author quotation");
});

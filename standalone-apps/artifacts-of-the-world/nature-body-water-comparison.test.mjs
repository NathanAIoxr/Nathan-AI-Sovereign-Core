import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const dir=new URL("./",import.meta.url);
const d=JSON.parse(readFileSync(new URL("nature-body-water-comparison.json",dir),"utf8"));
const original=readFileSync(new URL("original.txt",dir),"utf8");
test("creator text stays separate and source-attributed",()=>{
 assert.equal(d.project,"nature-human-body");
 assert.equal(d.status,"research_only_not_published");
 assert.ok(original.includes("only place that dark matter is found is in the human body"));
 assert.ok(d.attribution.includes("not Nathan Tabor verbatim"));
});
test("each side has a distinct mechanism, measured quantity and source",()=>{
 for(const p of d.pairs)for(const side of ["nature","human_body"]){
  assert.ok(p[side].mechanism.length>20);
  assert.ok(p[side].measured_quantity.length>10);
  assert.match(p[side].source,/^https:\/\//);
  assert.ok(p[side].source_support.length>20);
 }
});
test("does not conflate research with proof of identity or dark matter claim",()=>{
 assert.ok(d.unresolved.some(s=>s.includes("dark-matter")));
 assert.ok(d.pairs.every(p=>p.interpretation.includes("does not establish")));
});

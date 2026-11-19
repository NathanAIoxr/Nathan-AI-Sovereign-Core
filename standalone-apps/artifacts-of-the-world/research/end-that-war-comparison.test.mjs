import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const d=JSON.parse(readFileSync(new URL("./end-that-war-comparison.json",import.meta.url),"utf8"));
test("creator wording is separately attributed",()=>{assert.equal(d.creator_claim.classification,"creator_metaphor_not_historical_equivalence");assert.equal(d.creator_claim.source,"../original.txt")});
test("three independent traditions retain separate citations",()=>{assert.equal(d.comparisons.length,3);assert.equal(new Set(d.comparisons.map(x=>x.tradition)).size,3);assert.ok(d.comparisons.every(x=>x.source.startsWith("https://")&&x.supports))});
test("unproven identity and custody claims remain unresolved",()=>{assert.ok(d.unresolved.some(x=>x.includes("adversaries")));assert.ok(d.unresolved.some(x=>x.includes("custody")));assert.equal(d.publishesOriginal,false);assert.equal(d.changesPagesProjects,false)});

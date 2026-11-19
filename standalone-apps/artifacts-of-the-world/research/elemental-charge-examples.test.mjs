import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const d=JSON.parse(readFileSync(new URL("./elemental-charge-examples.json",import.meta.url),"utf8"));
test("worked charges balance from proton and electron counts",()=>{for(const e of d.examples)assert.equal(e.protons-e.electrons,e.charge_e)});
test("three independent charge categories are represented",()=>assert.deepEqual(d.examples.map(x=>x.kind),["positive ion","negative ion","neutral atom"]));
test("creator claim remains attributed and unsupported inference stays open",()=>{assert.equal(d.creator_claim.classification,"creator_claim_not_scientifically_established");assert.ok(d.unresolved.some(x=>x.includes("dark matter")));assert.equal(d.sources.length,2)});

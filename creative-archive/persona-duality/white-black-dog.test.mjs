import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {NODES,EDGES,TASKS} from "./registry.mjs";
const r=JSON.parse(readFileSync(new URL("./research/white-black-dog-source-intake.json",import.meta.url),"utf8"));
test("PD-007 retains two distinct named metaphor nodes",()=>{assert.equal(r.id,"PD-007");assert.ok(TASKS.some(x=>x.id===r.id));for(const e of r.entities){assert.equal(NODES.find(x=>x.id===e.id)?.name,e.label);assert.equal(e.classification,"registry_summary_not_verbatim")}assert.equal(new Set(r.entities.map(x=>x.id)).size,2)});
test("no invented verbatim source or origin",()=>{assert.equal(r.source_integrity.verbatim_original_available,false);assert.equal(r.source_integrity.verbatim_quote,null);assert.equal(r.source_integrity.original_family_story_date,null);assert.equal(r.status,"awaiting_primary_source")});
test("metaphorical edges are not asserted as identity",()=>{for(const x of EDGES.filter(x=>["white-dog","black-dog"].includes(x.from)||["white-dog","black-dog"].includes(x.to))){assert.notEqual(x.relation,"same_as");assert.equal(x.assertion,"creative_crosslink")}assert.equal(r.publication,"metadata_only_no_private_assets")});

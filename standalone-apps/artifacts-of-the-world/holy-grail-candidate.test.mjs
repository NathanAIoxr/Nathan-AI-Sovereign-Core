import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const d=JSON.parse(readFileSync(new URL("./research/holy-grail-candidate-evidence.json",import.meta.url),"utf8"));
const a=JSON.parse(readFileSync(new URL("./apps/holy-grail/app.json",import.meta.url),"utf8"));
test("Grail research remains sourced and classification-separated",()=>{assert.equal(d.id,a.id);assert.equal(d.records.length,3);assert.ok(d.records.every(r=>r.source.startsWith("https://")&&r.supports&&r.does_not_establish));assert.equal(new Set(d.records.map(r=>r.classification)).size,3)});
test("No modern identity or custody leap",()=>{assert.equal(d.status,"open");assert.ok(d.unresolved.some(x=>x.includes("identity")));assert.equal(d.original_txt_modified,false);assert.equal(d.publication,"research_only_no_pages_change")});

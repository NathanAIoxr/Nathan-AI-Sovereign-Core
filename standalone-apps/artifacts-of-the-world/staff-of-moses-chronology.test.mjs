import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const base=new URL("./",import.meta.url);
const d=JSON.parse(readFileSync(new URL("./research/staff-of-moses-chronology.json",base),"utf8"));
const app=JSON.parse(readFileSync(new URL("./apps/staff-of-moses/app.json",base),"utf8"));
test("scriptural chronology has references and per-entry sources",()=>{assert.equal(d.episodes.length,5);assert.deepEqual(d.episodes.map(x=>x.order),[1,2,3,4,5]);assert.ok(d.episodes.every(x=>x.classification==="scripture_KJV"&&x.source.startsWith("https://")));});
test("Eden tradition and creator claim are not scripture or authenticated custody",()=>{assert.equal(d.creator_claim.classification,"creator_claim");assert.ok(d.traditions.every(x=>x.classification!=="scripture_KJV"));assert.equal(d.custody.modern_location,"unknown");assert.equal(d.custody.physical_authentication,"none_established");});
test("original source and independent deployments are protected",()=>{assert.equal(d.source_integrity.original_txt_modified,false);assert.equal(d.source_integrity.other_pages_modified,false);assert.equal(app.id,"staff-of-moses");assert.equal(app.name,"tabor-staff-of-moses");assert.equal(app.origin,"https://tabor-staff-of-moses.pages.dev");assert.ok(app.sections.some(x=>x[1]==="Exodus 4:2–4"));});

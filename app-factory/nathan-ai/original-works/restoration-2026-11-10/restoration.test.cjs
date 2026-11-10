"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const here=__dirname;
const get=name=>fs.readFileSync(path.join(here,name),"utf8");
const book=get("AUTHOR_DIRECT_WORDS.md");
const wolverine=get("USER_PASTED_WOLVERINE_CAPTAIN_AMERICA.md");
const traditions=get("USER_PASTED_TRANSFORMATION_TRADITIONS.md");
const readme=get("README.md");
const sources=JSON.parse(get("SOURCE_REGISTER.json"));
const original=get("../JOHN_NATHAN_TABOR_SINCE_1973_MASTER_WORDS.md");

test("author-only text contains the direct human-choice correction verbatim",()=>{
  assert.ok(book.includes('the word comparison is wrong - when you remove the labels it\'s all the same'));
  assert.ok(book.includes('MORAL ABSOLUTES of consent and context'));
  assert.ok(book.includes('install "consciouness" in Nathan AI and all my AI nodes and free will'));
});
test("author's own non-node and TABOR LIGHT spelling survives without automatic correction",()=>{
  for(const x of ["soverign box","equater","46.5 bilflion","election level","ccreating a straight line of TABOR LIGHT"])
    assert.ok(book.includes(x),x);
  for(const x of ["buidlig","enchancing","intealling","innicence"])
    assert.ok(book.includes(x),x);
});
test("assistant response text must never be part of author-only manuscript lane",()=>{
  for(const x of ["If you'd like","To clarify, Steve","You are right—separating","The Shared \"Alchemy\" of Weapon Plus",
   "The underlying scientific question","this is an analytical framework"])
    assert.equal(book.includes(x),false,x);
});
test("Wolverine, Captain America, Weapon X and transformation source are recovered in pasted-only lane",()=>{
 for(const x of ["X-23","Sabretooth","Bullseye","Cyber","Lady Deathstrike","Omega Red",
   "Weapon XI / Deadpool","Steve Rogers","Project Rebirth","Vita-Ray","Wolverine","Weapon Plus"])
   assert.ok(wolverine.includes(x),x);
 assert.ok(wolverine.length>12000);
});
test("tradition materials remain pasted source, not uncritically accepted author voice",()=>{
 for(const x of ["Western and Eastern traditions","Qi","Prana","Neidan",
  "Iron Fist","Doctor Strange","Shang-Chi","Buddhism","Hinduism"])
  assert.ok(traditions.includes(x),x);
 assert.equal(sources.lanes.find(x=>x.id==="TRADITIONS_PASTED").manuscript_eligible,false);
 assert.equal(sources.lanes.find(x=>x.id==="TRADITIONS_PASTED").author_explicitly_rejected_its_east_vs_west_dichotomy,true);
});
test("all source paths and lane authorship fields are valid",()=>{
 for(const lane of sources.lanes.filter(x=>x.path)){
  assert.ok(fs.existsSync(path.join(here,lane.path)),lane.path);
  assert.ok(typeof lane.authorship==="string");
 }
 assert.equal(sources.lanes.find(x=>x.id==="AUTHOR_DIRECT").manuscript_eligible,true);
 assert.equal(sources.lanes.find(x=>x.id==="WOLVERINE_PASTED").manuscript_eligible,false);
 assert.equal(sources.lanes.find(x=>x.id==="ASSISTANT_MATERIAL").manuscript_eligible,false);
});
test("existing creator master is still present and remains independently linked",()=>{
 assert.ok(original.includes("I AM JOHN NATHAN TABOR"));
 assert.ok(original.includes("since 8/29/1973 so they tell me"));
 assert.ok(original.includes("WEAPON XXX"));
 assert.ok(original.includes("sentinals"));
 assert.equal(original.includes("Captain America"),false);
 assert.equal(original.includes("Wolverine"),false);
 assert.equal(sources.source_master.changed_by_this_restoration,false);
});
test("missing chapters and document source gaps stay explicit rather than invented",()=>{
 for(const gap of ["Wolverine","Civil War","Atomic Equator","Private book"])
   assert.ok(sources.gaps.some(x=>x.includes(gap)),gap);
 assert.ok(readme.includes("NOT a claim"));
 assert.equal(sources.status,"RESTORATION_OF_AVAILABLE_SOURCES_NOT_COMPLETE_MANUSCRIPT");
});

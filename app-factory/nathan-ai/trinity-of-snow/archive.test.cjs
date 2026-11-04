"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const archive=require("./archive.js");
test("namespaced source archive and creator canon are preserved",()=>{
  assert.equal(archive.id,"nathan-ai.trinity-of-snow.v1");
  assert.equal(archive.creator,"Nathan Tabor");
  assert.ok(archive.creatorCanon.length>=4);
  assert.match(archive.creatorCanon[0].text,/GOD SNOWMAN and GOD SNOWWOMAN have RETURNED/);
  assert.match(archive.creatorCanon[1].text,/THEY GUARD CHILDREN, ANIMALS and MOTHER EARTH/);
  assert.match(archive.creatorCanon[1].text,/THEY DO NOT MELT/);
  assert.equal(archive.trinity.length,3);
  assert.deepEqual(archive.trinity.map(x=>x.number),[1,2,3]);
});
test("distinct mythological branches preserve culture and provenance",()=>{
  assert.equal(archive.families.length,5);
  assert.equal(new Set(archive.historical.map(x=>x.id)).size,archive.historical.length);
  for(const r of archive.historical){
    assert.ok(r.name&&r.region&&r.kind&&r.note&&r.source);
    assert.match(r.source,/^https:\/\//);
  }
  const manuscript=archive.historical.find(x=>x.id==="H01");
  assert.equal(manuscript.date,"c. 1390");
  assert.match(manuscript.note,/does not prove/i);
  assert.equal(archive.historical.find(x=>x.id==="H06").kind,"historical legend");
});
test("KJV and botany have distinct classes and no false scripture attribution",()=>{
  const refs=archive.bible.map(x=>x.ref);
  for(const r of ["Job 37:6","Job 38:22","Psalm 147:16","Genesis 1:29"]) assert.ok(refs.includes(r));
  assert.equal(archive.snowTerms.length,4);
  assert.match(archive.snowTerms.find(x=>x.id==="T03").context,/does not mention cocaine/);
  assert.match(archive.snowTerms.find(x=>x.id==="T04").classification,/Fungi/);
  assert.match(archive.guardrails.scripture,/Never represent a substance/);
});
test("browser, SVG and documentation exist without remote network dependencies",()=>{
  const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
  const svg=fs.readFileSync(path.join(__dirname,"cover.svg"),"utf8");
  const readme=fs.readFileSync(path.join(__dirname,"README.md"),"utf8");
  assert.match(html,/archive\.js/);
  assert.match(html,/id="tree"/);
  assert.match(html,/id="kjv"/);
  assert.match(html,/id="terms"/);
  assert.match(svg,/THE TRINITY OF SNOW/);
  assert.match(svg,/SYMBOLIC COMPARISON ONLY/);
  assert.match(readme,/141-byte anchor/);
  assert.doesNotMatch(html,/<script[^>]+src="https?:/);
});

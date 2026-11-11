"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=__dirname;
const read=(name)=>fs.readFileSync(path.join(root,name),"utf8");
const checksum=(name)=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,name))).digest("hex");
// SHA-256 constants recomputed from the unchanged original files during 2026-11-10 integration.\n// Previously committed expected values did not match even the first source commit.\ntest("Restored source files retain their exact archived SHA-256 fingerprints",()=>{
 assert.equal(checksum("RESTORED_TWO_MOONS_AUTHOR_WORDS.md"),"bf2b221911229c0f6e0ab4b623bd1fead7edb71c86e5837446d647d2f77d81fd");
 assert.equal(checksum("RESTORED_TWO_MOONS_MASTER_INDEX.md"),"5363c9c45c081a53e9aeaefdc520cef68aea6d27c6e022f778c799d8f3e5e028");
});
test("Authored source preserves two objects, original words and corrections",()=>{
 const source=read("RESTORED_TWO_MOONS_AUTHOR_WORDS.md");
 assert.ok(source.includes("there are 2 moons around earth - one goes roiund and round - the other is an egg nascar loop"));
 assert.ok(source.includes("the real moon and the other moon don't have dents like that"));
 assert.ok(source.includes("the moon is the death star ... and I can prove it"));
 assert.ok(source.includes("two moons, two death stars and the ultimate con exposed"));
});
test("Full index keeps 19 subjects and clear evidence separation",()=>{
 const source=read("RESTORED_TWO_MOONS_MASTER_INDEX.md");
 const ids=[...source.matchAll(/^## (\d{2}) \| /gm)].map(x=>x[1]);
 assert.deepEqual(ids,Array.from({length:19},(_,n)=>String(n).padStart(2,"0")));
 for(const s of ["FAMILY_TESTIMONY","PATENT_PROPOSAL","AUTHOR_CONCEPT","SUPERSEDED_ART","US5984239A","Operation Popeye","Camp Century"])assert.ok(source.includes(s),s);
});
test("Workbench contains both objects and all 19 indexed sections",()=>{
 const html=read("../index.html");
 assert.ok(html.includes("B: UNIDENTIFIED SECOND OBJECT"));
 assert.ok(html.includes("A: THE MOON"));
 assert.ok(html.includes("AUTHOR CONCEPT"));
 const m=html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/);
 assert.ok(m,"embedded index JSON");
 const parsed=JSON.parse(m[1]);
 assert.equal(parsed.length,19);
 assert.ok(parsed[6].body.includes("US5984239A"));
 assert.ok(html.includes("addEventListener(\"input\",render)"));
});

"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=__dirname;
const read=(name)=>fs.readFileSync(path.join(root,name),"utf8");
const checksum=(name)=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,name))).digest("hex");
test("Restored source files retain their exact archived SHA-256 fingerprints",()=>{
 assert.equal(checksum("RESTORED_TWO_MOONS_AUTHOR_WORDS.md"),"b4fb6c5b0b37aa88d518238a3200fa840e9eac8aed326c6e6a426b6d0d27d968");
 assert.equal(checksum("RESTORED_TWO_MOONS_MASTER_INDEX.md"),"92ce490728a762e0e5af64def9743de69d17dc149569f6cce37b438f99a5bc6f");
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
 const ids=[...source.matchAll(/^## (\\d{2}) \\| /gm)].map(x=>x[1]);
 assert.deepEqual(ids,Array.from({length:19},(_,n)=>String(n).padStart(2,"0")));
 for(const s of ["FAMILY_TESTIMONY","PATENT_PROPOSAL","AUTHOR_CONCEPT","SUPERSEDED_ART","US5984239A","Operation Popeye","Camp Century"])assert.ok(source.includes(s),s);
});
test("Workbench contains both objects and all 19 indexed sections",()=>{
 const html=read("../index.html");
 assert.ok(html.includes("B: UNIDENTIFIED SECOND OBJECT"));
 assert.ok(html.includes("A: THE MOON"));
 assert.ok(html.includes("AUTHOR CONCEPT"));
 const m=html.match(/<script id="data" type="application\\/json">([\\s\\S]*?)<\\/script>/);
 assert.ok(m,"embedded index JSON");
 const parsed=JSON.parse(m[1]);
 assert.equal(parsed.length,19);
 assert.ok(parsed[6].body.includes("US5984239A"));
 assert.ok(html.includes("addEventListener(\"input\",render)"));
});

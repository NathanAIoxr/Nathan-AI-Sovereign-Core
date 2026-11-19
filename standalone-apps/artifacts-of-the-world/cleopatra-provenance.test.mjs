import assert from "node:assert/strict";
import {test} from "node:test";
import {createHash} from "node:crypto";
import {apps,build,original} from "./build.mjs";

test("Cleopatra staff dossier separates creator claim, comparison object and unknown custody",async()=>{
 const item=apps.find(x=>x.id==="cleopatra-staff");
 assert.ok(item);
 const sections=item.sections;
 assert.equal(sections.length,6);
 assert.ok(sections.some(([kind,,text])=>kind==="Nathan Tabor’s account"&&text.includes("Cleopatra staff")));
 const comparison=sections.find(([kind])=>kind==="Evidence classification");
 assert.ok(comparison[2].includes("does not identify, authenticate"));
 assert.equal(comparison[3],"https://www.metmuseum.org/art/collection/search/249300");
 assert.ok(sections.some(([kind,,text])=>kind==="Open provenance ledger"&&/\b(unresolved|unverified)\b/.test(text)));
 assert.ok(sections.some(([kind,,text])=>kind==="Attribution boundary"&&text.includes("remain unresolved")));
 const {worker}=await build("cleopatra-staff");
 const {default:service}=await import("data:text/javascript;base64,"+Buffer.from(worker).toString("base64"));
 const record=await (await service.fetch(new Request(item.origin+"/api/record"))).json();
 assert.deepEqual(record.sections,sections);
 const html=await (await service.fetch(new Request(item.origin+"/"))).text();
 assert.match(html,/Comparison is not custody evidence/);
});
test("source and independent Pages app inventory remain intact",()=>{
 assert.equal(apps.length,8);
 assert.equal(new Set(apps.map(x=>x.name)).size,8);
 assert.equal(createHash("sha256").update(original).digest("hex"),"6ccb5c53df786272306976fd6ca3637ae2581e3f721aaff215a0e593e0ceee76");
});

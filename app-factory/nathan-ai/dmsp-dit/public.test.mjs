import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = p => readFile(new URL(p, import.meta.url),"utf8");
const worker=await read("./worker.js");
const script=await read("./public/app.js");
const styles=await read("./public/styles.css");
const standalone=await read("./public/offline-standalone.html");
const catalog=JSON.parse(await read("./public/catalog.json"));
const readEmbedded=name=>{
 const start=worker.indexOf("const "+name+"=");
 assert.ok(start>=0,"missing embedded "+name);
 const fragment=worker.slice(start+("const "+name+"=").length);
 return JSON.parse(fragment.slice(0,fragment.indexOf(";\n")));
};
test("distributed JS and CSS match the deployed Worker sources",()=>{
 assert.equal(readEmbedded("APP_JS"),script);
 assert.equal(readEmbedded("APP_CSS"),styles);
});
test("standalone HTML carries embedded UI with 28 selectable services",()=>{
 assert.equal((standalone.match(/class="select-service"/g)||[]).length,28);
 assert.match(standalone,/<style>/);
 assert.match(standalone,/<script>/);
 assert.doesNotMatch(standalone,/src="\/app.js"/);
 assert.match(standalone,/download-plan/);
});
test("JSON catalog has 28 unique departments",()=>{
 assert.equal(catalog.services.length,28);
 assert.equal(new Set(catalog.services.map(x=>x.id)).size,28);
});
test("Worker public service registry matches the portable export",()=>{
 const apiCatalog=readEmbedded("PUBLIC_SERVICES");
 assert.deepEqual(catalog.services.map(s=>s.id),apiCatalog.map(s=>s[0]));
});

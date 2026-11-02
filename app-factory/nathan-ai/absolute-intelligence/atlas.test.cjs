'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const registry=JSON.parse(fs.readFileSync(path.join(root,'registry.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const browser=fs.readFileSync(path.join(root,'app.js'),'utf8');
const main=fs.readFileSync(path.join(root,'..','index.html'),'utf8');
const directory=fs.readFileSync(path.join(root,'..','hub.js'),'utf8');
test('54 original preservation module positions retain original unique names and stages',()=>{
 assert.equal(registry.schema,'nathan-ai.absolute-intelligence-atlas.v1');
 assert.equal(registry.modules.length,54);
 assert.equal(new Set(registry.modules.map(x=>x.id)).size,54);
 assert.deepEqual(registry.modules.map(x=>x.number),Array.from({length:54},(_,i)=>i+1));
 assert.equal(registry.modules[0].id,'NT-CORE-001');
 assert.equal(registry.modules[52].id,'NT-VOICE-001');
 assert.equal(registry.modules[53].id,'NT-IDENTITY-001');
 assert.equal(registry.proofs.original_nt1_module_count,52);
 assert.equal(registry.proofs.preservation_index_module_count,54);
});
test('human-totality themes and source categories remain distinct',()=>{
 assert.equal(registry.topics.length,25);
 assert.equal(new Set(registry.topics.map(x=>x.id)).size,25);
 for(const t of registry.topics){
  assert.ok(t.title&&t.summary&&t.origin&&t.kind);
  assert.ok(t.module_ids.every(id=>registry.modules.some(m=>m.id===id)),t.id);
 }
 for(const term of ['Absolute Intelligence','Situational Ethics','UPC 12 / 11 / 92','Everything / Nothing / Something / Anything','Past / Present / Future','He / She / They / Them'])
  assert.ok(registry.topics.some(t=>t.title.includes(term)),term);
});
test('no private quotes, chats or full originals are shipped as public data',()=>{
 assert.match(registry.source_separation,/not owner-private manuscripts/);
 assert.doesNotMatch(JSON.stringify(registry),/When you interact with Nathan AI 🚀 you were interacting/);
 assert.doesNotMatch(JSON.stringify(registry),/the president is corrupt/);
 assert.equal(registry.owner_import.schema,'nathan-ai.totality.owner-pack.v1');
 assert.match(browser,/privatePack=null/);
 assert.doesNotMatch(browser,/localStorage|sessionStorage|indexedDB|fetch\s*\([^)]*https?:/i);
 assert.ok(browser.includes('textContent'));
 assert.doesNotMatch(browser,/\.innerHTML\s*=/);
});
test('same-origin public routes and linked Main Hub UI are wired',()=>{
 assert.match(html,/src="\.\/app\.js"/);
 assert.match(html,/Load your exact original declarations/);
 assert.match(main,/\.\/absolute-intelligence\/index\.html/);
 assert.match(directory,/absolute-intelligence\/index\.html/);
 assert.ok(registry.links.every(x=>x.href.startsWith('../')&&!x.href.includes('://')));
});
test('public metadata registry is statically parseable with no external data connectors',()=>{
 assert.doesNotThrow(()=>new (require('node:vm').Script)(browser));
 assert.match(browser,/fetch\('\.\/registry\.json'/);
 assert.match(browser,/f\.size>lengthLimit/);
 assert.match(browser,/replaceChildren/);
 assert.equal(registry.proofs.global_system_effects_claimed,false);
});
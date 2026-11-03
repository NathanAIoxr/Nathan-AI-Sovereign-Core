'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root,'operations.json'),'utf8'));
const source = fs.readFileSync(path.join(root,'SOVEREIGN_STACK.md'),'utf8');
const view = fs.readFileSync(path.join(root,'index.html'),'utf8');
test('registry has 6 + 7 unique source-backed modules',()=>{
 assert.equal(data.entries.length,13);
 assert.equal(data.entries.filter(x=>x.layer==='ram-convoy').length,6);
 assert.equal(data.entries.filter(x=>x.layer==='sovereign-core').length,7);
 assert.equal(new Set(data.entries.map(x=>x.id)).size,13);
 assert.ok(data.entries.every(x=>x.status==='documented_not_deployed'));
});
test('source preserved and conceptual status explicit',()=>{
 for(const entry of data.entries) {
  assert.ok(source.includes(entry.name));
  assert.ok(entry.source_description.length>15);
 }
 assert.ok(source.includes('N = (Ψ ⊕ Ω) ⊗ Fᴅ'));
 assert.equal(data.formula.executable,false);
 assert.ok(source.includes('Status:** Creator-authored operation specification'));
});
test('browser directory displays all items and never runs external routines',()=>{
 for(const entry of data.entries) assert.ok(view.includes(entry.name.replaceAll('&','&amp;')));
 assert.ok(view.includes('Deployment status: unverified'));
 // Only the shared local navigation/appearance helpers may execute; this registry
 // must never acquire an operation runner or arbitrary inline/external script.
 const allowed=new Set(['../appearance/engine.js','../appearance/app.js','../workspace.js','../assistant/engine.js','../launcher/engine.js','../launcher/app.js']);
 const scripts=[...view.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,allowed.size);
 for(const script of scripts){const src=script[1].match(/src="([^"]+)"/);assert.ok(src&&allowed.has(src[1]));assert.equal(script[2].trim(),'');allowed.delete(src[1]);}
 assert.equal(allowed.size,0);
});

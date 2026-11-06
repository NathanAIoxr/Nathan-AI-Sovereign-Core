'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const h=require('./health-core.js');
const backup=require('../../vault-backup.js');
test('ONE health taxonomy and provenance boundaries',()=>{
 assert.equal(h.category('The Tabor Smart Bathtub Insert.png'),'Bath Systems');
 assert.equal(h.category('Neck_C5-C7_Surgery.pdf'),'Health & Recovery');
 assert.equal(h.category('Trauma: Lost Wisdom Restored.png'),'Healing & Reflections');
 assert.equal(h.category('master_catalog.json'),'Technical & Source Indexes');
 assert.equal(h.permitted('doctor.pdf'),true);
 assert.equal(h.permitted('file.html'),false);
 assert.equal(h.permitted('script.js'),false);
 assert.equal(h.fileName('private/source/records.md'),'records.md');
 assert.equal(h.safePath('../bad.pdf'),null);
 assert.equal(h.safePath('/etc/passwd'),null);
 assert.equal(h.safePath('a\\b.pdf'),null);
});
test('ONE health source importer reads stored ZIPs without rewriting original bytes',async()=>{
 const payload=new TextEncoder().encode('THE ORIGINAL ACCOUNT STAYS UNCHANGED');
 const archive=backup.zipStored([{name:'manifest.json',bytes:payload}]);
 const items=await h.readZip(archive);
 assert.equal(items.length,1);
 assert.equal(items[0].name,'manifest.json');
 assert.deepEqual(items[0].content,payload);
});
test('ONE health source importer blocks broken ZIPs and corrupted bytes',async()=>{
 await assert.rejects(h.readZip(new Uint8Array([1,2,3])),/ZIP/);
 const bytes=backup.zipStored([{name:'manifest.json',bytes:new TextEncoder().encode('plain original')}]);
 const changed=Uint8Array.from(bytes);
 const i=new TextDecoder().decode(changed).indexOf('plain original');
 assert.notEqual(i,-1);
 changed[i]^=1;
 await assert.rejects(h.readZip(changed),/integrity/);
});
test('ONE health is linked from the existing ONE control panel',()=>{
 const home=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const page=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'health-ui.js'),'utf8');
 assert.match(home,/health\/index\.html/);
 assert.match(page,/health-core\.js/);
 assert.match(page,/vault-backup\.js/);
 assert.match(ui,/vault\.addFile/);
 assert.doesNotMatch(ui,/fetch\s*\(|XMLHttpRequest|sendBeacon/);
});

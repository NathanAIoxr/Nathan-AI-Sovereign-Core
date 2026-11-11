'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=__dirname;
const data=JSON.parse(fs.readFileSync(path.join(base,'records.json'),'utf8'));
test('unique creator-attributed BOSSMAN DOG names and IDs',()=>{
 assert.equal(data.identities[0].name,'BOSSMAN');
 assert.equal(data.identities[1].name,'DOG');
 assert.equal(new Set(data.identities.map(x=>x.id)).size,data.identities.length);
 assert.equal(new Set(data.identities.map(x=>x.name)).size,data.identities.length);
 assert.ok(data.identities.every(x=>x.status==='creator-attributed'&&x.source));
});
test('research lanes remain unverified, without asserted affiliations',()=>{
 assert.equal(data.researchLanes.length,5);
 assert.ok(data.researchLanes.every(x=>x.status==='unverified'&&/No BOSSMAN\/DOG affiliation established/.test(x.note)));
});
test('four distinct theme controls and accessible evidence form are linked',()=>{
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(base,'style.css'),'utf8');
 const js=fs.readFileSync(path.join(base,'app.js'),'utf8');
 for(const theme of ['concrete','atlas','caseboard','signal']){
  assert.ok(html.includes('data-theme="'+theme+'"'));
  assert.ok(css.includes('data-skin="'+theme+'"'));
 }
 assert.ok(html.includes('nathan-record-notice'));
 assert.ok(html.includes('id="evidence-form"'));
 assert.ok(js.includes('textContent'));
 assert.ok(js.includes('localStorage'));
 assert.ok(js.includes("noopener noreferrer"));
 assert.ok(!js.includes('eval('));
});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const M=require('./matrix-engine.js');
test('full four-plane and indexing structure is explicit and ordered',()=>{
 const x=M.audit();
 assert.deepEqual(M.PLANES,['Geometry','Logic','Phonetic','Deployment']);
 assert.equal(x.planes,4);assert.equal(x.axes,9);assert.equal(x.stacks,11);
 assert.equal(x.modes,13);assert.equal(x.lenses,38);assert.equal(x.uniqueModes,true);
});
test('all 13 derived modes preserve original source separately',()=>{
 const source='SVIRS\r\nVIRUS\nA-B\n';
 for(const mode of M.MODES){
   const result=M.derive(source,mode.id);
   assert.equal(result.original.text,source,mode.id);
   assert.equal(result.original.preservedExactly,true,mode.id);
   assert.equal(result.derived.independent,true,mode.id);
   assert.equal(result.plane,mode.plane,mode.id);
   assert.equal(result.schema,'ttfes-btp.matrix-derivation.v1');
 }
});
test('acrostic, telestich, reverse coordinate and word grid are deterministically defined',()=>{
 assert.equal(M.derive('Alpha\nBeta\nZebra','acrostic').derived.text,'ABZ');
 assert.equal(M.derive('Alpha\nBeta\nZebra','telestich').derived.text,'aaa');
 assert.equal(M.derive('hello world','reverse-words').derived.text,'world hello');
 assert.equal(M.derive('ab','reverse-characters').derived.text,'ba');
 const f=JSON.parse(M.derive('A Z','az-forward').derived.text);
 assert.deepEqual(f.characters.map(x=>x.index),[1,26]);
 const r=JSON.parse(M.derive('A Z','az-reverse').derived.text);
 assert.deepEqual(r.characters.map(x=>x.index),[26,1]);
 const grid=JSON.parse(M.derive('One two\nThree','word-grid').derived.text);
 assert.equal(grid.cells.length,3);
 assert.deepEqual(grid.cells[2],{row:2,column:1,text:'Three'});
});
test('the 0/1 whole-state operations never erase source, inventing no literal empirical truth',()=>{
 const original='My original text';
 const b=M.derive(original,'binary-build'),c=M.derive(original,'binary-clear');
 assert.equal(JSON.parse(b.derived.text).wholeState,1);
 assert.equal(JSON.parse(c.derived.text).wholeState,0);
 assert.equal(b.original.text,original);
 assert.equal(c.original.text,original);
 assert.match(c.derived.text,/rejected-without-source-deletion/);
});
test('user-defined 38 lens placeholders do not imply standardized clinical categories',()=>{
 const list=M.createLenses(['Sound of S','Shape of V']);
 assert.equal(list.length,38);
 assert.equal(list[0].label,'Sound of S');
 assert.equal(list[1].label,'Shape of V');
 assert.equal(list[37].label,'Lens 38');
 assert.equal(list[0].authorDefined,true);
 assert.equal(list[0].clinicalClassification,false);
 assert.throws(()=>M.createLenses(Array.from({length:39},(_,i)=>''+i)),/up to 38/);
});
test('matrix studio is integrated with a fully independent browser shell',()=>{
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'matrix-ui.js'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'sw.js'),'utf8');
 assert.match(html,/matrix-engine\.js/);
 assert.match(html,/matrix-ui\.js/);
 assert.match(html,/original-source/);
 assert.match(html,/lens-list/);
 assert.match(ui,/ttfes-btp-38-user-lenses\.json/);
 assert.match(sw,/matrix-engine\.js/);
 assert.match(sw,/matrix-ui\.js/);
});

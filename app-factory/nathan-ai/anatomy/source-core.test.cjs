'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const S=require('./source-core.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'atlas.json'),'utf8'));
test('every authored anatomy/IVERSION position is kept in exact original A–Z and Z–A pairs',()=>{
 const result=S.validate(data);
 assert.deepEqual(result,{letters:26,inversions:26,spinePositions:33,medicalStatus:'conceptual-plus-reference-not-diagnostic'});
 for(const letter of S.LETTERS){
  const record=S.paired(data,letter);
  assert.equal(record.anatomy.letter,letter);
  assert.equal(record.iversion.mirror,S.LETTERS[25-S.LETTERS.indexOf(letter)]);
  assert.ok(record.anatomy.provenance.length>10);
  assert.ok(record.iversion.from.length>10);
 }
 assert.equal(S.paired(data,'A').iversion.name,'Aiversion');
 assert.equal(S.paired(data,'Z').iversion.mirror,'A');
});
test('incomplete, shifted, duplicated or fabricated conceptual layers fail closed',()=>{
 const partial=structuredClone(data);partial.anatomyAZ.pop();
 assert.throws(()=>S.validate(partial),/26 original positions/);
 const duplicate=structuredClone(data);duplicate.iversions[1].letter='A';
 assert.throws(()=>S.validate(duplicate),/shifted or duplicated/);
 const mirror=structuredClone(data);mirror.iversions[4].mirror='A';
 assert.throws(()=>S.validate(mirror),/shifted or duplicated/);
 const noProvenance=structuredClone(data);noProvenance.anatomyAZ[0].provenance='';
 assert.throws(()=>S.validate(noProvenance),/Missing anatomy provenance/);
 const noScience=structuredClone(data);noScience.scientificBoundary='';
 assert.throws(()=>S.validate(noScience),/medical truth boundary/);
 const noCredit=structuredClone(data);noCredit.notice='';
 assert.throws(()=>S.validate(noCredit),/Authorship boundary/);
 const noSpine=structuredClone(data);noSpine.spine.regions[0].count=77;
 assert.throws(()=>S.validate(noSpine),/33 named positions/);
});
test('the original atlas source is unmodified and viewer loads validation before rendering',()=>{
 const original=fs.readFileSync(path.join(__dirname,'atlas.json'),'utf8');
 const content=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'atlas-ui.js'),'utf8');
 assert.ok(content.indexOf('src="./source-core.js" defer')<content.indexOf('src="./atlas-ui.js" defer'));
 assert.match(ui,/Source\.validate\(atlas\)/);
 assert.doesNotMatch(ui,/\binnerHTML\s*=/);
 assert.equal(fs.readFileSync(path.join(__dirname,'atlas.json'),'utf8'),original);
 assert.match(data.scientificBoundary,/not established clinical classifications/);
 assert.throws(()=>S.paired(data,'XX'),/A through Z/);
});

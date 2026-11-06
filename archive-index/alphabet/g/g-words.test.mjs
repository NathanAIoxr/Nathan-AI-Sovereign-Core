import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ORIGINAL_WORDS,reverseLiteral,reverseUppercase,verifyWordFamily,searchGWords,directReverseRelation} from './g-words.mjs';
const data=JSON.parse(readFileSync(new URL('./g-words.json',import.meta.url),'utf8'));
test('preserve the exact five supplied labels and original-source classification',()=>{
 assert.equal(verifyWordFamily(data),true);
 assert.deepEqual(data.entries.map(x=>x.original),['God','Goddess','Dog','Doggess','Sseggod']);
 assert.deepEqual(ORIGINAL_WORDS,['God','Goddess','Dog','Doggess','Sseggod']);
 assert.equal(data.existingPublicSoftware.length,2);
});
test('God and Dog literal uppercase reverse back and forth',()=>{
 assert.equal(reverseUppercase('God'),'DOG');assert.equal(reverseUppercase('Dog'),'GOD');
 assert.equal(directReverseRelation(data,'God').partnerInSuppliedFive,'Dog');
 assert.equal(directReverseRelation(data,'Dog').partnerInSuppliedFive,'God');
});
test('Doggess reverses to SSEGGOD, which is precisely supplied Sseggod',()=>{
 assert.equal(reverseUppercase('Doggess'),'SSEGGOD');
 assert.equal(reverseUppercase('Sseggod'),'DOGGESS');
 assert.equal(directReverseRelation(data,'Doggess').partnerInSuppliedFive,'Sseggod');
 assert.equal(directReverseRelation(data,'Sseggod').partnerInSuppliedFive,'Doggess');
});
test('Goddess reversal is SSEDDOG, not SSEGGOD; no silent correction',()=>{
 assert.equal(reverseUppercase('Goddess'),'SSEDDOG');
 assert.notEqual(reverseUppercase('Goddess'),reverseUppercase('Doggess'));
 const reverse=directReverseRelation(data,'Goddess');
 assert.equal(reverse.partnerInSuppliedFive,null);
 assert.equal(reverse.source,'generated-literal-reversal');
});
test('original case and unrelated alphabet indexing are maintained',()=>{
 assert.equal(reverseLiteral('God'),'doG');assert.equal(reverseLiteral('Doggess'),'sseggoD');
 assert.equal(data.entries.find(x=>x.original==='Dog').originalInitial,'D');
 assert.equal(data.entries.find(x=>x.original==='Sseggod').originalInitial,'S');
 assert.ok(data.entries.every(x=>x.indexDepartment==='G'));
 assert.ok(data.entries.every(x=>x.originalAlphabetPreserved));
});
test('filters retain all originals and source titles without personal records',()=>{
 assert.equal(searchGWords(data.entries).length,5);
 assert.ok(['Doggess','Sseggod'].every(name=>searchGWords(data.entries,{query:'SSEGGOD'}).some(x=>x.original===name)));
 assert.ok(searchGWords(data.entries,{query:'OG_Family'}).some(x=>x.original==='Dog'));
 assert.throws(()=>reverseLiteral(1));
});


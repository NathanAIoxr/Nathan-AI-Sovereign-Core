import test from 'node:test';
import assert from 'node:assert/strict';
import {B_REVIEW_KINDS, reverseCharacters, classifyB, bSearchRows} from './b-family.mjs';
test('source wording never mutates',()=>{
 const s='The Black Time Widow';const r=classifyB(s);
 assert.equal(s,'The Black Time Widow');assert.equal(r.original,s);
 assert.ok(r.routes.includes('the-b-title'));
});
test('B, case, repetition and the article are distinct',()=>{
 assert.deepEqual(classifyB('B').routes,['literal-b-prefix','mirror-rotation']);
 assert.ok(classifyB('BBB').routes.includes('repeated-letter'));
 assert.ok(classifyB('The Beast on the East River').routes.includes('the-b-title'));
});
test('glyph resemblance is a review route not identity',()=>{
 assert.ok(classifyB('8').routes.includes('numeric-eight'));
 assert.ok(classifyB('∞').review_required);
 assert.ok(classifyB('OO').review_required);
 assert.ok(!classifyB('OO').routes.includes('literal-b-prefix'));
 assert.ok(classifyB('β').routes.includes('cross-script'));
});
test('reversal is mechanical and does not change source',()=>{
 const s='BABEL';assert.equal(reverseCharacters(s),'LEBAB');assert.equal(s,'BABEL');
 assert.equal(reverseCharacters('BARNABAS'),'SABANRAB');
});
test('records are searched without reclassification or duplication',()=>{
 const a=[{title:'Barnabas',class:'P'},{title:'The Beast on the East River',class:'J'},{title:'Babel',class:'B'}];
 const b=bSearchRows(a,'ba');assert.equal(b.length,2);assert.equal(a[0].class,'P');assert.equal(a.length,3);
});
test('supported routes remain explicit',()=>{
 assert.equal(new Set(B_REVIEW_KINDS).size,B_REVIEW_KINDS.length);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyC,reverseCodePoints,findCTitles,C_VARIANT_TYPES} from './c-family.mjs';
test('original words preserved including case and punctuation',()=>{
 const s='THE MIDDLE C — THE COLLISION',r=classifyC(s);
 assert.equal(r.original,s);assert.equal(s,'THE MIDDLE C — THE COLLISION');
});
test('C initial and The C are distinct',()=>{
 assert.ok(classifyC('Christmas Cipher Matrix').routes.includes('literal-c-initial'));
 assert.ok(classifyC('The Christmas Thief').routes.includes('the-c-prefix'));
 assert.ok(!classifyC('The Christmas Thief').routes.includes('literal-c-initial'));
});
test('numbered and repeated C letters',()=>{
 assert.ok(classifyC('52_Consciousness').routes.includes('numbered-c-prefix'));
 assert.ok(classifyC('CCC').routes.includes('letter-repetition'));
});
test('C / sea / SCA are not collapsed into one string',()=>{
 const c=classifyC('C'),sea=classifyC('sea'),sca=classifyC('SCA');
 assert.notEqual(c.original,sea.original);assert.notEqual(sea.original,sca.original);
 assert.ok(sea.routes.includes('phonetic-resemblance'));
 assert.ok(!sca.routes.includes('phonetic-resemblance'));
});
test('chemical symbol and Roman numeral remain contextual',()=>{
 assert.ok(classifyC('C').routes.includes('roman-numeral-c'));
 assert.ok(classifyC('Cu').routes.includes('chemical-symbol-c'));
 assert.ok(!classifyC('Cu').routes.includes('roman-numeral-c'));
});
test('C glyphs from non-Latin scripts remain separate',()=>{
 assert.ok(classifyC('С').routes.includes('cross-script-lookalikes'));
 assert.ok(!classifyC('С').routes.includes('literal-c-initial'));
 assert.ok(classifyC('Ↄ').routes.includes('c-shaped-mirror'));
});
test('music, computers and author Middle C are separate routes',()=>{
 assert.ok(classifyC('C++').routes.includes('computing-c'));
 assert.ok(classifyC('Middle C').routes.includes('musical-c'));
 assert.ok(classifyC('Above C').routes.includes('author-middle-c'));
});
test('exact reversal is separate from etymology',()=>{
 assert.equal(reverseCodePoints('CIPHER'),'REHPIC');
 assert.equal(reverseCodePoints('CHRISTMAS'),'SAMTSIRHC');
 assert.equal(reverseCodePoints('C'),'C');
});
test('title filtering is read-only and retains same-name duplicates',()=>{
 const a=[{title:'Christmas',group:'C_INITIAL'},{title:'Christmas',group:'C_INITIAL'},{title:'The Christmas Thief',group:'THE_C'}];
 assert.equal(findCTitles(a,'christmas').length,3);
 assert.equal(findCTitles(a,'christmas','C_INITIAL').length,2);
 assert.equal(a[0].title,'Christmas');
});
test('variation labels do not silently overlap',()=>{
 assert.equal(new Set(C_VARIANT_TYPES).size,C_VARIANT_TYPES.length);
});

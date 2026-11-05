import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyD,reverseCodePoints,asciiAtbash,asciiRot13,filterDTitles,D_ROUTE_IDS} from './d-family.mjs';
test('original D text is not changed',()=>{const s='DARK MUST BREAK TO BUILD. ⭕️';assert.equal(classifyD(s).original,s)});
test('D/DD/DDD stay distinct with unchanged reversals',()=>{
 for(const s of ['D','DD','DDD'])assert.equal(reverseCodePoints(s),s);
 assert.ok(classifyD('DD').routes.includes('dd-ddd'));
 assert.ok(classifyD('D.D.D.').routes.includes('dd-ddd'));
});
test('dick variants are exact strings not moral identities',()=>{
 assert.equal(reverseCodePoints('dick'),'kcid');
 assert.equal(reverseCodePoints('dicks'),'skcid');
 assert.ok(classifyD('Richard Dickhead').routes.includes('dick-family'));
});
test('phonetics and lowercase shape are distinct',()=>{
 assert.ok(classifyD('dee').routes.includes('phonetic-dee'));
 assert.ok(classifyD('d').routes.includes('lowercase-d-inversions'));
 assert.ok(!classifyD('b').routes.includes('d-prefix'));
});
test('D0G retains numeric zero and a separate search route',()=>{
 assert.ok(classifyD('D0G').routes.includes('d0g-dog'));
 assert.notEqual('D0G','DOG');
});
test('literal and prefixed titles keep different categories',()=>{
 assert.ok(classifyD('David vs Goliath').routes.includes('d-prefix'));
 assert.ok(classifyD('The Divine Mind').routes.includes('the-d-title'));
 assert.ok(classifyD('07_Dawn').routes.includes('numbered-d-title'));
});
test('cross-script is not D prefix',()=>{
 assert.ok(classifyD('Д').routes.includes('cross-script-d'));
 assert.ok(!classifyD('Д').routes.includes('d-prefix'));
 assert.ok(classifyD('ᗡ').routes.includes('mirror-capital-D'));
});
test('historically distinct encoding operations are exact',()=>{
 assert.equal(asciiAtbash('D'),'W');
 assert.equal(asciiRot13('D'),'Q');
 assert.equal(asciiAtbash('DOG'),'WLT');
 assert.equal(asciiRot13('DOG'),'QBT');
});
test('KJV game-of-life is not commercial game code',()=>{
 assert.ok(classifyD('Dungeons and Dragons — Game of Life — KJV style').routes.includes('kjv-game-of-life'));
});
test('title filtering preserves duplicates and original values',()=>{
 const records=[{title:'Dawn',group:'D_INITIAL'},{title:'Dawn',group:'D_INITIAL'},{title:'The Divine Mind',group:'THE_D'}];
 assert.equal(filterDTitles(records,{query:'dawn'}).length,2);
 assert.equal(filterDTitles(records,{family:'THE_D'}).length,1);
 assert.equal(records[0].title,'Dawn');
});
test('route definitions have unique IDs',()=>assert.equal(new Set(D_ROUTE_IDS).size,D_ROUTE_IDS.length));

import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const manifest=JSON.parse(readFileSync(new URL('./canonical-d-sequences.json',import.meta.url),'utf8'));
const originals=[
 ['perfect-sequential','the Demonology Dilution of Atoms'],
 ['physics-atomic','The Double Dilution of Amplitudes'],
 ['nativity-kjv','The David Dilution of Ancestry-kin'],
 ['holiday','Dancing Demons'],
 ['sacred-alphabet','Davidic Dancers']
];
test('D original entries remain byte-for-byte named and independently categorized',()=>{
 assert.equal(manifest.letter,'D');
 assert.deepEqual(manifest.categories.map(({id,title})=>[id,title]),originals);
 assert.equal(new Set(manifest.categories.map(x=>x.id)).size,5);
 for(const item of manifest.categories)assert.ok(item.evidence.length>0);
});
test('derived reversal routes do not overwrite original D source entries',()=>{
 const routes=JSON.parse(readFileSync(new URL('./routes.json',import.meta.url),'utf8'));
 assert.ok(routes.routes.some(x=>x.id==='word-reversal'));
 assert.ok(routes.routes.some(x=>x.id==='dd-ddd'));
 assert.ok(routes.routes.some(x=>x.id==='kjv-game-of-life'));
});

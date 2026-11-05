import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const read=(f)=>readFileSync(join(here,f),'utf8');
const doc=JSON.parse(read('source-registry.json'));
test('nineteen values, exact order',()=>{
 assert.deepEqual(doc.north,[9,8,7,6,5,4,3,2,1]);
 assert.equal(doc.center,0);
 assert.deepEqual(doc.south,[-9,-8,-7,-6,-5,-4,-3,-2,-1]);
 assert.equal(doc.north.length+1+doc.south.length,19);
});
test('direct source quotes retained',()=>{
 const text=read('original-excerpts.md')+'\n'+read('original-excerpts-continued.md');
 assert.ok(text.includes('left to Wright and then right to left like two big cork screws'));
 assert.ok(text.includes('The equator is the void aka middle'));
 assert.ok(text.includes('rightly divide all words'));
 assert.ok(text.includes('+9 to plus one and then -9 to negative one'));
});
test('index preserves source/research separation',()=>{
 assert.match(doc.source_policy,/classifications/);
 assert.ok(doc.sections.some(x=>x.key==='ancient-text-research'));
 assert.ok(read('index.html').includes('known=['));
});

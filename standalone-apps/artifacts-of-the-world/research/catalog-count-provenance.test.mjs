import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('./catalog-count-provenance.json',import.meta.url),'utf8'));
const original=readFileSync(new URL('../original.txt',import.meta.url),'utf8');
test('every evidence excerpt appears verbatim in original source',()=>{for(const item of data.evidence) assert.ok(original.includes(item.exact_excerpt));});
test('uncertain count remains open and unpublished',()=>{assert.equal(data.status,'open');assert.equal(data.publication,'review_only_not_deployed');assert.ok(data.unresolved.length>=3);});

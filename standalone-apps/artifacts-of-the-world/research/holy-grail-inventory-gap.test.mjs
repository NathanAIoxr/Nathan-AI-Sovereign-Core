import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const dossier=JSON.parse(readFileSync(new URL('./holy-grail-inventory-gap.json',import.meta.url),'utf8'));
const original=readFileSync(new URL('original.txt',root),'utf8');
test('exact author excerpt is present in original source',()=>assert.ok(original.includes(dossier.author_source.exact_excerpt)));
test('literary leads do not assert verified physical custody',()=>{
 assert.equal(dossier.identity_status,'unverified');
 assert.equal(dossier.earliest_verified_inventory,null);
 assert.deepEqual(dossier.custody_chain,[]);
 assert.ok(dossier.research_leads.every(x=>x.supports.includes('not')));
});

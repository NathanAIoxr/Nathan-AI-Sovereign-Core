'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const d=JSON.parse(fs.readFileSync(path.join(root,'registry.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const hub=fs.readFileSync(path.join(root,'..','index.html'),'utf8');
test('master blueprint target is distinct from book addresses and translations',()=>{
 assert.equal(d.schema,'nathan-ai.master-blueprint.v1');
 assert.equal(d.targets.master_blueprint.value,133333333);
 assert.equal(d.targets.distinct_work_addresses.value,33000000);
 assert.equal(d.targets.edition_cross_product.value,2000*66666);
 assert.notEqual(d.targets.edition_cross_product.value,d.targets.master_blueprint.value);
});
test('original 33 departments, nine shelves and 13 editorial passes are preserved',()=>{
 assert.equal(d.departments.length,33);
 assert.equal(new Set(d.departments.map(x=>x.id)).size,33);
 assert.equal(d.departments[0].name,'GEMATRIA');
 assert.equal(d.departments[12].name,'GEOGRAPHY');
 assert.equal(d.departments[32].name,'Master reference and publishing operations');
 assert.equal(d.departments.reduce((sum,x)=>sum+x.address_capacity,0),33000000);
 assert.deepEqual(d.shelves.map(s=>s.id),['101','201','301','401','501','601','701','801','901']);
 assert.deepEqual(d.editorial_passes.map(x=>x.pass),Array.from({length:13},(_,i)=>i));
});
test('proposals and language ceiling are not treated as completed works',()=>{
 assert.equal(d.targets.book_concepts.value,1301);
 assert.equal(d.targets.language_ceiling.value,66666);
 assert.match(d.targets.master_blueprint.status,/goal/i);
 assert.match(d.targets.book_concepts.status,/not approved/i);
 assert.ok(d.count_policy.count_separately.includes('approved distinct works'));
});
test('public registry has no private original bytes or external private links',()=>{
 assert.ok(d.private_source_index.length>=4);
 assert.ok(d.private_source_index.every(x=>x.access.includes('not copied')));
 assert.ok(d.modules.every(x=>x.url===null || (x.url.startsWith('../')&&!x.url.includes('://'))));
 assert.ok(d.modules.every(x=>x.title&&x.kind&&x.status));
});
test('Nathan AI Main Hub links blueprint and renders no direct source text injection',()=>{
 assert.match(hub,/\.\/blueprint\/index\.html/);
 assert.match(html,/registry\.json/);
 assert.match(html,/textContent/);
 assert.match(html,/Search connected systems/);
 assert.match(html,/ONE — THE LAST APP/);
});

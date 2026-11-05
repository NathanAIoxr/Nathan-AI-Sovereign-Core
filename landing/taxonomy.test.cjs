'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const tax=require('./taxonomy.js');
const store=require('../app-factory/nathan-ai/capability-atlas/store-engine.js');
const inv=JSON.parse(fs.readFileSync(path.join(__dirname,'../app-factory/nathan-ai/capability-atlas/inventory.json'),'utf8'));
const proposals=JSON.parse(fs.readFileSync(path.join(__dirname,'../app-factory/nathan-ai/capability-atlas/store-discovery.json'),'utf8'));
const records=tax.buildRecords(inv,proposals,store);
test('all ten broad Dewey classes remain in their published 000–900 order',()=>{
 assert.deepEqual(tax.DEWEY.map(x=>x.code),['000','100','200','300','400','500','600','700','800','900']);
 assert.ok(tax.DEWEY.every(x=>x.title.length>4));
});
test('exact center and ordered above and below levels are preserved',()=>{
 assert.deepEqual(tax.ABOVE,[9,8,7,6,5,4,3,2,1]);
 assert.deepEqual(tax.BELOW,[-9,-8,-7,-6,-5,-4,-3,-2,-1]);
 assert.deepEqual(Object.keys(tax.AXES),['center','up','down','left','right']);
 assert.match(tax.AXES.center.description,/original/);
});
test('DEO is not silently relabeled Dewey or duodecimal',()=>{
 assert.equal(tax.DEO.name,'DEO decimal');
 assert.equal(tax.DEO.status,'author-defined notation; assignment scheme not supplied');
 assert.deepEqual(tax.DEO.digits,[0,1,2,3,4,5,6,7,8,9]);
 assert.ok(tax.DEO.note.includes('No DEO call numbers are fabricated'));
});
test('all source-indexed app routes are kept independently',()=>{
 const entrypoints=inv.entries.filter(r=>r.t==='f'&&r.p.startsWith('app-factory/')&&r.p.endsWith('/index.html'));
 assert.equal(records.length,entrypoints.length);
 assert.equal(new Set(records.map(r=>r.path)).size,records.length);
 assert.deepEqual(new Set(records.map(x=>x.path)),new Set(entrypoints.map(x=>x.p)));
 assert.equal(tax.mappingCoverage(records).total,records.length);
});
test('every crosswalk number is within established broad Dewey scheme and marked provisional',()=>{
 const ddc=new Set(tax.DEWEY.map(x=>x.code));
 assert.ok(Object.values(tax.DDC_CROSSWALK).every(x=>ddc.has(x)));
 assert.equal(tax.classifyDDC({apple:{primary:null}}),null);
 assert.equal(tax.classifyDDC({apple:{primary:'Reference'}}),'000');
 const unknown=records.find(x=>!x.apple.primary);assert.ok(unknown);assert.equal(unknown.ddc,null);
});
test('reverse ordering does not alter original file path identity',()=>{
 const args={axis:'up',query:'',order:'forward'};
 const a=tax.selectRecords(records,args).map(x=>x.path),b=tax.selectRecords(records,{...args,order:'reverse'}).map(x=>x.path);
 assert.deepEqual(b,a.slice().reverse());
 assert.equal(a.length,records.length);
});
test('historical approaches are distinguishable with separate documented evidence',()=>{
 const ids=tax.HISTORICAL.map(x=>x.id);
 assert.ok(ids.includes('clay')&&ids.includes('dewey')&&ids.includes('colon')&&ids.includes('stores'));
 assert.equal(ids.length,new Set(ids).size);
 assert.ok(tax.HISTORICAL.every(x=>/^https:\/\//.test(x.url)||x.url.startsWith('./')));
});
test('landing page preserves original HOP IN path and offers four real controls',()=>{
 const root=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const old=fs.readFileSync(path.join(__dirname,'original-chat-landing.html'),'utf8');
 assert.match(root,/data-axis="up"/);assert.match(root,/data-axis="down"/);
 assert.match(root,/data-axis="left"/);assert.match(root,/data-axis="right"/);
 assert.match(root,/data-axis="center"/);
 assert.match(root,/min="-9" max="9" step="1" value="0"/);
 assert.match(root,/id="reverse-order"/);
 assert.match(root,/src="\.\/app-factory\/nathan-ai\/hop-in\/chatbox\/"/);
 assert.match(old,/src="\.\/app-factory\/nathan-ai\/hop-in\/chatbox\/"/);
 assert.match(root,/node = mind = node/);assert.match(root,/mind = node = mind/);
});
test('entrypoint links remain within the original repository; no fictional store approvals',()=>{
 for(const r of records){
  assert.ok(r.path.startsWith('app-factory/'));
  assert.equal(r.status,'not-submitted');
  assert.ok(!r.ddc||tax.DEWEY.some(c=>c.code===r.ddc));
 }
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'registry.json'),'utf8'));
const items=data.items;
const ids=new Map(items.map(x=>[x.id,x]));

test('138 source positions preserve the four original family sizes and order',()=>{
 assert.equal(data.schema,'tabor123.game-mechanics-reference.v1');
 assert.equal(data.total_reference_positions,138);
 assert.equal(data.distinct_normalized_titles,134);
 assert.equal(items.length,138);
 assert.equal(ids.size,138);
 const want=[
 ['nurturing interactive sandboxes',35],
 ['conceptual master strokes',34],
 ['autonomous simulation',34],
 ['void and nothingness',35]];
 let i=0;
 for(const [family,n] of want){
  assert.equal(data.counts[family],n);
  assert.ok(items.slice(i,i+n).every(x=>x.family===family),family+' is out of source order');
  i+=n;
 }
 assert.equal(items.filter(x=>x.id.startsWith('T123-EXP-069-')).length,69);
 assert.equal(items.filter(x=>x.id.startsWith('T123-ZV-069-')).length,69);
});

test('preserves all four two-way duplicate-title references',()=>{
 const linked=items.filter(x=>x.cross_references&&x.cross_references.length);
 assert.equal(linked.length,8);
 const pairs=new Set();
 for(const x of linked){
  assert.equal(x.cross_references.length,1);
  const y=ids.get(x.cross_references[0]);assert.ok(y,'missing cross-ref '+x.id);
  assert.ok(y.cross_references.includes(x.id),'nonreciprocal duplicate '+x.id);
  pairs.add([x.id,y.id].sort().join('|'));
 }
 assert.equal(pairs.size,4);
});

test('all source IDs stay separate from independent TABOR WORLD product IDs',()=>{
 for(const x of items){
  assert.ok(/^T123-(EXP|ZV)-069-[SCAV]\d{2}$/.test(x.id),x.id);
  assert.ok(x.title && x.source_description,'incomplete entry '+x.id);
  assert.ok(!/^TW-\d{3}$/.test(x.id));
 }
 const autonomous=items.filter(x=>x.family==='autonomous simulation');
 const own=autonomous.filter(x=>x.reference_type==='first-party-project');
 assert.equal(own.length,1);
 assert.equal(own[0].title,'Tabor World (One Matrix)');
});

test('public registry contains no owner-only Gmail links or tokens',()=>{
 const text=JSON.stringify(data);
 assert.ok(!/mail\.google\.com/i.test(text));
 assert.ok(!/ACUX6DNDpOptarF9/i.test(text));
 assert.ok(!/source_verbatim/.test(text),'private verbatim sources must not enter public registry');
});

test('browser explorer and lab provide real local features, not claims of production',()=>{
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const lab=fs.readFileSync(path.join(__dirname,'zero-void-lab.html'),'utf8');
 assert.match(html,/fetch\('\.\/registry\.json'/);
 assert.match(html,/briefDownload/);
 assert.match(html,/zero-void-lab\.html/);
 assert.match(lab,/<html|<!doctype html/i);
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const api=require('./store-engine.js');
const root=__dirname;
const manifest=JSON.parse(fs.readFileSync(path.join(root,'store-discovery.json'),'utf8'));
const inventory=JSON.parse(fs.readFileSync(path.join(root,'inventory.json'),'utf8'));
test('all proposed listings link to actual indexed source entrypoints',()=>{
  assert.equal(api.validateManifest(manifest,inventory.entries),true);
  assert.ok(manifest.records.length>=50);
});
test('all original GitHub app routes are accounted for, including unclassified ones',()=>{
  const records=api.build(inventory,manifest);
  const routes=inventory.entries.filter(x=>x.t==='f'&&x.p.startsWith('app-factory/')&&x.p.endsWith('/index.html'));
  assert.equal(records.length,routes.length);
  assert.equal(new Set(records.map(r=>r.path)).size,records.length);
  assert.deepEqual(new Set(records.map(r=>r.path)),new Set(routes.map(r=>r.p)));
  assert.equal(api.counts(records).needsReview,records.length-manifest.records.length);
});
test('store labels are proposals, not approvals or verified native packages',()=>{
  const records=api.build(inventory,manifest);
  for(const entry of records) {
    assert.equal(entry.storeStatus,'not-submitted');
    assert.equal(entry.distribution,'web-entrypoint-not-native-package');
    if(entry.coverage==='unclassified') {
      assert.equal(entry.apple.primary,null);
      assert.equal(entry.google.category,null);
      assert.deepEqual(entry.capabilities,[]);
    } else assert.equal(entry.reviewStatus,'proposed-requires-product-review');
  }
  assert.equal(api.counts(records).publishedStoreListings,0);
});
test('Apple can have primary/secondary and Google only one category with limited tags',()=>{
  for(const x of manifest.records) {
    assert.ok(x.apple.primary);
    assert.ok(x.google.category);
    assert.ok(x.google.tagCandidates.length<=5);
    if(x.google.type==='game')assert.ok(api.googleGames.includes(x.google.category));
    else assert.ok(api.googleApps.includes(x.google.category));
  }
  assert.equal(manifest.limit.googleTags,5);
  assert.equal(manifest.limit.appleGameGenres,2);
});
test('category filter preserves the source functionality inventory',()=>{
  const records=api.build(inventory,manifest);
  const books=api.filter(records,{category:'Books and Reference'});
  assert.ok(books.length>5);
  assert.ok(books.every(x=>x.google.category==='Books and Reference'));
  assert.ok(api.filter(records,{coverage:'unclassified'}).length>0);
  assert.ok(api.filter(records,{capability:'protect'}).some(x=>x.path.includes('sovereign-defender')));
  assert.equal(api.filter(records,{query:'not-a-real-project-zzzz'}).length,0);
});
test('invalid category and unknown source routes are rejected',()=>{
  const bad={...manifest,records:[{...manifest.records[0],path:'app-factory/never-existed/index.html'}]};
  assert.throws(()=>api.validateManifest(bad,inventory.entries),/Missing GitHub entry point/);
  const wrong={...manifest,records:[{...manifest.records[0],apple:{primary:'Not Real',secondary:null,genre:null}}]};
  assert.throws(()=>api.validateManifest(wrong,inventory.entries),/Invalid Apple category/);
});

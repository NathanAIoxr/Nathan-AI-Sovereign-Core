'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=__dirname;
const factory=path.resolve(dir,'../..');
const core=require('./dedupe.js');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'registry.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.join(factory,'sites/sites-data.js'),'utf8'),context);
const modules=context.window.NathanAIWebsiteModules;
const sites=context.window.NathanIndependentSites;
test('nine independent sites have exactly one canonical public directory listing',()=>{
  assert.equal(sites.length,9);
  const result=core.consolidate(sites,modules);
  assert.equal(result.sites.length,9);
  assert.equal(result.apps.length,modules.length-9);
  assert.equal(result.aliases.length,9);
  for(const site of sites){
    const key='sites/'+site.slug+'/';
    assert.equal(result.sites.filter(s=>s.slug===site.slug).length,1);
    assert.equal(result.apps.filter(m=>core.canonicalPath(m.id)===key).length,0);
    assert.equal(result.aliases.filter(a=>a.canonical===key).length,1);
  }
});
test('every distinct source module remains available unchanged',()=>{
  const result=core.consolidate(sites,modules);
  const missing=result.apps.filter(m=>!modules.includes(m));
  assert.equal(missing.length,0);
  assert.equal(new Set(result.apps.map(m=>core.canonicalPath(m.id))).size,result.apps.length);
  for(const a of result.aliases)assert.ok(modules.some(m=>m.id===a.id));
});
test('newly indexed distinct modules retain their own names and routes',()=>{
  for(const id of [
    'nathan-ai/five-guardians/index.html',
    'nathan-ai/original-works/index.html',
    'nathan-ai/trinity-of-snow/index.html',
    'nathan-ai/websites/index.html',
    'nathan-ai/websites/launchpad.html',
    'one/mosaic-reader/index.html',
    'one/taborite-language-matrix/index.html'
  ]){
    assert.ok(modules.some(m=>m.id===id),'missing original app route '+id);
    assert.equal(core.consolidate(sites,modules).apps.filter(m=>m.id===id).length,1);
  }
});
test('duplicate browser favorites and recents reduce to unique known IDs',()=>{
  const known=new Set(['one','two','three']);
  assert.deepEqual(core.uniqueIds(['one','one','unknown','two','two'],known,200),['one','two']);
  assert.deepEqual(core.uniqueIds(['two','one','two'],known,1),['two']);
  assert.throws(()=>core.uniqueIds(['one'],[],5));
});
test('public portal uses consolidation and has no hardcoded historical total',()=>{
  const page=fs.readFileSync(path.join(factory,'sites/index.html'),'utf8');
  const portal=fs.readFileSync(path.join(factory,'sites/portal.js'),'utf8');
  const home=fs.readFileSync(path.join(factory,'nathan-ai/index.html'),'utf8');
  assert.match(page,/nathan-ai\/websites\/dedupe\.js/);
  assert.match(portal,/NathanDirectoryConsolidator\.consolidate/);
  assert.match(page,/id="public-page-count"/);
  assert.doesNotMatch(page,/<strong>101<\/strong><span>Previously indexed public pages/);
  const nav=home.match(/<nav[^>]*>[\s\S]*?<\/nav>/)?.[0]||'';
  const hero=home.match(/<div class="actions">[\s\S]*?<\/div>/)?.[0]||'';
  const navPaths=new Set([...nav.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(x=>x[1]));
  const heroPaths=[...hero.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(x=>x[1]);
  assert.ok(heroPaths.length<=6,'single-purpose hero shortcuts only');
  assert.equal(heroPaths.filter(x=>navPaths.has(x)).length,0,'no repeated navigation targets in hero');
  assert.ok(heroPaths.includes('../one/mosaic-reader/index.html'));
  assert.ok(navPaths.has('./websites/launchpad.html'),'My Desktop remains available in the original navigation');
});

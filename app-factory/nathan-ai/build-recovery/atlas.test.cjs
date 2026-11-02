'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=__dirname, root=path.resolve(dir,'../../..');
const data=JSON.parse(fs.readFileSync(path.join(dir,'registry.json'),'utf8'));
const game=JSON.parse(fs.readFileSync(path.join(root,'app-factory/nathan-ai/games/catalog.json'),'utf8'));
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const script=fs.readFileSync(path.join(dir,'atlas.js'),'utf8');
const hub=fs.readFileSync(path.join(root,'app-factory/nathan-ai/index.html'),'utf8');
const one=fs.readFileSync(path.join(root,'app-factory/one/index.html'),'utf8');

test('source snapshot is complete, and each original HTML file still exists',()=>{
  assert.equal(data.schema,'nathan-ai.build-recovery.v1');
  assert.equal(data.interfaces.length,76);
  assert.equal(new Set(data.interfaces.map(x=>x.path)).size,76);
  for(const entry of data.interfaces){
    assert.match(entry.path,/\.html$/);
    assert.ok(fs.existsSync(path.join(root,entry.path)),entry.path);
    assert.ok(entry.source_url.includes(entry.path));
    assert.ok(['browser source','native resource source','redirect source'].includes(entry.status));
  }
});
test('historical references, owner-held originals and game stages stay distinct',()=>{
  // 73 was the historical recovery snapshot; the live Games Atlas grows additively.
  assert.equal(data.counts.game_index_entries,73);
  assert.ok(game.entries.length>=data.counts.game_index_entries);
  assert.ok(game.entries.some(x=>x.title.includes('THE UNIVERSAL 13')));
  assert.equal(data.systems.length,92);
  assert.equal(data.archive_anchors.length,14);
  assert.equal(data.counts.prior_master_registry_rows,6056);
  assert.ok(data.archive_anchors.some(a=>a.name==='NATHAN_AI_ONE_UNIFIED_APP_v073.html'));
  assert.ok(data.systems.every(x=>x.status==='recovered reference'));
  assert.ok(data.archive_anchors.every(x=>x.status==='owner-held / historical source'));
});
test('local imports are opt-in, no telemetry or executable HTML is inserted',()=>{
  assert.match(html,/id="owner-import"/);
  assert.match(html,/id="records"/);
  assert.match(script,/\.textContent/);
  assert.match(script,/URL\.createObjectURL/);
  assert.match(script,/state\.local = \[\]/);
  assert.doesNotMatch(script,/\.innerHTML\s*=/);
  assert.doesNotMatch(script,/localStorage|indexedDB|XMLHttpRequest|sendBeacon/);
  assert.match(script,/fetch\('\.\/registry\.json'/);
  assert.match(script,/fetch\('\.\.\/games\/catalog\.json'/);
});
test('integration links to atlas from Nathan AI and ONE without replacing them',()=>{
  assert.match(hub,/build-recovery\/index\.html/);
  assert.match(one,/nathan-ai\/build-recovery\/index\.html/);
  assert.ok(fs.existsSync(path.join(root,'app-factory/nathan-ai/games/index.html')));
  assert.ok(fs.existsSync(path.join(root,'app-factory/one/library-mind/index.html')));
});

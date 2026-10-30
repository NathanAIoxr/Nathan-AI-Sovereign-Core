'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=__dirname;
const script=fs.readFileSync(path.join(base,'connected.js'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const one=fs.readFileSync(path.join(base,'..','index.html'),'utf8');
const library=fs.readFileSync(path.join(base,'..','library','index.html'),'utf8');
test('connected source is valid JavaScript and no private imports are posted to a network',()=>{
  assert.doesNotThrow(()=>new vm.Script(script));
  assert.match(script,/fetch\('\.\.\/\.\.\/products\.json'/);
  assert.doesNotMatch(script,/XMLHttpRequest|sendBeacon|WebSocket|POST \/v1\/offloads/);
  assert.doesNotMatch(script,/\.innerHTML\s*=/);
  assert.match(script,/textContent=escapeText\(value\)/);
});
test('existing source stores and immutable original boundary are respected',()=>{
  assert.match(script,/tabor-one-private-master-library-v1/);
  assert.match(script,/tabor123_vault_v1/);
  assert.match(script,/tabor123_projects_v1/);
  assert.match(script,/req\.transaction\.abort\(\)/);
  assert.match(script,/transaction\(storeName,'readonly'\)/);
  assert.match(script,/transaction\('blobs','readonly'\)/);
  assert.doesNotMatch(script,/\.deleteDatabase\(|\.clear\(\)/);
});
test('owner-controlled whole binary links preserve unverified source semantics',()=>{
  assert.match(script,/CLEAR:0,BUILD:1/);
  assert.match(script,/ownerApproved:BINARY\.BUILD/);
  assert.match(script,/externalVerified:BINARY\.CLEAR/);
  assert.match(script,/one\.connected\.owner-links\.v1/);
  assert.match(script,/originals remain untouched/);
});
test('public navigator has the expected local access and explicit disclosure',()=>{
  for(const id of ['appsCount','booksCount','imagesCount','otherCount','linksCount','results','save','importLinks','export']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/same browser profile and website origin/);
  assert.match(html,/no automatic cloud sync/i);
  assert.match(html,/FREE means FREE/);
  assert.match(html,/connected\.js/);
  assert.match(one,/\.\/connected\/index\.html/);
  assert.match(library,/\.\.\/connected\/index\.html/);
});
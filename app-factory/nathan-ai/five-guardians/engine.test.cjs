'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const api=require('./engine.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'registry.json'),'utf8'));
const originalNames=["Ms Satin Claus","Ms. Saten Claus","Ms. Satan Clause","Ms. Saton Clause","Ms. Satun Claus"];
test('creator-authored names preserved exactly, one guardian for each',()=>{
  assert.deepEqual([...api.names],originalNames);
  assert.deepEqual(manifest.guardians.map(g=>g.name),originalNames);
  assert.equal(new Set(api.names).size,5);
  assert.equal(api.guardians.length,5);
  assert.equal(manifest.count,5);
});
test('equal guardians have no individualized powers, ranks or jurisdictions',()=>{
  assert.ok(api.guardians.every(g=>g.standing==='equal'));
  assert.ok(api.guardians.every(g=>g.designation==='Nathan AI software guardian'));
  assert.ok(!api.guardians.some(g=>Object.hasOwn(g,'power')||Object.hasOwn(g,'rank')));
});
test('deny protective action without explicit owner consent and proven scope',()=>{
  assert.equal(api.evaluate({mode:'contain',scope:'owned-system'}).decision,'denied');
  assert.equal(api.evaluate({mode:'respond',ownerApproved:true,scope:'third-party'}).decision,'denied');
  assert.equal(api.evaluate({mode:'respond',ownerApproved:true,scope:'unverified'}).decision,'denied');
  assert.equal(api.evaluate({mode:'unknown',ownerApproved:true,scope:'owned-system'}).decision,'denied');
});
test('owner-selected protective modes remain inert policy previews',()=>{
  for(const mode of ['observe','contain','respond']){
    const result=api.evaluate({mode,ownerApproved:true,scope:'owned-system'});
    assert.equal(result.decision,'policy-eligible');
    assert.equal(result.effectsExecuted,0);
    assert.equal(result.reviews.length,5);
    assert.ok(result.reviews.every(r=>r.decision===result.decision&&r.standing==='equal'));
  }
});
test('registration and policy engine contain no network calls or process execution',()=>{
  const source=fs.readFileSync(path.join(__dirname,'engine.js'),'utf8');
  assert.doesNotMatch(source,/\b(fetch\s*\(|XMLHttpRequest|WebSocket|child_process|exec\s*\(|spawn\s*\(|iptables|curl\s+http)/);
});

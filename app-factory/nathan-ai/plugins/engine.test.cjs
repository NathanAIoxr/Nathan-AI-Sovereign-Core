'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('./engine.js'),inventory=require('./inventory.json');
test('all visible workflow groups and skills are captured without duplicate identities',()=>{
  assert.equal(api.validate(inventory),inventory);assert.equal(inventory.groups.length,10);assert.equal(api.list(inventory).length,93);
  assert.equal(new Set(api.list(inventory).map(w=>w.id)).size,93);
  assert.equal(inventory.groups.find(g=>g.id==='life-sciences-databases').workflows.length,44);
  assert.equal(inventory.groups.find(g=>g.id==='designly').workflows.length,19);
});
test('host workflow visibility does not imply browser execution or installation date',()=>{
  assert.equal(inventory.installationDatesKnown,false);assert.ok(inventory.groups.every(g=>g.browserExecution==='not-bridged'));
  assert.ok(inventory.requestedApps.every(a=>a.status==='not-exposed'));assert.equal(inventory.requestedApps.length,7);
  assert.ok(inventory.groups.find(g=>g.id==='cloud-environment').hostTools.length>0);
});
test('workflow search preserves plugin boundaries and routes to an actual catalog entry',()=>{
  assert.equal(api.list(inventory,'','bitcoin-mining-troubleshooter').length,1);
  assert.equal(api.list(inventory,'','hypawave').length,1);
  assert.ok(api.list(inventory,'dashboard','data-analytics').length>0);
  const h=api.handoff(inventory,'hypawave:hypawave','Explain the available messaging workflow');assert.match(h.request,/does not grant account permissions/);
  assert.throws(()=>api.handoff(inventory,'missing:workflow','Task'));assert.throws(()=>api.handoff(inventory,'hypawave:hypawave',''));
});
test('assistant context is source-attributed metadata, not account contents or tool grants',()=>{
  const rows=api.sources(inventory,'data-analytics:build-dashboard');assert.equal(rows.length,1);assert.match(rows[0].body,/browser execution is not bridged/);assert.equal(rows[0].private,false);assert.match(rows[0].stage,/not an account connection/);
});
test('malformed and duplicate workflow inventories are rejected',()=>{
  const copy=JSON.parse(JSON.stringify(inventory));copy.groups[0].workflows.push(copy.groups[0].workflows[0]);assert.throws(()=>api.validate(copy));
  assert.throws(()=>api.validate({...inventory,installationDatesKnown:true}));
});
test('plugin UI does not execute code or call external services on selection',()=>{
  const s=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');assert.doesNotMatch(s,/innerHTML\s*=|\beval\s*\(|fetch\(['"]https?:/);assert.match(s,/Nothing sent or executed/);
});

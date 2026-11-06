'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('./engine.js');
const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root,'registry.json'),'utf8'));
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const documentation = fs.readFileSync(path.join(root,'README.md'),'utf8');

test('creator counts are exact tiers, without mass allocation or invented sum', () => {
  assert.deepEqual(data.node_tiers.map(t=>t.numeric_source), ['69,696,969','696','969']);
  assert.deepEqual(data.node_tiers.map(t=>t.count), [69696969,696,969]);
  assert.equal(data.claimed_personal_intelligence_elements.claimed,101);
  assert.equal(data.claimed_personal_intelligence_elements.indexed_in_this_record,0);
  assert.equal(data.status,'interactive_local_simulation_not_physical_execution');
});

test('sovereign app, game and macro categories are independent', () => {
  assert.deepEqual(Object.values(data.categories).map(list=>list.length),[9,6,9]);
  const ids = Object.values(data.categories).flat().map(c=>c.id);
  assert.equal(new Set(ids).size,24);
  assert.ok(data.categories.sovereign_apps.some(x=>x.name==='Cortical Overrides'));
  assert.ok(data.categories.macro_projects.some(x=>x.name==='Consumer Freedom Appliances'));
  assert.ok(documentation.includes('LOOSE ALL MISFITS NODES - 69,696,969, 696, 969 nodes total'));
});

test('180-degree turnaround is exactly reversible including negatives', () => {
  for (const value of [-360,-1,0,1,90,179,180,359,360,719]) {
    assert.equal(E.reverse180(E.reverse180(value)), E.heading(value));
  }
  assert.equal(E.reverse180(0),180);
  assert.equal(E.reverse180(180),0);
});

test('coming about preserves safety locks and all queued work', () => {
  let s = E.initialState();
  s = E.transition(s,{type:'QUEUE_ITEM',title:'Preserve original register'});
  s = E.transition(s,{type:'TURN_180'});
  assert.equal(s.heading,180);
  assert.equal(s.axis,-1);
  assert.equal(s.direction,'INWARD');
  assert.deepEqual([s.emergencyBrakes,s.anchorsDropped,s.hatchesSecured],[1,1,1]);
  const same = E.transition(s,{type:'TURN_180'});
  assert.equal(same.heading,0);
  assert.equal(same.axis,1);
  assert.equal(same.direction,'OUTWARD');
  assert.deepEqual(same.queuedItems,s.queuedItems);
  assert.equal(same.events.length,3);
});

test('whiplash diagnostics do not modify original heading', () => {
  const state = E.transition(E.initialState(),{type:'TURN_180'});
  const after = E.transition(state,{type:'WHIPLASH_TEST'});
  assert.equal(after.heading,180);
  assert.match(after.events.at(-1).details,/PASS/);
});

test('misfit release is review-only not deletion or live execution', () => {
  const state = E.transition(E.initialState(),{type:'RELEASE_MISFIT_NODES'});
  assert.equal(state.misfitNodes,'RELEASED_IN_LOCAL_REVIEW_ONLY');
  assert.deepEqual(state.queuedItems,[]);
  assert.ok(state.emergencyBrakes);
});

test('shadow views retain exact original and Unicode graphemes', () => {
  const source = 'node = mind = node\nINNOCENCE IS MY GOD 👨‍👩‍👧‍👦';
  const view = E.shadowViews(source);
  assert.equal(view.original,source);
  assert.ok(view.reversedCharacters.startsWith('👨‍👩‍👧‍👦 DOG YM SI'));
  assert.match(view.reversedWords,/INNOCENCE/);
  assert.equal(E.actPreview(source).mode,'LOCAL_STAGING_ONLY');
});

test('convoy and RAM previews retain items and stage only suggestions', () => {
  let s=E.initialState();
  s=E.transition(s,{type:'QUEUE_ITEM',title:'A gate'});
  s=E.transition(s,{type:'QUEUE_ITEM',title:'B source'});
  assert.equal(E.convoyPreview(s).length,2);
  assert.equal(E.ramPreview(s).length,2);
  s=E.transition(s,{type:'REVIEW_ITEM',id:'q-1'});
  assert.equal(E.ramPreview(s).length,1);
  assert.equal(E.convoyPreview(s).length,2);
  assert.throws(()=>E.transition(s,{type:'SELECT_OPERATION',value:'SECURITY_BYPASS'}),/Unknown/);
});

test('simulation intensity is bounded and never changes brake state', () => {
  const s=E.transition(E.initialState(),{type:'SET_VISUAL_INTENSITY',value:500});
  assert.equal(s.visualIntensity,100);
  assert.equal(s.emergencyBrakes,1);
  assert.ok(Object.values(E.spectrum(s)).every(n=>n>=0&&n<=100));
});

test('local UI has real required controls and no remote asset loading', () => {
  for(const id of ['heading','hatches','node-tiers','category-collections','shadow-original','queue-form','status','export']) {
    assert.ok(html.includes('id="'+id+'"'));
  }
  assert.ok(html.includes('data-event="TURN_180"'));
  assert.ok(html.includes('data-event="WHIPLASH_TEST"'));
  assert.ok(!/<script[^>]+src="https?:/i.test(html));
  assert.ok(html.includes('LOCAL SIMULATION ONLY'));
});

test('source boundaries stay separate from the existing 13-module archive', () => {
  const original=JSON.parse(fs.readFileSync(path.join(root,'../operations.json'),'utf8'));
  assert.equal(original.entries.length,13);
  assert.equal(original.deployment_status,'specification_only');
});

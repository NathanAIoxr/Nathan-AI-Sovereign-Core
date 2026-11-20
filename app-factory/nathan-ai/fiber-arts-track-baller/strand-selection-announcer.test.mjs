import test from 'node:test';
import assert from 'node:assert/strict';
import { createStrandSelectionAnnouncer } from './strand-selection-announcer.mjs';
test('selection and activation are announced without modifying input', () => {
  const spoken=[]; const selection=Object.freeze({id:'s1',index:0,activated:false});
  const a=createStrandSelectionAnnouncer({announce:s=>spoken.push(s),labels:{s1:'Blue wool'}});
  assert.equal(a.onSelection(selection),true);
  a.onSelection({id:'s1',index:0,activated:true});
  assert.deepEqual(spoken,['Selected strand Blue wool','Activated strand Blue wool']);
  assert.equal(selection.activated,false);
});
test('unknown strand uses its identifier and ignores prototype labels', () => {
  const spoken=[]; const a=createStrandSelectionAnnouncer({announce:s=>spoken.push(s),labels:{}});
  a.onSelection({id:'toString',index:1,activated:false});
  assert.deepEqual(spoken,['Selected strand toString']);
});
test('invalid inputs fail closed', () => {
  assert.throws(()=>createStrandSelectionAnnouncer({announce:null}),TypeError);
  assert.throws(()=>createStrandSelectionAnnouncer({announce:()=>{},labels:{x:''}}),TypeError);
  const a=createStrandSelectionAnnouncer({announce:()=>{}});
  assert.throws(()=>a.onSelection({id:'x',index:-1,activated:false}),TypeError);
});
test('disposal suppresses future announcements', () => {
  const spoken=[]; const a=createStrandSelectionAnnouncer({announce:s=>spoken.push(s)});
  a.dispose(); a.dispose();
  assert.equal(a.onSelection({id:'x',index:0,activated:false}),false);
  assert.deepEqual(spoken,[]);
});

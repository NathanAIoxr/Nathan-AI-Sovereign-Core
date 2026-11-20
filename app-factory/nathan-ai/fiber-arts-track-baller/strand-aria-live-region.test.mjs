import test from 'node:test';
import assert from 'node:assert/strict';
import { createStrandAriaLiveRegion } from './strand-aria-live-region.mjs';
function region() {
  const attrs = new Map();
  return { textContent: '', setAttribute(k,v) { attrs.set(k,v); }, getAttribute(k) { return attrs.get(k) ?? null; }, attrs };
}
const selection = Object.freeze({ id: 's1', index: 0, activated: false });
test('disabled by default and sets nonintrusive live-region defaults', () => {
  const r=region(); const a=createStrandAriaLiveRegion({region:r});
  assert.equal(a.onSelection(selection),false);
  assert.equal(r.textContent,'');
  assert.equal(r.attrs.get('aria-live'),'polite');
  assert.equal(r.attrs.get('aria-atomic'),'true');
});
test('opt-in announces selection and activation using existing announcer', () => {
  const r=region(); const a=createStrandAriaLiveRegion({region:r,enabled:true,labels:{s1:'Blue wool'}});
  assert.equal(a.onSelection(selection),true);
  assert.equal(r.textContent,'Selected strand Blue wool');
  a.onSelection({...selection,activated:true});
  assert.equal(r.textContent,'Activated strand Blue wool');
  assert.equal(selection.activated,false);
});
test('preserves existing aria configuration and allows disabling', () => {
  const r=region(); r.setAttribute('aria-live','assertive');
  const a=createStrandAriaLiveRegion({region:r,enabled:true});
  a.setEnabled(false);
  assert.equal(a.onSelection(selection),false);
  assert.equal(r.attrs.get('aria-live'),'assertive');
  assert.equal(r.textContent,'');
});
test('rejects invalid region and enable flags', () => {
  assert.throws(()=>createStrandAriaLiveRegion({region:{}}),TypeError);
  assert.throws(()=>createStrandAriaLiveRegion({region:region(),enabled:'yes'}),TypeError);
  const a=createStrandAriaLiveRegion({region:region()});
  assert.throws(()=>a.setEnabled(1),TypeError);
});
test('dispose stops announcements and is idempotent', () => {
  const r=region(); const a=createStrandAriaLiveRegion({region:r,enabled:true});
  a.dispose(); a.dispose();
  assert.equal(a.onSelection(selection),false);
  assert.equal(a.setEnabled(true),false);
  assert.equal(r.textContent,'');
});

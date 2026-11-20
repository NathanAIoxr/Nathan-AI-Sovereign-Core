import test from 'node:test';
import assert from 'node:assert/strict';
import { attachKeyboardAriaSelection } from './keyboard-aria-selection.mjs';

function fixture(enabled = false) {
  const listeners = new Map(), selections = [], attrs = new Map();
  const element = { addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); } };
  const region = { textContent: '', setAttribute(k,v) { attrs.set(k,v); }, getAttribute(k) { return attrs.get(k) ?? null; } };
  const adapter = attachKeyboardAriaSelection(element, [{id:'first'},{id:'second'}], region, { enabled, onSelection(s) { selections.push(s); } });
  function press(key) { let prevented = false; listeners.get('keydown')?.({key, target:{tagName:'DIV'}, preventDefault() { prevented = true; }}); return prevented; }
  return {adapter, selections, region, press, listeners};
}

test('disabled-by-default does not capture keys or change selection', () => {
  const f = fixture(); assert.equal(f.press('ArrowRight'), false); assert.equal(f.press('Enter'), false);
  assert.equal(f.adapter.getSelectedId(), null); assert.equal(f.selections.length, 0); assert.equal(f.region.textContent, ''); f.adapter.dispose();
});
test('enable activates selection and ARIA announcements', () => {
  const f = fixture(); assert.equal(f.adapter.setEnabled(true), true); assert.equal(f.press('ArrowRight'), true);
  assert.equal(f.adapter.getSelectedId(), 'first'); assert.equal(f.selections.length, 1); assert.match(f.region.textContent, /strand/i); f.adapter.dispose();
});
test('disable prevents shortcuts without losing selection, reenable resumes', () => {
  const f = fixture(true); f.press('ArrowRight'); assert.equal(f.adapter.setEnabled(false), true);
  assert.equal(f.press('ArrowRight'), false); assert.equal(f.press('Enter'), false); assert.equal(f.selections.length, 1);
  assert.equal(f.adapter.getSelectedId(), 'first'); f.adapter.setEnabled(true); assert.equal(f.press('ArrowRight'), true);
  assert.equal(f.adapter.getSelectedId(), 'second'); f.adapter.dispose();
});
test('invalid enable value is rejected and disposal removes listeners', () => {
  const f = fixture(); assert.throws(() => f.adapter.setEnabled('yes'), TypeError);
  f.adapter.dispose(); assert.equal(f.listeners.size, 0); assert.equal(f.adapter.setEnabled(true), false);
});

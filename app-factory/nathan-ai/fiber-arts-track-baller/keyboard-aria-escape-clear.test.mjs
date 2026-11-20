import test from 'node:test';
import assert from 'node:assert/strict';
import { attachKeyboardAriaSelection } from './keyboard-aria-selection.mjs';

function fixture(options = {}) {
  const listeners = new Map();
  const element = {
    addEventListener(key, fn) { listeners.set(key, fn); },
    removeEventListener(key, fn) { if (listeners.get(key) === fn) listeners.delete(key); }
  };
  const attrs = new Map();
  const region = {
    textContent: '',
    setAttribute(key, value) { attrs.set(key, value); },
    getAttribute(key) { return attrs.get(key) ?? null; }
  };
  const controller = attachKeyboardAriaSelection(element, [{ id: 'wool' }], region, options);
  function press(key) {
    let prevented = false;
    listeners.get('keydown')?.({ key, target: { tagName: 'DIV' }, preventDefault() { prevented = true; } });
    return prevented;
  }
  return { controller, region, press, listeners };
}
test('Escape clearing is off by default', () => {
  const f = fixture({ enabled: true });
  f.press('ArrowRight');
  assert.equal(f.press('Escape'), false);
  assert.equal(f.controller.getSelectedId(), 'wool');
  f.controller.dispose();
});
test('opt-in Escape clears selection and announces the clear', () => {
  const f = fixture({ enabled: true, allowEscapeClear: true });
  f.press('ArrowRight');
  assert.equal(f.press('Escape'), true);
  assert.equal(f.controller.getSelectedId(), null);
  assert.equal(f.region.textContent, 'Strand selection cleared');
  f.controller.dispose();
});
test('rejected clear leaves selection and announcement unchanged', () => {
  const f = fixture({ enabled: true, allowEscapeClear: true, onSelection: s => !s.cleared });
  f.press('ArrowRight');
  const prior = f.region.textContent;
  f.press('Escape');
  assert.equal(f.controller.getSelectedId(), 'wool');
  assert.equal(f.region.textContent, prior);
  f.controller.dispose();
});
test('disabled adapter never intercepts Escape', () => {
  const f = fixture({ allowEscapeClear: true });
  assert.equal(f.press('Escape'), false);
  assert.equal(f.region.textContent, '');
  f.controller.dispose();
});
test('invalid Escape option is rejected', () => {
  assert.throws(() => fixture({ allowEscapeClear: 'yes' }), TypeError);
});

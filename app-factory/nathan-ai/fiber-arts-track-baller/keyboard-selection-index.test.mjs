import test from 'node:test';
import assert from 'node:assert/strict';
import { attachKeyboardAriaSelection } from './keyboard-aria-selection.mjs';

function setup(options = {}) {
  const listeners = new Map();
  const element = {
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type, callback) { if (listeners.get(type) === callback) listeners.delete(type); }
  };
  const attributes = new Map();
  const region = {
    textContent: '',
    setAttribute(key, value) { attributes.set(key, value); },
    getAttribute(key) { return attributes.get(key) ?? null; }
  };
  const controller = attachKeyboardAriaSelection(element, [{ id: 'cotton' }, { id: 'wool' }], region, options);
  const press = key => listeners.get('keydown')?.({ key, target: { tagName: 'DIV' }, preventDefault() {} });
  return { controller, press };
}

test('read-only index starts empty and follows accepted navigation', () => {
  const { controller, press } = setup({ enabled: true });
  assert.equal(controller.getSelectedIndex(), -1);
  press('ArrowRight');
  assert.equal(controller.getSelectedIndex(), 0);
  press('ArrowRight');
  assert.equal(controller.getSelectedIndex(), 1);
  controller.dispose();
});

test('rejected navigation does not advance the index', () => {
  const { controller, press } = setup({ enabled: true, onSelection: selection => selection.id !== 'wool' });
  press('ArrowRight');
  press('ArrowRight');
  assert.equal(controller.getSelectedIndex(), 0);
  controller.dispose();
});

test('opt-in Escape clearing resets index', () => {
  const { controller, press } = setup({ enabled: true, allowEscapeClear: true });
  press('ArrowRight');
  press('Escape');
  assert.equal(controller.getSelectedIndex(), -1);
  controller.dispose();
});

test('disabled navigation preserves index and disposal hides it', () => {
  const { controller, press } = setup({ enabled: true });
  press('ArrowRight');
  controller.setEnabled(false);
  press('ArrowRight');
  assert.equal(controller.getSelectedIndex(), 0);
  controller.dispose();
  assert.equal(controller.getSelectedIndex(), -1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { attachPointerSelection } from './pointer-listener.mjs';

function fixture() {
  const listeners = new Map();
  const element = {
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
    getBoundingClientRect() { return { left: 10, top: 20, width: 100, height: 80 }; }
  };
  return { element, emit: e => listeners.get('pointerup')?.(e), count: () => listeners.size };
}
const pointer = (overrides = {}) => ({ clientX: 30, clientY: 40, isPrimary: true, pointerType: 'touch', button: 0, ...overrides });
test('registers and disposes idempotently', () => {
  const f = fixture(), selected = [];
  const binding = attachPointerSelection(f.element, p => selected.push(p));
  assert.equal(f.count(), 1);
  f.emit(pointer());
  assert.deepEqual(selected, [{ x: 20, y: 20 }]);
  binding.dispose(); binding.dispose();
  assert.equal(f.count(), 0);
  f.emit(pointer());
  assert.equal(selected.length, 1);
});
test('ignores non-primary, outside and secondary-button pointers', () => {
  const f = fixture(), selected = [];
  attachPointerSelection(f.element, p => selected.push(p));
  f.emit(pointer({ isPrimary: false }));
  f.emit(pointer({ clientX: 999 }));
  f.emit(pointer({ button: 2 }));
  assert.equal(selected.length, 0);
});
test('rejects invalid element and callback', () => {
  assert.throws(() => attachPointerSelection({}, () => {}), TypeError);
  assert.throws(() => attachPointerSelection(fixture().element, null), TypeError);
});

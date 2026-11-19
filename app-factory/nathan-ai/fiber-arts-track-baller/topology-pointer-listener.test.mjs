import test from 'node:test';
import assert from 'node:assert/strict';
import { attachTopologyPointerSelection } from './topology-pointer-listener.mjs';

function viewport() {
  const listeners = new Map();
  return {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); },
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 100 }),
    emit: event => listeners.get('pointerup')?.(event),
    count: () => listeners.size
  };
}
const strands = [{ id: 'a', braidIndex: 1, points: [{ x: 10, y: 10 }, { x: 30, y: 10 }] }, { id: 'b', braidIndex: 2, points: [{ x: 10, y: 40 }, { x: 30, y: 40 }] }];
const pointer = (extra = {}) => ({ clientX: 30, clientY: 30, pointerType: 'touch', isPrimary: true, button: 0, ...extra });

test('opt-in listener selects mapped strand and crossing symbolically', () => {
  const el = viewport(), results = [];
  const binding = attachTopologyPointerSelection(el, strands, [{ strand: 1, parity: 1 }], r => results.push(r), { radius: 8 });
  assert.equal(el.count(), 1);
  el.emit(pointer());
  assert.equal(results.length, 1);
  assert.equal(results[0].simulation, 'symbolic-only');
  assert.equal(results[0].braidIndex, 1);
  assert.deepEqual(results[0].crossingSteps, [1]);
  binding.dispose();
  assert.equal(el.count(), 0);
});
test('ignores out-of-bounds and secondary pointers, and cleans up', () => {
  const el = viewport(), results = [];
  const binding = attachTopologyPointerSelection(el, strands, [], r => results.push(r));
  el.emit(pointer({ clientX: 999 }));
  el.emit(pointer({ isPrimary: false }));
  el.emit(pointer({ button: 2 }));
  assert.equal(results.length, 0);
  binding.dispose(); binding.dispose();
  el.emit(pointer());
  assert.equal(results.length, 0);
});
test('rejects invalid callback and catalog arguments', () => {
  const el = viewport();
  assert.throws(() => attachTopologyPointerSelection(el, strands, [], null), TypeError);
  assert.throws(() => attachTopologyPointerSelection(el, null, [], () => {}), TypeError);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { attachPinchViewport } from './pinch-viewport-bridge.mjs';

function target() {
  const listeners = new Map();
  return {
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
    emit(name, pointerId, x, y) { listeners.get(name)?.({ pointerId, clientX: x, clientY: y, pointerType: 'touch' }); },
    count() { return listeners.size; }
  };
}
function start(t) { t.emit('pointerdown', 1, 0, 0); t.emit('pointerdown', 2, 10, 0); }

test('two-pointer movement updates zoom and quaternion, without modifying input', () => {
  const t = target(), states = [], q = [1, 0, 0, 0];
  const bridge = attachPinchViewport(t, s => states.push(s), { orientation: q });
  start(t); t.emit('pointermove', 2, 0, 20);
  assert.equal(states.length, 1);
  assert.ok(states[0].zoom > 1);
  assert.ok(Math.abs(states[0].orientation[3]) > 0.1);
  assert.deepEqual(q, [1, 0, 0, 0]);
  assert.equal(states[0].simulated, true);
  bridge.dispose();
});

test('snapshots are immutable and pan accumulates', () => {
  const t = target(), bridge = attachPinchViewport(t, () => {});
  start(t); t.emit('pointermove', 1, 2, 2);
  const s = bridge.getState();
  assert.equal(s.panX, 1); assert.equal(s.panY, 1);
  assert.ok(Object.isFrozen(s)); assert.ok(Object.isFrozen(s.orientation));
  assert.throws(() => { s.orientation[0] = 7; }, TypeError);
  bridge.dispose();
});

test('cancel stops frames and dispose removes listeners idempotently', () => {
  const t = target(), states = [], bridge = attachPinchViewport(t, s => states.push(s));
  start(t); t.emit('pointercancel', 2, 10, 0); t.emit('pointermove', 1, 2, 0);
  assert.equal(states.length, 0);
  bridge.dispose(); bridge.dispose();
  assert.equal(t.count(), 0);
});

test('invalid configuration fails before installing listeners', () => {
  const t = target();
  assert.throws(() => attachPinchViewport(t, null), TypeError);
  assert.throws(() => attachPinchViewport(t, () => {}, { zoom: 0 }), RangeError);
  assert.equal(t.count(), 0);
});

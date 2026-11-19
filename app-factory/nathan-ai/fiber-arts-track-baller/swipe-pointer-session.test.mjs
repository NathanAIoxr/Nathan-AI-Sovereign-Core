import test from 'node:test';
import assert from 'node:assert/strict';
import { attachSwipePointerSession } from './swipe-pointer-session.mjs';

function target() {
  const handlers = new Map();
  return {
    addEventListener(name, fn) { handlers.set(name, fn); },
    removeEventListener(name, fn) { if (handlers.get(name) === fn) handlers.delete(name); },
    emit(name, data) { handlers.get(name)?.(data); },
    get count() { return handlers.size; }
  };
}
const event = (pointerId, x, y, timeStamp, pointerType = 'touch') => ({ pointerId, clientX:x, clientY:y, timeStamp, pointerType, button:0 });
test('reports one valid opt-in swipe', () => {
  const t = target(), found = [];
  const session = attachSwipePointerSession(t, f => found.push(f));
  t.emit('pointerdown', event(3, 0, 0, 10));
  t.emit('pointerup', event(3, 40, 0, 100));
  assert.equal(found.length, 1);
  assert.equal(found[0].direction, 'right');
  assert.equal(found[0].simulated, true);
  session.dispose();
});
test('rejects short swipe and wrong pointer', () => {
  const t = target(), found = [];
  attachSwipePointerSession(t, f => found.push(f));
  t.emit('pointerdown', event(1, 0, 0, 10));
  t.emit('pointerup', event(2, 50, 0, 40));
  t.emit('pointerup', event(1, 5, 0, 50));
  assert.equal(found.length, 0);
});
test('cancellation clears gesture', () => {
  const t = target(), found = [];
  attachSwipePointerSession(t, f => found.push(f));
  t.emit('pointerdown', event(1, 0, 0, 10));
  t.emit('pointercancel', { pointerId:1 });
  t.emit('pointerup', event(1, 40, 0, 50));
  assert.equal(found.length, 0);
});
test('dispose is idempotent and removes listeners', () => {
  const t = target(), found = [];
  const session = attachSwipePointerSession(t, f => found.push(f));
  session.dispose(); session.dispose();
  assert.equal(t.count, 0);
  t.emit('pointerdown', event(1, 0, 0, 10));
  t.emit('pointerup', event(1, 40, 0, 50));
  assert.equal(found.length, 0);
});
test('secondary mouse button ignored', () => {
  const t = target(), found = [];
  attachSwipePointerSession(t, f => found.push(f));
  t.emit('pointerdown', { ...event(1, 0, 0, 10, 'mouse'), button:2 });
  t.emit('pointerup', event(1, 40, 0, 50, 'mouse'));
  assert.equal(found.length, 0);
});

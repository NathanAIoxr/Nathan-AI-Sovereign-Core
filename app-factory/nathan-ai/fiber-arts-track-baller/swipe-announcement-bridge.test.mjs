import test from 'node:test';
import assert from 'node:assert/strict';
import { attachSwipeAnnouncementBridge } from './swipe-announcement-bridge.mjs';

function element() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); },
    emit(type, event) { listeners.get(type)?.(event); },
    count() { return listeners.size; }
  };
}
function region() {
  const attrs = new Map();
  return {
    textContent: '',
    getAttribute(k) { return attrs.get(k) ?? null; },
    setAttribute(k, v) { attrs.set(k, v); },
    removeAttribute(k) { attrs.delete(k); }
  };
}
function swipe(el) {
  el.emit('pointerdown', { pointerId: 1, pointerType: 'touch', button: 0, clientX: 100, clientY: 10, timeStamp: 0 });
  el.emit('pointerup', { pointerId: 1, pointerType: 'touch', button: 0, clientX: 0, clientY: 10, timeStamp: 100 });
}
test('announces accepted swipe selections', () => {
  const el = element(), live = region(), seen = [];
  const bridge = attachSwipeAnnouncementBridge(el, [{ id: 'a' }, { id: 'b' }], live, s => seen.push(s.id));
  swipe(el);
  assert.deepEqual(seen, ['b']);
  assert.match(live.textContent, /b/);
  bridge.dispose();
});
test('rejected selection does not announce', () => {
  const el = element(), live = region();
  const bridge = attachSwipeAnnouncementBridge(el, [{ id: 'a' }], live, () => false);
  swipe(el);
  assert.equal(live.textContent, '');
  bridge.dispose();
});
test('disposal restores attributes and removes listeners', () => {
  const el = element(), live = region();
  live.setAttribute('role', 'note');
  const bridge = attachSwipeAnnouncementBridge(el, [{ id: 'a' }], live);
  assert.equal(live.getAttribute('role'), 'status');
  bridge.dispose(); bridge.dispose();
  assert.equal(live.getAttribute('role'), 'note');
  assert.equal(el.count(), 0);
  assert.equal(bridge.getSelectedId(), null);
});
test('invalid strands restore live region', () => {
  const el = element(), live = region();
  assert.throws(() => attachSwipeAnnouncementBridge(el, [{ id: 'x' }, { id: 'x' }], live), /unique/);
  assert.equal(live.getAttribute('role'), null);
});

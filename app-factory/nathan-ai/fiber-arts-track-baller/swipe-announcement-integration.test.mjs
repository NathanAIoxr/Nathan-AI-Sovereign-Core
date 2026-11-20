import test from 'node:test';
import assert from 'node:assert/strict';
import { attachSwipeAnnouncementBridge } from './swipe-announcement-bridge.mjs';

// Real dependency-chain test: pointer session -> swipe -> strand -> live announcer.
function target() {
  const listeners = new Map();
  return {
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
    emit(name, props) { listeners.get(name)?.(props); },
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
function swipe(el, id = 1) {
  el.emit('pointerdown', { pointerId: id, pointerType: 'touch', clientX: 150, clientY: 30, timeStamp: 0 });
  el.emit('pointerup', { pointerId: id, pointerType: 'touch', clientX: 10, clientY: 30, timeStamp: 200 });
}
test('real pointer swipe selects a strand and announces it', () => {
  const el = target(), live = region(), selections = [];
  const bridge = attachSwipeAnnouncementBridge(el, [{ id: 'wool-a' }, { id: 'wool-b' }], live, s => { selections.push(s); });
  swipe(el);
  assert.equal(selections.length, 1);
  assert.equal(selections[0].id, 'wool-b');
  assert.equal(selections[0].simulated, true);
  assert.match(live.textContent, /wool-b/);
  assert.equal(live.getAttribute('aria-live'), 'polite');
  bridge.dispose();
  assert.equal(el.count(), 0);
  assert.equal(live.getAttribute('aria-live'), null);
});
test('rejected selection produces no announcement', () => {
  const el = target(), live = region();
  const bridge = attachSwipeAnnouncementBridge(el, [{ id: 'wool-a' }], live, () => false);
  swipe(el);
  assert.equal(live.textContent, '');
  bridge.dispose();
});
test('cancelled pointer and disposal cannot announce', () => {
  const el = target(), live = region();
  const bridge = attachSwipeAnnouncementBridge(el, [{ id: 'wool-a' }], live);
  el.emit('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 150, clientY: 30, timeStamp: 0 });
  el.emit('pointercancel', { pointerId: 1 });
  el.emit('pointerup', { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 30, timeStamp: 200 });
  assert.equal(live.textContent, '');
  bridge.dispose();
  swipe(el);
  assert.equal(live.textContent, '');
});

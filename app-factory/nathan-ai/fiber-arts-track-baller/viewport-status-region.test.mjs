import test from 'node:test';
import assert from 'node:assert/strict';
import { attachViewportStatusRegion } from './viewport-status-region.mjs';

function region(initial = {}) {
  const attrs = new Map(Object.entries(initial));
  return {
    textContent: '',
    getAttribute: name => attrs.get(name) ?? null,
    setAttribute: (name, value) => attrs.set(name, value),
    removeAttribute: name => attrs.delete(name)
  };
}

test('announces valid simulated viewport changes without repeating equivalent frames', () => {
  const node = region();
  const status = attachViewportStatusRegion(node);
  assert.equal(node.getAttribute('aria-live'), 'polite');
  assert.equal(status.update({ orientation: [0, 0, 0, 1], zoom: 1 }), true);
  assert.match(node.textContent, /zoom 1 times/);
  assert.equal(status.update({ orientation: [0, 0, 0, -1], zoom: 1 }), false);
  assert.equal(status.update({ orientation: [0, 0, 0, 1], zoom: 2 }), true);
  assert.equal(status.update({ orientation: [0, 0, 0, 2], zoom: 2 }), true);
  assert.equal(node.textContent, '3D craft view unavailable');
  assert.equal(status.update(null), false);
});

test('restores original accessibility attributes and stops updates after disposal', () => {
  const node = region({ role: 'note', 'aria-live': 'off' });
  const status = attachViewportStatusRegion(node);
  status.dispose();
  status.dispose();
  assert.equal(node.getAttribute('role'), 'note');
  assert.equal(node.getAttribute('aria-live'), 'off');
  assert.equal(node.getAttribute('aria-atomic'), null);
  assert.equal(status.update({ orientation: [0, 0, 0, 1], zoom: 1 }), false);
  assert.equal(node.textContent, '');
});

test('rejects incomplete status regions', () => {
  assert.throws(() => attachViewportStatusRegion({ setAttribute() {} }), TypeError);
});

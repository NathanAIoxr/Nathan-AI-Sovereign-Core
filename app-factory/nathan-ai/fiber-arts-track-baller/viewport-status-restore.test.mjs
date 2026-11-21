import test from 'node:test';
import assert from 'node:assert/strict';
import { attachViewportStatusRegion } from './viewport-status-region.mjs';

function region() {
  const attributes = new Map([['role', 'note']]);
  return {
    textContent: 'Original instructions',
    getAttribute: key => attributes.get(key) ?? null,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key)
  };
}

test('opt-in restores original status text and attributes on disposal', () => {
  const node = region();
  const status = attachViewportStatusRegion(node, { restoreTextOnDispose: true });
  status.update({ orientation: [0, 0, 0, 1], zoom: 2 });
  assert.notEqual(node.textContent, 'Original instructions');
  status.dispose();
  status.dispose();
  assert.equal(node.textContent, 'Original instructions');
  assert.equal(node.getAttribute('role'), 'note');
  assert.equal(node.getAttribute('aria-live'), null);
});

test('default preserves last announcement for backward compatibility', () => {
  const node = region();
  const status = attachViewportStatusRegion(node);
  status.update({ orientation: [0, 0, 0, 1], zoom: 3 });
  const announced = node.textContent;
  status.dispose();
  assert.equal(node.textContent, announced);
});

test('invalid opt-in configuration does not mutate region', () => {
  const node = region();
  assert.throws(() => attachViewportStatusRegion(node, { restoreTextOnDispose: 'yes' }), TypeError);
  assert.equal(node.getAttribute('role'), 'note');
  assert.equal(node.textContent, 'Original instructions');
});

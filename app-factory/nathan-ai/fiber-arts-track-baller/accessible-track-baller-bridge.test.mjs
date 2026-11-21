import test from 'node:test';
import assert from 'node:assert/strict';
import { connectAccessibleTrackBaller } from './accessible-track-baller-bridge.mjs';

function region() {
  const attributes = new Map([['role', 'note']]);
  return {
    textContent: '',
    getAttribute: key => attributes.get(key) ?? null,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key)
  };
}
function controller() {
  let current = { orientation: [0, 0, 0, 1], zoom: 1 };
  return {
    syncFrame(frame) { current = frame; return true; },
    getFrame() { return current; }
  };
}
test('publishes simulated viewport and accessible description, then disposes safely', () => {
  const node = region();
  const published = [];
  const connection = connectAccessibleTrackBaller(controller(), node, frame => published.push(frame), {
    rejectInvalidFrame: true, snapshotPublishedFrame: true
  });
  assert.equal(connection.onTouchFrame({ orientation: [0, 0, 0, 1], zoom: 2 }), true);
  assert.match(node.textContent, /zoom 2 times/);
  assert.equal(published.length, 1);
  assert.equal(Object.isFrozen(published[0]), true);
  assert.equal(connection.onTouchFrame({ orientation: [0, 0, 0, 1], zoom: -1 }), false);
  assert.equal(connection.getMetrics().rejectedFrames, 1);
  connection.dispose();
  connection.dispose();
  assert.equal(node.getAttribute('role'), 'note');
  assert.equal(node.getAttribute('aria-live'), null);
  assert.equal(connection.onTouchFrame({ orientation: [0, 0, 0, 1], zoom: 3 }), false);
  assert.equal(published.length, 1);
});
test('restores region attributes if bridge initialization fails', () => {
  const node = region();
  assert.throws(() => connectAccessibleTrackBaller(null, node), TypeError);
  assert.equal(node.getAttribute('role'), 'note');
  assert.equal(node.getAttribute('aria-live'), null);
});

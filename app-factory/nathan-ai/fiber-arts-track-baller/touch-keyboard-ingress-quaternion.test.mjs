import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

test('opt-in ingress guard rejects malformed rotations before controller mutation', () => {
  let calls = 0;
  let frame = { zoom: 1, orientation: [0, 0, 0, 1] };
  const controller = { getFrame: () => frame, syncFrame: next => { calls++; frame = next; return true; } };
  const bridge = bridgeTouchToKeyboard(controller, () => {}, { rejectInvalidQuaternion: true });
  for (const orientation of [[0, 0, 0, 2], [NaN, 0, 0, 1], [0, 0, 1], 'bad']) {
    assert.equal(bridge.onTouchFrame({ zoom: 1, orientation }), false);
  }
  assert.equal(bridge.onTouchFrame({ zoom: 2, orientation: [0, 0, 0, -1] }), true);
  assert.equal(calls, 1);
  assert.deepEqual(bridge.getMetrics(), { acceptedFrames: 1, rejectedFrames: 4, publishedFrames: 1, active: true });
});

test('default compatibility permits controller-owned validation', () => {
  let calls = 0;
  const controller = { getFrame: () => ({}), syncFrame: () => { calls++; return true; } };
  const bridge = bridgeTouchToKeyboard(controller);
  assert.equal(bridge.onTouchFrame({ orientation: [0, 0, 0, 2] }), true);
  assert.equal(calls, 1);
  assert.throws(() => bridgeTouchToKeyboard(controller, () => {}, { rejectInvalidQuaternion: 'yes' }), TypeError);
});

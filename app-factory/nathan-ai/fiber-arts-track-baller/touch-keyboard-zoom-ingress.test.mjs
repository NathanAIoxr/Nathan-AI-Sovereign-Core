import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

test('opt-in zoom ingress guard rejects invalid scales without controller mutation', () => {
  let calls = 0;
  let current = { zoom: 1, orientation: [0, 0, 0, 1] };
  const controller = { getFrame: () => current, syncFrame: next => { calls++; current = next; return true; } };
  const bridge = bridgeTouchToKeyboard(controller, () => {}, { rejectInvalidZoom: true });
  for (const zoom of [0, -1, NaN, Infinity, -Infinity, '2', undefined]) {
    assert.equal(bridge.onTouchFrame({ zoom, orientation: [0, 0, 0, 1] }), false);
  }
  assert.equal(bridge.onTouchFrame(null), false);
  assert.equal(calls, 0);
  assert.equal(bridge.onTouchFrame({ zoom: 2, orientation: [0, 0, 0, 1] }), true);
  assert.equal(calls, 1);
  assert.deepEqual(bridge.getMetrics(), { acceptedFrames: 1, rejectedFrames: 8, publishedFrames: 1, active: true });
});

test('default compatibility and invalid option validation', () => {
  let calls = 0;
  const controller = { getFrame: () => ({}), syncFrame: () => { calls++; return true; } };
  assert.equal(bridgeTouchToKeyboard(controller).onTouchFrame({ zoom: -1 }), true);
  assert.equal(calls, 1);
  assert.throws(() => bridgeTouchToKeyboard(controller, () => {}, { rejectInvalidZoom: 'yes' }), TypeError);
});

test('zoom guard composes with quaternion guard', () => {
  let calls = 0;
  const controller = { getFrame: () => ({}), syncFrame: () => { calls++; return true; } };
  const bridge = bridgeTouchToKeyboard(controller, () => {}, { rejectInvalidZoom: true, rejectInvalidQuaternion: true });
  assert.equal(bridge.onTouchFrame({ zoom: 1, orientation: [0, 0, 0, 2] }), false);
  assert.equal(bridge.onTouchFrame({ zoom: 0, orientation: [0, 0, 0, 1] }), false);
  assert.equal(bridge.onTouchFrame({ zoom: 1, orientation: [0, 0, 0, 1] }), true);
  assert.equal(calls, 1);
});

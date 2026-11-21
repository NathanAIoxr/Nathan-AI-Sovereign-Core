import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

test('opt-in frame shape validation blocks malformed frames before controller mutation', () => {
  let calls = 0, published = 0;
  const controller = { syncFrame() { calls++; return true; }, getFrame() { return { orientation: [0,0,0,1], zoom: 1 }; } };
  const bridge = bridgeTouchToKeyboard(controller, () => published++, { rejectInvalidFrame: true });
  for (const frame of [null, [], {}, { orientation: [0,0,0], zoom: 1 }, { orientation: [0,0,0,Infinity], zoom: 1 }, { orientation: [0,0,0,1], zoom: 0 }]) {
    assert.equal(bridge.onTouchFrame(frame), false);
  }
  assert.equal(calls, 0);
  assert.deepEqual(bridge.getMetrics(), { acceptedFrames: 0, rejectedFrames: 6, publishedFrames: 0, active: true });
  assert.equal(bridge.onTouchFrame({ orientation: [0,0,0,1], zoom: 1 }), true);
  assert.equal(calls, 1);
  assert.equal(published, 1);
});

test('default behavior and configuration validation remain intact', () => {
  let calls = 0;
  const controller = { syncFrame() { calls++; return true; }, getFrame() { return {}; } };
  const bridge = bridgeTouchToKeyboard(controller);
  assert.equal(bridge.onTouchFrame({}), true);
  assert.equal(calls, 1);
  assert.throws(() => bridgeTouchToKeyboard(controller, () => {}, { rejectInvalidFrame: 'yes' }), TypeError);
});

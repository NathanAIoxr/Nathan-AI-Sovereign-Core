import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

const frame = zoom => ({ orientation: [0, 0, 0, 1], zoom });
test('opt-in zoom bounds reject out-of-range frames before controller mutation', () => {
  let calls = 0;
  const controller = { syncFrame() { calls++; return true; }, getFrame() { return frame(1); } };
  const bridge = bridgeTouchToKeyboard(controller, () => {}, { zoomBounds: [0.5, 4] });
  for (const zoom of [0, -1, 0.49, 4.01, Infinity, NaN, '2']) {
    assert.equal(bridge.onTouchFrame(frame(zoom)), false);
  }
  for (const zoom of [0.5, 1, 4]) assert.equal(bridge.onTouchFrame(frame(zoom)), true);
  assert.equal(calls, 3);
  assert.deepEqual(bridge.getMetrics(), { acceptedFrames: 3, rejectedFrames: 7, publishedFrames: 3, active: true });
});
test('zoom bounds are copied and default behavior is unchanged', () => {
  let calls = 0;
  const controller = { syncFrame() { calls++; return true; }, getFrame() { return frame(1); } };
  const bounds = [0.5, 4];
  const guarded = bridgeTouchToKeyboard(controller, () => {}, { zoomBounds: bounds });
  bounds[1] = 100;
  assert.equal(guarded.onTouchFrame(frame(10)), false);
  const legacy = bridgeTouchToKeyboard(controller);
  assert.equal(legacy.onTouchFrame(frame(10)), true);
  assert.equal(calls, 1);
});
test('invalid bounds fail closed at configuration time', () => {
  const controller = { syncFrame() { return true; }, getFrame() { return frame(1); } };
  for (const zoomBounds of [[], [0, 2], [3, 2], [1, Infinity], [1, '2'], {}, [1, 2, 3]]) {
    assert.throws(() => bridgeTouchToKeyboard(controller, () => {}, { zoomBounds }), TypeError);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

test('metrics distinguish accepted, rejected, published and disposed frames', () => {
  let frame = { zoom: 1, orientation: [0, 0, 0, 1] };
  const controller = {
    getFrame: () => frame,
    syncFrame: next => {
      if (!next || !Number.isFinite(next.zoom)) return false;
      frame = next;
      return true;
    }
  };
  const seen = [];
  const bridge = bridgeTouchToKeyboard(controller, next => seen.push(next), { suppressUnchanged: true });
  assert.deepEqual(bridge.getMetrics(), { acceptedFrames: 0, rejectedFrames: 0, publishedFrames: 0, active: true });
  assert.equal(bridge.onTouchFrame({ zoom: 1, orientation: [0, 0, 0, 1] }), true);
  assert.equal(bridge.onTouchFrame({ zoom: NaN, orientation: [0, 0, 0, 1] }), false);
  assert.equal(bridge.onTouchFrame({ zoom: 2, orientation: [0, 0, 0, 1] }), true);
  assert.equal(seen.length, 1);
  assert.deepEqual(bridge.getMetrics(), { acceptedFrames: 2, rejectedFrames: 1, publishedFrames: 1, active: true });
  assert.equal(Object.isFrozen(bridge.getMetrics()), true);
  bridge.dispose();
  assert.equal(bridge.onTouchFrame({ zoom: 3, orientation: [0, 0, 0, 1] }), false);
  assert.deepEqual(bridge.getMetrics(), { acceptedFrames: 2, rejectedFrames: 1, publishedFrames: 1, active: false });
});

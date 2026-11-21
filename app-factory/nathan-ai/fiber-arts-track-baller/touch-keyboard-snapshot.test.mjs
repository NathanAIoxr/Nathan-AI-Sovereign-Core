import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

test('opt-in snapshot isolates callback from mutable controller frame', () => {
  const state = { zoom: 1, orientation: [0, 0, 0, 1] };
  let delivered;
  const controller = { syncFrame: frame => { Object.assign(state, frame); return true; }, getFrame: () => state };
  const bridge = bridgeTouchToKeyboard(controller, frame => { delivered = frame; }, { snapshotPublishedFrame: true });
  assert.equal(bridge.onTouchFrame({ zoom: 2, orientation: [0, 0, 0, 1] }), true);
  assert.notStrictEqual(delivered, state);
  assert.notStrictEqual(delivered.orientation, state.orientation);
  assert.equal(Object.isFrozen(delivered), true);
  assert.equal(Object.isFrozen(delivered.orientation), true);
  assert.throws(() => { delivered.orientation[0] = 1; }, TypeError);
  assert.equal(state.orientation[0], 0);
  assert.deepEqual(bridge.getMetrics(), { acceptedFrames: 1, rejectedFrames: 0, publishedFrames: 1, active: true });
});

test('default callback retains original controller frame identity', () => {
  const state = { zoom: 1, orientation: [0, 0, 0, 1] };
  let delivered;
  const bridge = bridgeTouchToKeyboard({ syncFrame: () => true, getFrame: () => state }, frame => { delivered = frame; });
  assert.equal(bridge.onTouchFrame(state), true);
  assert.strictEqual(delivered, state);
});

test('snapshot option rejects invalid configuration', () => {
  const controller = { syncFrame: () => true, getFrame: () => ({}) };
  assert.throws(() => bridgeTouchToKeyboard(controller, () => {}, { snapshotPublishedFrame: 'yes' }), TypeError);
});

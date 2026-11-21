import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

function setup() {
  let state = { panX: 0, simulated: true, verifiedPhysics: false };
  const emitted = [];
  const controller = {
    syncFrame(frame) {
      if (!Number.isFinite(frame?.panX)) throw new TypeError('invalid frame');
      state = Object.freeze({ panX: frame.panX, simulated: true, verifiedPhysics: false });
      return true;
    },
    getFrame() { return state; }
  };
  return { controller, emitted, bridge: bridgeTouchToKeyboard(controller, frame => emitted.push(frame)) };
}
test('touch frame synchronizes and publishes sanitized keyboard state', () => {
  const h = setup();
  assert.equal(h.bridge.onTouchFrame({ panX: 42, verifiedPhysics: true }), true);
  assert.deepEqual(h.emitted, [{ panX: 42, simulated: true, verifiedPhysics: false }]);
});
test('invalid touch frames do not publish state', () => {
  const h = setup();
  assert.throws(() => h.bridge.onTouchFrame({ panX: NaN }), TypeError);
  assert.equal(h.emitted.length, 0);
});
test('dispose prevents subsequent synchronization', () => {
  const h = setup(); h.bridge.dispose();
  assert.equal(h.bridge.onTouchFrame({ panX: 10 }), false);
  assert.equal(h.controller.getFrame().panX, 0);
});
test('rejected synchronization does not publish', () => {
  const emitted = [];
  const bridge = bridgeTouchToKeyboard({ syncFrame: () => false, getFrame: () => ({}) }, x => emitted.push(x));
  assert.equal(bridge.onTouchFrame({}), false);
  assert.equal(emitted.length, 0);
});
test('invalid configuration rejected', () => {
  assert.throws(() => bridgeTouchToKeyboard({}), TypeError);
  assert.throws(() => bridgeTouchToKeyboard({ syncFrame() {}, getFrame() {} }, null), TypeError);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

function setup(options) {
  let state = Object.freeze({ panX: 0, simulated: true, verifiedPhysics: false });
  const emitted = [];
  const controller = {
    syncFrame(frame) {
      state = Object.freeze({ panX: frame.panX, simulated: true, verifiedPhysics: false });
      return true;
    },
    getFrame() { return state; }
  };
  return { emitted, bridge: bridgeTouchToKeyboard(controller, frame => emitted.push(frame), options) };
}

test('opt-in suppresses duplicate sanitized frames', () => {
  const h = setup({ suppressUnchanged: true });
  assert.equal(h.bridge.onTouchFrame({ panX: 0 }), true);
  assert.equal(h.emitted.length, 0);
  h.bridge.onTouchFrame({ panX: 5 });
  h.bridge.onTouchFrame({ panX: 5 });
  assert.equal(h.emitted.length, 1);
  assert.equal(h.emitted[0].panX, 5);
});
test('default emits even unchanged frames', () => {
  const h = setup();
  h.bridge.onTouchFrame({ panX: 0 });
  h.bridge.onTouchFrame({ panX: 0 });
  assert.equal(h.emitted.length, 2);
});
test('invalid option rejected', () => assert.throws(() => setup({ suppressUnchanged: 'yes' }), TypeError));
test('disposed bridge does not emit', () => {
  const h = setup({ suppressUnchanged: true });
  h.bridge.dispose();
  assert.equal(h.bridge.onTouchFrame({ panX: 8 }), false);
  assert.equal(h.emitted.length, 0);
});

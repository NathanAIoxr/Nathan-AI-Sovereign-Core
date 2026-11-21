import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

const frame = (orientation = [0, 0, 0, 1]) => ({ zoom: 1, panX: 0, panY: 0, orientation, simulated: true, verifiedPhysics: false, handled: false });
function setup() {
  let state = frame();
  const calls = [];
  const controller = {
    getFrame: () => state,
    syncFrame: incoming => { state = { ...incoming, orientation: [...incoming.orientation] }; return true; }
  };
  return { controller, calls };
}
test('equivalent quaternion values suppress callback despite new array identity', () => {
  const { controller, calls } = setup();
  const bridge = bridgeTouchToKeyboard(controller, next => calls.push(next), { suppressUnchanged: true });
  assert.equal(bridge.onTouchFrame(frame()), true);
  assert.equal(calls.length, 0);
});
test('changed quaternion emits callback', () => {
  const { controller, calls } = setup();
  bridgeTouchToKeyboard(controller, next => calls.push(next), { suppressUnchanged: true }).onTouchFrame(frame([0, 0, 1, 0]));
  assert.equal(calls.length, 1);
});
test('default mode still emits identical frame', () => {
  const { controller, calls } = setup();
  bridgeTouchToKeyboard(controller, next => calls.push(next)).onTouchFrame(frame());
  assert.equal(calls.length, 1);
});

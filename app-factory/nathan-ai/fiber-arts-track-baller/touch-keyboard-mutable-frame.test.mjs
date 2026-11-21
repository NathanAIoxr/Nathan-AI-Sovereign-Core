import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';
function mutableController() {
  const frame = { orientation: [1, 0, 0, 0], zoom: 1 };
  return { frame, syncFrame(next) { frame.orientation.splice(0, 4, ...next.orientation); frame.zoom = next.zoom; return true; }, getFrame() { return frame; } };
}
test('mutable controller reports real orientation changes', () => {
  const controller = mutableController(); const calls = [];
  const bridge = bridgeTouchToKeyboard(controller, frame => calls.push(frame), { suppressUnchanged: true });
  assert.equal(bridge.onTouchFrame({ orientation: [0, 1, 0, 0], zoom: 1 }), true);
  assert.equal(calls.length, 1);
});
test('mutable controller suppresses sign-equivalent orientation', () => {
  const controller = mutableController(); const calls = [];
  const bridge = bridgeTouchToKeyboard(controller, frame => calls.push(frame), { suppressUnchanged: true });
  bridge.onTouchFrame({ orientation: [-1, 0, 0, 0], zoom: 1 });
  assert.equal(calls.length, 0);
});
test('mutable controller reports zoom changes', () => {
  const controller = mutableController(); const calls = [];
  const bridge = bridgeTouchToKeyboard(controller, frame => calls.push(frame), { suppressUnchanged: true });
  bridge.onTouchFrame({ orientation: [1, 0, 0, 0], zoom: 2 });
  assert.equal(calls.length, 1);
});

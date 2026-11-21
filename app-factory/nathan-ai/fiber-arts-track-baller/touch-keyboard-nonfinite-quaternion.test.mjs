import test from 'node:test';
import assert from 'node:assert/strict';
import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';

function fixture(initial, options = { suppressUnchanged: true }) {
  let frame = { orientation: initial, zoom: 1 };
  const emitted = [];
  const controller = {
    getFrame() { return frame; },
    syncFrame(next) { frame = { ...next }; return true; }
  };
  return { bridge: bridgeTouchToKeyboard(controller, next => emitted.push(next), options), emitted };
}

test('identical NaN orientations are never coalesced', () => {
  const { bridge, emitted } = fixture([NaN, 0, 0, 0]);
  assert.equal(bridge.onTouchFrame({ orientation: [NaN, 0, 0, 0], zoom: 1 }), true);
  assert.equal(emitted.length, 1);
});
test('identical Infinity orientations are never coalesced', () => {
  const { bridge, emitted } = fixture([Infinity, 0, 0, 0]);
  bridge.onTouchFrame({ orientation: [Infinity, 0, 0, 0], zoom: 1 });
  assert.equal(emitted.length, 1);
});
test('finite identical orientations remain coalesced', () => {
  const { bridge, emitted } = fixture([1, 0, 0, 0]);
  bridge.onTouchFrame({ orientation: [1, 0, 0, 0], zoom: 1 });
  assert.equal(emitted.length, 0);
});
test('sign-equivalent finite orientations remain coalesced', () => {
  const { bridge, emitted } = fixture([1, 0, 0, 0]);
  bridge.onTouchFrame({ orientation: [-1, 0, 0, 0], zoom: 1 });
  assert.equal(emitted.length, 0);
});

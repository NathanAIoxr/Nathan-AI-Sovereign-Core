import test from 'node:test';
import assert from 'node:assert/strict';
import { attachKeyboardViewportListener } from './keyboard-viewport-listener.mjs';
const base = { zoom: 1, panX: 0, panY: 0, orientation: [1,0,0,0] };
function harness(options = {}, onFrame = () => {}) {
  const listeners = new Map();
  const element = { addEventListener(k, cb) { listeners.set(k, cb); }, removeEventListener(k, cb) { if (listeners.get(k) === cb) listeners.delete(k); } };
  const controller = attachKeyboardViewportListener(element, base, onFrame, options);
  function press(key, target = { tagName: 'DIV' }, extra = {}) { let prevented = false; listeners.get('keydown')?.({ key, target, preventDefault() { prevented = true; }, ...extra }); return prevented; }
  return { controller, press, listeners };
}
test('disabled by default and enabled explicitly', () => { const h = harness(); assert.equal(h.press('ArrowRight'), false); assert.equal(h.controller.getFrame().panX, 0); h.controller.setEnabled(true); assert.equal(h.press('ArrowRight'), true); assert.equal(h.controller.getFrame().panX, 16); h.controller.dispose(); });
test('interactive descendants and modifier keys are ignored', () => { const h = harness({ enabled: true }); assert.equal(h.press('ArrowRight', { tagName: 'INPUT' }), false); assert.equal(h.press('ArrowRight', { tagName: 'DIV' }, { ctrlKey: true }), false); assert.equal(h.controller.getFrame().panX, 0); h.controller.dispose(); });
test('rejected viewport frame does not change state', () => { const h = harness({ enabled: true }, () => false); assert.equal(h.press('+'), true); assert.equal(h.controller.getFrame().zoom, 1); h.controller.dispose(); });
test('unknown keys are not consumed and disposal removes listener', () => { const h = harness({ enabled: true }); assert.equal(h.press('Enter'), false); h.controller.dispose(); assert.equal(h.listeners.size, 0); assert.equal(h.press('ArrowRight'), false); });
test('reduced motion options flow to simulated viewport', () => { const h = harness({ enabled: true, frameOptions: { reducedMotion: true } }); h.press('ArrowDown'); assert.equal(h.controller.getFrame().panY, 4); assert.equal(h.controller.getFrame().verifiedPhysics, false); h.controller.dispose(); });

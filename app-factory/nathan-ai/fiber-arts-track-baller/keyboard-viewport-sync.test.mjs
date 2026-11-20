import test from 'node:test';
import assert from 'node:assert/strict';
import { attachKeyboardViewportListener } from './keyboard-viewport-listener.mjs';

const base = { zoom: 1, panX: 0, panY: 0, orientation: [1, 0, 0, 0] };
function setup() {
  const handlers = new Map();
  const element = {
    addEventListener(type, handler) { handlers.set(type, handler); },
    removeEventListener(type) { handlers.delete(type); }
  };
  const announcements = [];
  const controller = attachKeyboardViewportListener(element, base, frame => announcements.push(frame), { enabled: true });
  function key(key) { handlers.get('keydown')({ key, target: { tagName: 'DIV' }, preventDefault() {} }); }
  return { controller, announcements, key };
}

test('external touch frame becomes the next keyboard pan baseline', () => {
  const h = setup();
  assert.equal(h.controller.syncFrame({ ...base, panX: 100, zoom: 2 }), true);
  h.key('ArrowRight');
  assert.equal(h.controller.getFrame().panX, 116);
  assert.equal(h.controller.getFrame().zoom, 2);
  h.controller.dispose();
});

test('synchronization never invokes keyboard callback and marks simulation accurately', () => {
  const h = setup();
  h.controller.syncFrame({ ...base, verifiedPhysics: true, simulated: false });
  assert.equal(h.announcements.length, 0);
  assert.equal(h.controller.getFrame().verifiedPhysics, false);
  assert.equal(h.controller.getFrame().simulated, true);
  assert.equal(Object.isFrozen(h.controller.getFrame().orientation), true);
  h.controller.dispose();
});

test('invalid external frames reject without corrupting the last frame', () => {
  const h = setup();
  assert.throws(() => h.controller.syncFrame({ ...base, zoom: NaN }), TypeError);
  assert.equal(h.controller.getFrame().zoom, 1);
  h.key('ArrowRight');
  assert.equal(h.controller.getFrame().panX, 16);
  h.controller.dispose();
});

test('disposed listener refuses external synchronization', () => {
  const h = setup();
  h.controller.dispose();
  assert.equal(h.controller.syncFrame({ ...base, panX: 200 }), false);
  assert.equal(h.controller.getFrame().panX, 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { attachKeyboardStrandNavigation } from './keyboard-strand-navigation.mjs';
function fixture(opts = {}, onSelection = () => {}) {
  const handlers = new Map();
  const element = { addEventListener: (k, v) => handlers.set(k, v), removeEventListener: k => handlers.delete(k) };
  const nav = attachKeyboardStrandNavigation(element, [{ id: 'a' }, { id: 'b' }], onSelection, opts);
  const send = key => {
    let prevented = false;
    handlers.get('keydown')?.({ key, target: { tagName: 'DIV' }, preventDefault() { prevented = true; } });
    return prevented;
  };
  return { nav, send };
}
test('Escape does not clear unless opted in', () => { const f = fixture(); f.send('ArrowRight'); assert.equal(f.send('Escape'), false); assert.equal(f.nav.getSelectedId(), 'a'); f.nav.dispose(); });
test('opt-in Escape clears selection and emits clear event', () => { const events = []; const f = fixture({ allowEscapeClear: true }, s => events.push(s)); f.send('ArrowRight'); assert.equal(f.send('Escape'), true); assert.equal(f.nav.getSelectedId(), null); assert.deepEqual({ ...events.at(-1) }, { id: null, index: -1, source: 'keyboard', activated: false, cleared: true }); f.nav.dispose(); });
test('rejected clear preserves selection', () => { const f = fixture({ allowEscapeClear: true }, s => s.cleared ? false : true); f.send('ArrowRight'); f.send('Escape'); assert.equal(f.nav.getSelectedId(), 'a'); f.nav.dispose(); });
test('Escape with no selection does nothing', () => { const f = fixture({ allowEscapeClear: true }); assert.equal(f.send('Escape'), false); f.nav.dispose(); });
test('invalid opt-in rejected', () => { assert.throws(() => fixture({ allowEscapeClear: 'yes' }), TypeError); });

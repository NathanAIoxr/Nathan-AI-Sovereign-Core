import test from 'node:test';
import assert from 'node:assert/strict';
import { createStrandAnnouncer } from './live-announcer.mjs';

function region() {
  const attrs = new Map([['role', 'note']]);
  return { textContent: '', getAttribute: k => attrs.get(k) ?? null,
    setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k) };
}
test('opt-in strand announcement sets polite live region', () => {
  const el = region(), announcer = createStrandAnnouncer(el);
  assert.equal(el.getAttribute('aria-live'), 'polite');
  assert.equal(announcer.announce({ selectedStrand: { id: 'blue' } }), true);
  assert.equal(el.textContent, 'Selected strand blue');
  announcer.dispose();
  assert.equal(el.getAttribute('role'), 'note');
  assert.equal(el.getAttribute('aria-live'), null);
});
test('misses and disposed announcers are safe', () => {
  const el = region(), announcer = createStrandAnnouncer(el);
  announcer.announce(null);
  assert.equal(el.textContent, 'No strand selected');
  announcer.dispose(); announcer.dispose();
  assert.equal(announcer.announce({ id: 'x' }), false);
  assert.equal(el.textContent, 'No strand selected');
});
test('invalid region and identifiers are rejected', () => {
  assert.throws(() => createStrandAnnouncer({}), TypeError);
  const announcer = createStrandAnnouncer(region());
  assert.throws(() => announcer.announce({ id: 3 }), TypeError);
});

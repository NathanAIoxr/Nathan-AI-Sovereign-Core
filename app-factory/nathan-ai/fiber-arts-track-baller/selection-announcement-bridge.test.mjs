import test from 'node:test';
import assert from 'node:assert/strict';
import { createSelectionAnnouncementBridge } from './selection-announcement-bridge.mjs';

test('forwards selected strand and original event to consumer and announcer', () => {
  const calls = [], selected = { selectedStrand: { id: 'warp-1' }, simulation: 'symbolic-only' }, event = { pointerType: 'touch' };
  const bridge = createSelectionAnnouncementBridge({ announce: x => { calls.push(['announce', x]); return true; } }, (x, e) => { calls.push(['select', x, e]); });
  assert.equal(bridge.onSelection(selected, event), true);
  assert.deepEqual(calls, [['select', selected, event], ['announce', selected]]);
});
test('consumer veto suppresses announcements', () => {
  let count = 0;
  const bridge = createSelectionAnnouncementBridge({ announce: () => { count++; return true; } }, () => false);
  assert.equal(bridge.onSelection(null), false);
  assert.equal(count, 0);
});
test('disposal is idempotent and prevents further callbacks', () => {
  let count = 0;
  const bridge = createSelectionAnnouncementBridge({ announce: () => { count++; return true; } });
  bridge.dispose(); bridge.dispose();
  assert.equal(bridge.onSelection({ id: 'a' }), false);
  assert.equal(count, 0);
});
test('validates both dependencies and reports announcer failure', () => {
  assert.throws(() => createSelectionAnnouncementBridge(null), TypeError);
  assert.throws(() => createSelectionAnnouncementBridge({ announce() {} }, null), TypeError);
  assert.equal(createSelectionAnnouncementBridge({ announce: () => false }).onSelection({}), false);
});

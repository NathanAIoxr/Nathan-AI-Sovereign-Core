const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const e = require('./engine.js');
const catalog = JSON.parse(fs.readFileSync(__dirname + '/catalog.json', 'utf8'));
test('complete registry and inherited categories stay distinct', () => {
 const defs = e.validateCatalog(catalog.minds);
 assert.equal(defs.length, 763);
 assert.equal(new Set(defs.map(m => m.id)).size, defs.length);
 assert.equal(catalog.legacyCounts.creator_forms, 27);
 assert.equal(catalog.legacyCounts.alabama_legends, 11);
 assert.equal(catalog.legacyCounts.global_mythology, 544);
 assert.equal(catalog.legacyCounts.mind_modes, 126);
});
test('Renaissance masters differ from Turtle personas', () => {
 for (const name of ['leonardo','raphael','donatello','michelangelo']) {
  assert.ok(catalog.minds.some(m => m.id === 'renaissance.' + name));
  assert.ok(catalog.minds.some(m => m.id === 'tmnt.' + name));
 }
});
test('Omni namespace remains virtual and bounds-checked', () => {
 assert.equal(catalog.minds.filter(m => m.type === 'pantheon-identity').length, 20);
 assert.equal(e.omniAddress('125999999999').allocated, false);
 assert.throws(() => e.omniAddress('126000000000'), /between/);
 assert.throws(() => e.omniAddress('-1'), /between/);
});
test('Node Runtime 732m separate namespace', () => {
 assert.equal(e.nodeAddress('731999999').address, '731999999');
 assert.throws(() => e.nodeAddress('732000000'), /between/);
});
test('Source original survives review and interpretation', () => {
 assert.equal(e.build(1,1), 2);
 assert.equal(e.clear(1,1), 0);
 const quote = 'for a living dog is better than a dead lion.';
 const a = e.intake(quote,'KJV:Ecclesiastes:9:4');
 assert.equal(a.original, quote);
 assert.equal(a.stage, 'CERO');
 const b = e.review(a, 'KJV quotation', ['KJV:Ecclesiastes:9:4']);
 assert.equal(b.stage, 'UNO_PENDING');
 const c = e.connect(b, 'author comparison', 'Devil Dog of Alabama');
 assert.equal(c.stage, 'DOS');
 assert.equal(a.original, quote);
 assert.equal(c.doesNotModifyOriginal, true);
});
test('Planning proposes only, does not run any real agent', () => {
 const p = e.plan('Research folklore', ['tmnt.leonardo','renaissance.leonardo','textual.buddha'], catalog.minds, 'DOS');
 assert.equal(p.steps.length, 3);
 assert.equal(p.execution, 'not-connected');
 assert.equal(p.approval, 'owner-required');
 assert.ok(p.steps.every(x => x.status.includes('not executed')));
});
test('Catalog searches folklore and source IDs', () => {
 assert.ok(e.search(catalog.minds, '', 'folklore-lens').length >= 555);
 assert.ok(e.search(catalog.minds, 'Buddha').length > 0);
});

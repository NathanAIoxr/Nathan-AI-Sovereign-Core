import test from 'node:test';
import assert from 'node:assert/strict';
import { auditFiberCompleteFile } from './catalog-complete-file-gate.mjs';
const catalog = () => Array.from({ length: 12 }, (_, i) => ({
  id: `craft-${i}`, steps: Array.from({ length: 6 }, (_, j) => ({ id: `step-${i}-${j}` }))
}));
const read = value => async () => JSON.stringify(value);
test('accepts complete unique catalog from explicit file', async () => {
  const r = await auditFiberCompleteFile('fixture.json', { read: read({ crafts: catalog() }) });
  assert.equal(r.ok, true); assert.equal(r.craftCount, 12); assert.equal(r.stepCount, 72);
  assert.equal(r.source, 'fixture.json');
});
test('rejects cross-craft duplicate step identifiers', async () => {
  const crafts = catalog(); crafts[1].steps[0].id = crafts[0].steps[0].id;
  const r = await auditFiberCompleteFile('fixture.json', { read: read(crafts) });
  assert.equal(r.ok, false); assert.match(r.errors.join(' '), /reused across crafts/);
});
test('rejects missing steps without altering input', async () => {
  const crafts = catalog(); crafts[0].steps.pop(); const before = JSON.stringify(crafts);
  const r = await auditFiberCompleteFile('fixture.json', { read: read(crafts) });
  assert.equal(r.ok, false); assert.equal(JSON.stringify(crafts), before);
});
test('fails closed on malformed JSON', async () => {
  const r = await auditFiberCompleteFile('broken.json', { read: async () => '{' });
  assert.equal(r.ok, false); assert.match(r.errors[0], /invalid JSON/);
});
test('fails closed on unreadable file', async () => {
  const r = await auditFiberCompleteFile('missing.json', { read: async () => { throw new Error('ENOENT'); } });
  assert.equal(r.ok, false);
});
test('requires explicit path', async () => {
  await assert.rejects(auditFiberCompleteFile('', { read: read(catalog()) }), /explicit catalog path/);
});

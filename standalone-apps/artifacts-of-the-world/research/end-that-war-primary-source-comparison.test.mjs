import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const original = readFileSync(new URL('original.txt', root), 'utf8').trim();
const dossier = readFileSync(new URL('research/end-that-war-primary-source-comparison.md', root), 'utf8');

test('original author statement is retained verbatim, not paraphrased', () => {
  assert.ok(dossier.includes('> ' + original));
});
test('Egyptian, KJV and assistant interpretation are separate with source links', () => {
  for (const marker of ['Spell 125', 'EA10470', 'Matthew 25:31–46', 'Romans 2:6–11', 'Author-created comparison', 'Scientific boundary', 'Unresolved']) {
    assert.ok(dossier.includes(marker), 'Missing ' + marker);
  }
  assert.match(dossier, /britishmuseum\.org\/collection\/object/);
  assert.match(dossier, /version=KJV/);
});
test('research does not assert verified identity, custody or publication', () => {
  assert.match(dossier, /no artifact identity, provenance, custody/);
  assert.match(dossier, /no public Pages deployment/);
  assert.match(dossier, /Dark matter is inferred from astrophysical/);
});

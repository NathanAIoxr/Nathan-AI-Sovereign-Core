'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readSnapshot, search } = require('./app.js');
const { records: roots } = require('./roots.json');

const record = { id: 'notion:12', title: 'Original work', source: 'Notion', status: 'Documented', url: 'https://example.com/12' };
const snapshot = { schema: 'nathan-ai.source-snapshot.v1', date: '2026-11-16', authorText: '1-1=2\nExact original', records: [record] };

test('keeps all 17 root IDs in the numbered order and searches their descriptions', () => {
  assert.deepEqual(roots.map(root => root.id), Array.from({ length: 17 }, (_, index) => 'ROOT-' + String(index + 1).padStart(2, '0')));
  assert.deepEqual(search(roots, 'causal').map(root => root.id), ['ROOT-16']);
});

test('preserves verbatim text and distinct records with the same title', () => {
  const alt = { ...record, id: 'drive:12', source: 'Drive' };
  const result = readSnapshot({ ...snapshot, records: [record, alt] });
  assert.equal(result.authorText, snapshot.authorText);
  assert.deepEqual(search(result.records, 'original work'), [record, alt]);
  assert.deepEqual(search(result.records, 'original work', 'Drive'), [alt]);
});

test('rejects duplicate identifiers and unsafe links before loading a snapshot', () => {
  assert.throws(() => readSnapshot({ ...snapshot, records: [record, record] }), /unique identifier/);
  for (const url of ['javascript:alert(1)', 'http://example.com', 'https://a:b@example.com']) {
    assert.throws(() => readSnapshot({ ...snapshot, records: [{ ...record, url }] }), /must be HTTPS/);
  }
});

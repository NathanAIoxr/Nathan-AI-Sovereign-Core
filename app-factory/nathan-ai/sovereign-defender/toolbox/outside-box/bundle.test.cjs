'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const api = require('./engine.js');
const bundle = require('./bundle.js');

const encoder = new TextEncoder();
const noJournal = () => ({ assessments: [], decisions: [], outcomes: [] });

async function fixture() {
  const bytes = encoder.encode(' ' + JSON.stringify({
    schema: api.INPUT_SCHEMA,
    events: [{ observedAt: '2026-11-18T14:00:00Z', asset: 'example.invalid',
      observation: 'Test evidence with Unicode Æ', family: 'O' }]
  }) + '\n');
  const report = await api.importEvidence('synthetic.json', bytes);
  return { bytes, report, caseRecord: api.buildCase([report]),
    source: { id: report.source.sha256, bytes } };
}

test('reopens the original bytes and preserves independently linked journal records', async () => {
  const { bytes, caseRecord, source } = await fixture();
  const evidenceId = caseRecord.timeline[0].id;
  const decision = api.recordDecision(caseRecord, {
    evidenceId, reason: 'Confirm the application grant', ownerConfirmed: true, action: 'revoke'
  });
  const assessment = api.recordReview(caseRecord, {
    evidenceId, family: 'O', confidence: 'possible', reason: 'Grant evidence'
  });
  const outcome = api.recordOutcome(decision, { status: 'verified-by-owner', evidence: 'Synthetic receipt 42' });
  const zipped = await bundle.create([source], caseRecord, { decisions: [decision], assessments: [assessment], outcomes: [outcome] });
  const restored = await bundle.open(zipped);
  assert.deepEqual(restored.sources[0].bytes, bytes);
  assert.deepEqual(restored.decisions, [decision]);
  assert.deepEqual(restored.assessments, [assessment]);
  assert.deepEqual(restored.outcomes, [outcome]);
  assert.equal(restored.sources[0].report.events[0].id, evidenceId);
});

test('rejects modified source bytes, even if the length still matches', async () => {
  const { bytes, source, caseRecord } = await fixture();
  const changed = bytes.slice();
  changed[0] = 9;
  await assert.rejects(bundle.create([{ ...source, bytes: changed }], caseRecord, noJournal()), /digest mismatch/i);
});

test('rejects a corrupted or unrelated backup without creating a case', async () => {
  const { source, caseRecord } = await fixture();
  const packed = await bundle.create([source], caseRecord, noJournal());
  const corrupted = packed.slice();
  corrupted[100] ^= 1;
  await assert.rejects(bundle.open(corrupted));
  await assert.rejects(bundle.open(encoder.encode('not a zip')));
});

test('rejects a verification receipt whose decision is absent', async () => {
  const { source, caseRecord } = await fixture();
  await assert.rejects(bundle.create([source], caseRecord, {
    assessments: [], decisions: [], outcomes: [{ decisionId: 'missing', status: 'verified-by-owner' }]
  }), /missing its recorded decision/);
});

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { previewBenefitReversal } = require('./engine.cjs');

const fixture = () => [
  { id: 'harmed', currentCredits: 2, protectedMinimum: 1, documentedNeed: 6,
    evidence: { need: 'VERIFIED' } },
  { id: 'benefited', currentCredits: 12, protectedMinimum: 5, documentedUnfairAdvantage: 9,
    evidence: { advantage: 'VERIFIED' } }
];

test('reverses documented inequity in credits while protecting floor and conserving total', () => {
  const result = previewBenefitReversal(fixture(), { domain: 'education' });
  assert.equal(result.mode, 'DRY_RUN_ONLY');
  assert.deepEqual(result.transfers, [{ from: 'benefited', to: 'harmed', credits: 6 }]);
  assert.deepEqual(result.proposed, [
    { id: 'harmed', before: 2, proposedAfter: 8, change: 6 },
    { id: 'benefited', before: 12, proposedAfter: 6, change: -6 }
  ]);
  assert.deepEqual(result.totals, { before: 14, after: 14, redistributed: 6 });
});

test('never debits below the protected minimum', () => {
  const x = fixture(); x[1].protectedMinimum = 11;
  assert.equal(previewBenefitReversal(x).totals.redistributed, 1);
});

test('unverified allegations cause no transfers', () => {
  const x = fixture(); x[1].evidence.advantage = 'UNVERIFIED';
  const result = previewBenefitReversal(x);
  assert.equal(result.totals.redistributed, 0);
  assert.deepEqual(result.audit.unverifiedEntries, ['benefited']);
});

test('source is not mutated and the preview snapshot is independent', () => {
  const x = fixture(); const before = JSON.stringify(x);
  const result = previewBenefitReversal(x);
  result.source[0].evidence.need = 'UNVERIFIED';
  assert.equal(JSON.stringify(x), before);
});

test('opposite states with no actual redistributable advantage remain unchanged', () => {
  const x = fixture(); x[1].documentedUnfairAdvantage = 0;
  const result = previewBenefitReversal(x);
  assert.equal(result.proposed[0].proposedAfter, 2);
  assert.equal(result.proposed[1].proposedAfter, 12);
});

test('gambling and betting domains are explicitly excluded', () => {
  for (const domain of ['sportsbook', 'gambling', 'sports-betting', 'casino', 'wagering', 'lottery', 'odds']) {
    assert.throws(() => previewBenefitReversal(fixture(), { domain }), /excluded/);
  }
});

test('validates IDs, amounts, and arithmetic limits', () => {
  assert.throws(() => previewBenefitReversal([{ ...fixture()[0], currentCredits: -1 }]));
  assert.throws(() => previewBenefitReversal([fixture()[0], fixture()[0]]));
  const x = fixture(); x[0].currentCredits = Number.MAX_SAFE_INTEGER;
  assert.throws(() => previewBenefitReversal(x), /overflow/i);
});

test('allocation is deterministic independent of input record order', () => {
  const x = fixture();
  const a = previewBenefitReversal(x).transfers;
  const b = previewBenefitReversal(x.slice().reverse()).transfers;
  assert.deepEqual(a, b);
});

test('when a record has both statuses, it does not transfer to itself', () => {
  const x = [{ id: 'both', currentCredits: 10, protectedMinimum: 1,
    documentedNeed: 4, documentedUnfairAdvantage: 4,
    evidence: { need: 'VERIFIED', advantage: 'VERIFIED' } }];
  assert.deepEqual(previewBenefitReversal(x).transfers, []);
});

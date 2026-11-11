'use strict';

/**
 * NATHAN AI — BENEFIT REVERSAL: an isolated, deterministic, offline proposal engine.
 * Does not modify callers, accounts, hardware, services, or any real-world allocation.
 * No gambling/betting/casino integration.
 */
const POLICY = 'BENEFIT_REVERSAL_V1';
const MAX_RECORDS = 500;
const FORBIDDEN_DOMAINS = /(?:gambl|sportsbook|betting|wager|casino|lottery|odds)/iu;
const safeWhole = (n, name) => {
  if (!Number.isSafeInteger(n) || n < 0) throw new TypeError(`${name} must be a nonnegative safe integer`);
  return n;
};
const add = (a, b) => {
  if (!Number.isSafeInteger(a + b)) throw new RangeError('Arithmetic overflow');
  return a + b;
};

function previewBenefitReversal(rows, { domain = 'general' } = {}) {
  if (typeof domain !== 'string' || !domain.trim()) throw new TypeError('Nonempty domain required');
  if (FORBIDDEN_DOMAINS.test(domain)) throw new RangeError('Gambling and betting domains are excluded');
  if (!Array.isArray(rows) || rows.length > MAX_RECORDS) throw new TypeError(`Expected 0–${MAX_RECORDS} records`);

  const seen = new Set();
  const source = rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new TypeError('Plain record required');
    const { id, currentCredits, protectedMinimum, documentedNeed = 0, documentedUnfairAdvantage = 0, evidence = {} } = row;
    if (typeof id !== 'string' || !id.trim() || seen.has(id)) throw new TypeError('Unique, nonempty record ID required');
    seen.add(id);
    if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) throw new TypeError('Evidence object required');
    safeWhole(currentCredits, `${id}.currentCredits`);
    safeWhole(protectedMinimum, `${id}.protectedMinimum`);
    safeWhole(documentedNeed, `${id}.documentedNeed`);
    safeWhole(documentedUnfairAdvantage, `${id}.documentedUnfairAdvantage`);
    if (evidence.need != null && !['VERIFIED', 'UNVERIFIED'].includes(evidence.need)) throw new TypeError('Invalid need evidence status');
    if (evidence.advantage != null && !['VERIFIED', 'UNVERIFIED'].includes(evidence.advantage)) throw new TypeError('Invalid advantage evidence status');
    return {
      id, currentCredits, protectedMinimum, documentedNeed,
      documentedUnfairAdvantage, evidence: {
        need: evidence.need === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED',
        advantage: evidence.advantage === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED'
      }
    };
  });

  // This does not verify evidence independently; VERIFIED is a status supplied by
  // an accountable external reviewer. Unsupported claims do not trigger deductions.
  const balances = new Map(source.map(r => [r.id, r.currentCredits]));
  const donors = source.filter(r => r.evidence.advantage === 'VERIFIED')
    .map(r => ({ id: r.id, available: Math.min(r.documentedUnfairAdvantage, Math.max(0, r.currentCredits - r.protectedMinimum)) }))
    .filter(r => r.available > 0).sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const recipients = source.filter(r => r.evidence.need === 'VERIFIED' && r.documentedNeed > 0)
    .map(r => ({ id: r.id, needed: r.documentedNeed }))
    .sort((a, b) => b.needed - a.needed || a.id.localeCompare(b.id, 'en'));
  const transfers = [];
  for (const recipient of recipients) {
    for (const donor of donors) {
      if (!recipient.needed) break;
      if (!donor.available || donor.id === recipient.id) continue;
      const amount = Math.min(recipient.needed, donor.available);
      const beforeRecipient = balances.get(recipient.id);
      balances.set(recipient.id, add(beforeRecipient, amount));
      balances.set(donor.id, balances.get(donor.id) - amount);
      recipient.needed -= amount;
      donor.available -= amount;
      transfers.push({ from: donor.id, to: recipient.id, credits: amount });
    }
  }
  let totalBefore = 0, totalAfter = 0, redistributed = 0;
  const proposed = source.map(r => {
    const after = balances.get(r.id);
    totalBefore = add(totalBefore, r.currentCredits);
    totalAfter = add(totalAfter, after);
    return { id: r.id, before: r.currentCredits, proposedAfter: after, change: after - r.currentCredits };
  });
  for (const transfer of transfers) redistributed = add(redistributed, transfer.credits);
  if (totalBefore !== totalAfter) throw new Error('Conservation gate failed');
  for (const r of source) {
    if (balances.get(r.id) < Math.min(r.currentCredits, r.protectedMinimum)) throw new Error('Protected minimum gate failed');
  }
  return {
    policy: POLICY,
    mode: 'DRY_RUN_ONLY',
    domain,
    arithmetic: { build: '1+1=2', clear: '1-1=0' },
    source, // independent normalized snapshot; original caller records untouched
    proposed,
    transfers,
    totals: { before: totalBefore, after: totalAfter, redistributed },
    audit: {
      evidenceGate: 'EXTERNAL_REVIEW_REQUIRED',
      execution: 'NONE',
      accusationIsNotProof: true,
      unverifiedEntries: source.filter(r =>
        (r.documentedNeed > 0 && r.evidence.need !== 'VERIFIED') ||
        (r.documentedUnfairAdvantage > 0 && r.evidence.advantage !== 'VERIFIED'))
        .map(r => r.id),
      sourcePreserved: true,
      gamblingExcluded: true,
      humanApprovalRequiredForAnyRealWorldUse: true
    }
  };
}
module.exports = { POLICY, previewBenefitReversal };

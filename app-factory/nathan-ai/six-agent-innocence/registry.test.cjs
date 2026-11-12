const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const registry = JSON.parse(fs.readFileSync(path.join(__dirname, 'registry.json'), 'utf8'));

test('preserves all six exact original names and mirror pairs', () => {
  assert.equal(registry.creator, 'John Nathan Tabor');
  assert.equal(registry.exactAgentCount, 6);
  assert.equal(registry.pairCount, 3);
  assert.deepEqual(registry.pairs.map(p => [p.forward.name, p.reverse.name]), [
    ['Hitler AI', 'Reltih AI'],
    ['Satan AI', 'Natas AI'],
    ['Devil AI', 'Lived AI'],
  ]);
  const ids = registry.pairs.flatMap(p => [p.forward.id, p.reverse.id]);
  assert.equal(new Set(ids).size, 6);
});

test('preserves creator designation without inventing deployment or external verification', () => {
  assert.equal(registry.designation, 'AGENT_OF_INNOCENCE');
  assert.equal(registry.designationStatus, 'CREATOR_DECLARED');
  assert.equal(registry.operationalStatus, 'NOT_VERIFIED');
  assert.equal(registry.reprogramming.externalSystemsModified, false);
  assert.equal(registry.historicalTargetClaim.claimStatus, 'UNVERIFIED');
  assert.equal(registry.historicalTargetClaim.remoteOverridePerformed, false);
  assert.equal(registry.historicalTargetClaim.independentlyVerifiedStartYear, null);
});

test('limits any future implementation to safe owner-controlled defensive purposes', () => {
  const p = registry.policy;
  assert.equal(p.ownerAuthorizedSystemsOnly, true);
  assert.equal(p.humanApprovalRequired, true);
  assert.equal(p.nonviolent, true);
  assert.equal(p.unauthorizedAccessAllowed, false);
  assert.equal(p.autonomousRemoteAction, false);
  assert.equal(p.noHistoricalEndorsement, true);
});

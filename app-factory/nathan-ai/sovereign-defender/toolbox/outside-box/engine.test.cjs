'use strict';
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { test } = require('node:test');
const api = require('./engine.js');
const toolbox = require('../engine.js');

const encode = s => new TextEncoder().encode(s);
const event = (fields = {}) => ({
  asset: 'example.invalid / mailbox', observation: 'Connected-app grant changed',
  observedAt: '2026-11-18T14:00:00Z', stage: 'changed', principal: 'client-1',
  family: 'O', sourceRef: 'audit-1', ...fields
});
const telemetry = events => api.importEvidence('telemetry.json', encode(JSON.stringify({ schema: api.INPUT_SCHEMA, events })));
const edge = (fields = {}) => ({
  ClientRequestHost: 'example.invalid', RayID: 'test-ray', ClientIP: '192.0.2.9',
  ClientRequestMethod: 'GET', EdgeResponseStatus: 403, EdgeStartTimestamp: '2026-11-18T13:00:00.140200123Z', ...fields
});

test('fingerprints the exact original bytes, including whitespace and Unicode', async () => {
  const raw = '\n' + JSON.stringify({ schema: api.INPUT_SCHEMA, events: [event({ observation: 'Reviewed Æ' })] }) + '\n';
  const bytes = encode(raw);
  const digest = createHash('sha256').update(bytes).digest('hex');
  const result = await api.importEvidence('original.json', bytes);
  assert.equal(result.source.sha256, digest);
  assert.equal(result.source.bytes, bytes.length);
  assert.equal(result.events[0].id, digest + ':1');
});

test('imports valid UTC events and reconstructs a chronological case', async () => {
  const report = await telemetry([event(), event({ stage: 'accessed', observedAt: '2026-11-18T13:59:00Z' })]);
  const record = api.buildCase([report, report]);
  assert.equal(record.sources.length, 1);
  assert.equal(record.timeline[0].stage, 'accessed');
  assert.deepEqual(record.observed.assets, ['example.invalid / mailbox']);
  assert.equal(record.impact.changed, 1);
  assert.equal(record.attribution, 'Unknown');
  assert.equal(record.inferredIntent, 'Undetermined');
});

test('retains every A–Z playbook entry in order', () => {
  assert.equal(api.PLAYBOOK.map(record => record.id).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.ok(api.PLAYBOOK.every(record => record.action && record.title));
});

test('reuses Incident Ledger input without guessing its time zone', async () => {
  const exportValue = toolbox.incidentLog([{ observed: '2026-11-18T08:30', type: 'triaged', details: 'Owner reviewed logs' }]);
  const report = await api.importEvidence('legacy.json', encode(JSON.stringify(exportValue)));
  const record = api.buildCase([report]);
  assert.equal(record.timeline.length, 0);
  assert.equal(record.unzoned[0].time, '2026-11-18T08:30');
  assert.equal(record.unzoned[0].observation, 'triaged: Owner reviewed logs');
  assert.equal(record.unzoned[0].asset, '');
});

test('reads Cloudflare JSONL and distinguishes explicit block from HTTP status', async () => {
  const raw = [edge({ Cookies: { secret: 'drop-me' } }), edge({ RayID: 'another-ray', SecurityAction: 'block' })].map(x => JSON.stringify(x)).join('\n');
  const report = await api.importEvidence('edge.jsonl', encode(raw));
  assert.equal(report.source.kind, 'cloudflare');
  assert.deepEqual(report.events.map(row => row.stage), ['observed', 'blocked']);
  assert.equal(report.events[0].ingress, '192.0.2.9');
  assert.equal(report.events[0].sourceRef, 'test-ray');
  assert.equal(report.events[0].principal, '');
  assert.doesNotMatch(JSON.stringify(report), /drop-me/);
});

test('preserves sub-millisecond ordering from edge timestamps', async () => {
  const report = await telemetry([
    event({ observedAt: '2026-11-18T14:00:00.000000007Z', sourceRef: 'later' }),
    event({ observedAt: '2026-11-18T14:00:00.000000002Z', sourceRef: 'earlier' })
  ]);
  assert.deepEqual(api.buildCase([report]).timeline.map(row => row.sourceRef), ['earlier', 'later']);
});

test('accepts a single JSON object and a JSON array of Cloudflare HTTP records', async () => {
  for (const data of [edge(), [edge()]]) {
    const report = await api.importEvidence('edge.json', encode(JSON.stringify(data)));
    assert.equal(report.events.length, 1);
  }
});

test('rejects invalid UTC dates, oversize inputs, malformed rows and bad UTF-8', async () => {
  await assert.rejects(telemetry([event({ observedAt: '2026-02-31T00:00:00Z' })]), /invalid/);
  await assert.rejects(api.importEvidence('invalid.json', new Uint8Array(api.MAX_BYTES + 1)), /2 MiB/);
  await assert.rejects(api.importEvidence('edge.jsonl', encode(JSON.stringify(edge()) + '\nnot json')), /Cloudflare row 2/);
  await assert.rejects(api.importEvidence('bad.json', new Uint8Array([255])));
  await assert.rejects(telemetry([event({ stage: 'hacked' })]), /impact stage/);
});

test('limits record count before creating a case', async () => {
  await assert.rejects(telemetry(Array.from({ length: 1001 }, () => event())), /1000/);
  assert.throws(() => api.buildCase(new Array(11).fill(null)), /source limit/);
});

test('requires scope, identified evidence, and an allowlisted owner decision', async () => {
  const record = api.buildCase([await telemetry([event()])]);
  const evidenceId = record.timeline[0].id;
  const input = { action: 'revoke', ownerConfirmed: true, evidenceId, reason: 'Review OAuth access', asset: 'unrelated' };
  assert.throws(() => api.recordDecision(record, { ...input, ownerConfirmed: false }), /authorized/);
  assert.throws(() => api.recordDecision(record, { ...input, action: 'external' }), /supported response/);
  assert.throws(() => api.recordDecision(record, { ...input, evidenceId: 'unknown' }), /event/);
  const result = api.recordDecision(record, input);
  assert.equal(result.target, 'example.invalid / mailbox');
  assert.equal(result.status, 'owner-selected');
  assert.match(result.check, /management console/);
});

test('keeps intent assessment distinct from observation and attribution', async () => {
  const record = api.buildCase([await telemetry([event()])]);
  const assessment = api.recordReview(record, {
    evidenceId: record.timeline[0].id, family: 'O', confidence: 'possible', reason: 'Grant changed'
  });
  assert.equal(assessment.source, 'owner assessment');
  assert.equal(assessment.confidence, 'possible');
  assert.equal(record.attribution, 'Unknown');
  assert.equal(record.inferredIntent, 'Undetermined');
});

test('a verification receipt requires a recorded result and evidence', async () => {
  const record = api.buildCase([await telemetry([event()])]);
  const decision = api.recordDecision(record, {
    evidenceId: record.timeline[0].id, action: 'revoke', ownerConfirmed: true, reason: 'Grant changed'
  });
  assert.throws(() => api.recordOutcome(decision, { status: 'verified-by-owner' }), /required/);
  const outcome = api.recordOutcome(decision, { status: 'verified-by-owner', evidence: 'Audit record 22' });
  assert.equal(outcome.decisionId, decision.id);
  assert.equal(outcome.status, 'verified-by-owner');
  assert.equal(decision.status, 'owner-selected');
});

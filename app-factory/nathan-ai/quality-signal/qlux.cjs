'use strict';
/**
 * NATHAN AI Q_lux — deterministic, offline node-health scorer.
 * Only caller-supplied telemetry is assessed. No network discovery, code execution,
 * autonomous enrollment, replication, or remote control is implemented.
 */
const MAX_BATCH = 10000;
const MAX_PRIMARY = 1000;
const METRIC_RANGES = Object.freeze({
  availabilityPpm: 1000000,
  throughputRps: 100000,
  p95LatencyMs: 10000,
  packetLossPpm: 1000000,
});
const GATES = Object.freeze(['authorized','attested','integrityPass','reachable']);

function isIntBetween(value, max) {
  return Number.isSafeInteger(value) && value >= 0 && value <= max;
}
function validate(node) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) throw new TypeError('Telemetry must be a node object');
  if (typeof node.id !== 'string' || !/^[a-zA-Z0-9._:-]{1,128}$/.test(node.id)) throw new TypeError('Node ID must be a bounded opaque identifier');
  for (const gate of GATES) if (node[gate] !== 0 && node[gate] !== 1) throw new TypeError(gate + ' requires whole-state 0 or 1');
  for (const [name, max] of Object.entries(METRIC_RANGES)) {
    if (!isIntBetween(node[name], max)) throw new RangeError(name + ' must be an integer between 0 and ' + max);
  }
  return node;
}
function scoreNode(sample) {
  const node = validate(sample);
  for (const gate of GATES) {
    if (node[gate] !== 1) return Object.freeze({id: node.id, eligible: false, score: null, reason: gate + '=0'});
  }
  const score =
    Math.floor(node.availabilityPpm * 300 / 1000000) +
    Math.floor(node.throughputRps * 300 / 100000) +
    Math.floor(Math.max(0, 2000 - node.p95LatencyMs) * 200 / 2000) +
    Math.floor((1000000 - node.packetLossPpm) * 200 / 1000000);
  return Object.freeze({id: node.id, eligible: true, score, reason: 'authorized-health-pass'});
}
function selectPrimaries(samples, limit=3) {
  if (!Array.isArray(samples) || samples.length > MAX_BATCH) throw new RangeError('Provide an array of up to 10,000 authorized telemetry samples');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PRIMARY) throw new RangeError('Primary limit must be an integer from 1 to 1000');
  const seen = new Set();
  const scored = samples.map(sample => {
    const assessment = scoreNode(sample);
    if (seen.has(assessment.id)) throw new Error('Duplicate telemetry node identifier');
    seen.add(assessment.id);
    return assessment;
  });
  const eligible = scored.filter(x => x.eligible).sort((a,b) => b.score-a.score || a.id.localeCompare(b.id,'en'));
  return Object.freeze({
    evaluated: scored.length,
    eligibleCount: eligible.length,
    rejectedCount: scored.length - eligible.length,
    selected: Object.freeze(eligible.slice(0,limit)),
    mode: 'read-only-offline-assessment',
  });
}
module.exports = Object.freeze({scoreNode,selectPrimaries});

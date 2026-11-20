import assert from 'node:assert/strict';
import { test } from 'node:test';
import { attest, candidateBytes, evaluate, selfTest } from './policy.mjs';
import { releaseGate } from './http.mjs';

const secret = 'test-only signing key '.repeat(3);
const sample = {id: 'fixture', producer: 'llm', kind: 'fact', action: 'publish', destination: 'tabor-academy', encoding: 'utf8', payload: 'Café'};
const good = {protectsInnocence: true, honest: true, authorized: true, sources: ['a'.repeat(64)]};
const now = 1_798_000_000_000;

test('honesty, innocence and authorization must all pass; facts require reviewed evidence', async () => {
  for (const [field, reason] of [['protectsInnocence', 'innocence_check_failed'], ['honest', 'honesty_check_failed'], ['authorized', 'authorization_check_failed']]) {
    assert.equal((await attest(sample, { ...good, [field]: false }, secret, now)).reason, reason);
  }
  assert.equal((await attest(sample, { ...good, sources: [] }, secret, now)).reason, 'missing_evidence');
  assert.equal((await attest(sample, { ...good, sources: ['source without digest'] }, secret, now)).reason, 'invalid_evidence');
  assert.equal((await attest(sample, null, secret, now)).reason, 'missing_review');
});

test('a permit binds exact bytes, metadata, release action, and destination', async () => {
  const approval = await attest(sample, good, secret, now);
  const pass = await evaluate(sample, approval.permit, secret, now);
  assert.equal(pass.bit, 1);
  assert.equal(pass.digest, approval.digest);
  assert.equal(pass.sources[0], good.sources[0]);
  for (const change of [{payload: 'Cafe'}, {producer: 'algorithm'}, {destination: 'another-place'}, {id: 'other'},
    {kind: 'quotation'}, {action: 'index'}]) {
    const fail = await evaluate({ ...sample, ...change }, approval.permit, secret, now);
    assert.equal(fail.reason, 'permit_scope_mismatch');
    assert.equal(fail.bit, 0);
    assert.equal(Object.hasOwn(fail, 'payload'), false);
  }
  assert.equal((await evaluate(sample, approval.permit, secret, approval.expiresAt)).reason, 'permit_expired');
  assert.equal((await evaluate(sample, approval.permit, secret + 'different', now)).reason, 'invalid_signature');
  assert.equal((await evaluate(sample, undefined, secret, now)).reason, 'missing_or_invalid_permit');
});

test('binary, algorithm, LLM and non-data labels use the same bit gate', async () => {
  const cases = [
    {producer: 'binary', kind: 'artifact', encoding: 'base64', payload: 'AAE='},
    {producer: 'algorithm', kind: 'artifact', payload: '42'},
    {producer: 'llm', kind: 'authored', payload: 'Fiction'},
    {kind: 'unknown', encoding: 'none', payload: null},
    {kind: 'counterfactual', encoding: 'none', payload: null},
    {kind: 'absence', encoding: 'none', payload: null}
  ];
  for (const fields of cases) {
    const candidate = { ...sample, ...fields };
    const approval = await attest(candidate, good, secret, now);
    assert.equal((await evaluate(candidate, approval.permit, secret, now)).bit, 1);
  }
  assert.deepEqual(candidateBytes({ ...sample, encoding: 'base64', payload: 'AAE=' }), new Uint8Array([0, 1]));
  assert.equal(candidateBytes({ ...sample, encoding: 'base64', payload: 'AAF=' }), null);
  assert.equal(candidateBytes({ ...sample, payload: '', kind: 'unknown' }), null);
  assert.equal(candidateBytes({ ...sample, action: 'execute' }), null);
  assert.equal(candidateBytes({ ...sample, hidden: 'unreviewed value' }), null);
  assert.equal(candidateBytes({ ...sample, payload: '\ud800' }), null);
  assert.equal(await selfTest(), true);
});

test('HTTP only accepts certificates from an authenticated reviewer and never echoes rejected payloads', async () => {
  const context = {
    json: (data, status) => Response.json(data, {status}),
    limitedBody: async (req, size) => {
      const bytes = new Uint8Array(await req.arrayBuffer());
      if (bytes.length > size) throw new RangeError('too large');
      return bytes;
    },
    operator: req => req.headers.get('x-fixture-reviewer') === 'authorized'
  };
  const env = { LASSO_GATE_SIGNING_KEY: secret };
  const issue = '/cheironomer/operator/release-gate/attest';
  const check = '/api/release-gate/evaluate';
  const req = (path, body, reviewer) => new Request('https://example.test' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...reviewer && {'x-fixture-reviewer': 'authorized'} },
    body: JSON.stringify(body)
  });
  assert.equal(await releaseGate(new Request('https://example.test/other'), env, '/other', context), null);
  assert.equal((await releaseGate(req(issue, {candidate: sample, review: good}), env, issue, context)).status, 401);
  const response = await releaseGate(req(issue, {candidate: sample, review: good}, true), env, issue, context);
  assert.equal(response.status, 201);
  const proof = await response.json();
  const pass = await releaseGate(req(check, {candidate: sample, permit: proof.permit}), env, check, context);
  assert.equal(pass.status, 200);
  assert.equal((await pass.json()).bit, 1);
  const failed = await releaseGate(req(check, {candidate: { ...sample, payload: 'hidden' }, permit: proof.permit}), env, check, context);
  assert.equal(failed.status, 422);
  assert.equal((await failed.text()).includes('hidden'), false);
  const big = await releaseGate(req(check, {candidate: { ...sample, payload: 'x'.repeat(70_000) }}), env, check, context);
  assert.equal(big.status, 413);
  assert.equal((await releaseGate(req(check, {candidate: sample, permit: proof.permit}), {}, check, context)).status, 503);
});

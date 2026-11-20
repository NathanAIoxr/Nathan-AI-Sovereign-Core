import { attest, discard, evaluate, policyVersion, selfTest } from './policy.mjs';

const healthPath = '/api/release-gate/health';
const evaluatePath = '/api/release-gate/evaluate';
const attestPath = '/cheironomer/operator/release-gate/attest';
const maxBytes = 64 * 1024;

export async function releaseGate(request, env, path, { json, limitedBody, operator }) {
  if (![healthPath, evaluatePath, attestPath].includes(path)) return null;
  const configured = typeof env.LASSO_GATE_SIGNING_KEY === 'string' && env.LASSO_GATE_SIGNING_KEY.length >= 32;
  if (path === healthPath) {
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);
    const ready = configured && await selfTest();
    return json({ policy: policyVersion, ready, release: env.LASSO_GATE_RELEASE ?? 'local' }, ready ? 200 : 503);
  }
  if (request.method !== 'POST') return json(discard('method_not_allowed'), 405);
  if (path === attestPath && !await operator(request, env)) return json(discard('operator_required'), 401);
  if (!configured) return json(discard('gate_unavailable'), 503);
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return json(discard('expected_json'), 415);
  }
  let input;
  try {
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await limitedBody(request, maxBytes)));
  } catch (error) {
    return error instanceof RangeError ? json(discard('request_too_large'), 413) : json(discard('invalid_json'), 400);
  }
  try {
    if (path === attestPath) {
      const result = await attest(input?.candidate, input?.review, env.LASSO_GATE_SIGNING_KEY);
      return json(result, result.bit === 0 ? 422 : 201);
    }
    const result = await evaluate(input?.candidate, input?.permit, env.LASSO_GATE_SIGNING_KEY);
    return json(result, result.bit === 1 ? 200 : 422);
  } catch {
    return json(discard('gate_unavailable'), 503);
  }
}

import { render } from './page.mjs';

const mount = '/tabor-sites/groundskeeper-ai';
const conductor = 'nathan-ai-conductor';
const sourceRoot = 'https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/';
const sourcePaths = {
  conductor: 'conductor/api/health', lasso: 'conductor/api/release-gate/health', time: 'conductor/api/time',
  'sovereign-minds': 'sovereign-minds/healthz', zero: 'mind-zero/healthz', one: 'mind-one/healthz'
};
const subject = 'Collyn Phillips Tabor';
const sha = /^[a-f0-9]{40}$/;
const digest = /^[a-f0-9]{64}$/;
const domains = ['Infrastructure', 'Hardware', 'Software', 'Networks', 'System architecture', 'Communication', 'Data',
  'Security', 'Redundancy', 'Continuity'];
const checks = [
  ['conductor', 'Master Conductor', conductor, '/api/health', 'service', 'nathan-ai-conductor'],
  ['lasso', 'Lasso of Truth', conductor, '/api/release-gate/health', 'policy', 'lasso-release-v1'],
  ['sovereign-minds', 'Sovereign MINDs', 'nathan-ai-sovereign-minds', '/healthz', 'service', 'sovereign-minds'],
  ['zero', 'Zero MIND', 'nathan-ai-mind-zero', '/healthz', 'mindId', 'zero'],
  ['one', 'One MIND', 'nathan-ai-mind-one', '/healthz', 'mindId', 'one']
];
const headers = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};

function json(value, status = 200, extra = {}) {
  return Response.json(value, {status, headers: {...headers, ...extra}});
}

async function readJson(message, limit = 32_768, capture = false) {
  const reader = message.body?.getReader();
  if (!reader) throw new SyntaxError('missing body');
  const bytes = new Uint8Array(limit);
  let size = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) {
        const raw = bytes.subarray(0, size);
        const value = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(raw));
        if (!capture) return value;
        const hash = await crypto.subtle.digest('SHA-256', raw);
        return {value, sourceDigest: Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')};
      }
      if (size + value.length > limit) {
        await reader.cancel();
        throw new RangeError('body too large');
      }
      bytes.set(value, size);
      size += value.length;
    }
  } finally {
    reader.releaseLock();
  }
}

function dispatch(env, name, path, init = {}) {
  return env.PLATFORM.get(name, {}, {limits: {cpuMs: 60, subRequests: 15}}).fetch(new Request('https://internal' + path, {
    ...init, redirect: 'manual', signal: AbortSignal.timeout(4500)
  }));
}

async function inspect(env, [id, label, target, path, field, expected]) {
  try {
    const response = await dispatch(env, target, path);
    const {value: reply, sourceDigest} = await readJson(response, 8192, true);
    const evidence = reply?.[field] === expected && sha.test(reply?.release ?? '');
    return {id, label, state: response.ok && reply?.ready === true && evidence ? 'ready' : 'unverified',
      http: response.status, release: evidence ? reply.release : null, source: sourceRoot + sourcePaths[id], sourceDigest};
  } catch {
    return {id, label, state: 'unreachable', http: null, release: null, source: sourceRoot + sourcePaths[id], sourceDigest: null};
  }
}

async function continuity(env, now) {
  const source = sourceRoot + sourcePaths.time;
  try {
    const response = await dispatch(env, conductor, '/api/time');
    const {value: data, sourceDigest} = await readJson(response, 8192, true);
    const last = Number.isSafeInteger(data?.last) ? data.last : Date.parse(data?.last ?? '');
    const {next, passed, total} = data ?? {};
    if (!response.ok || !Number.isSafeInteger(passed) || !Number.isSafeInteger(total) || passed < 0 || passed > total || total < 1) {
      return {state: 'unverified', last: null, next: null, passed: null, total: null, source, sourceDigest};
    }
    const expected = Number.isSafeInteger(next) && next > now;
    const recent = Number.isSafeInteger(last) && last <= now && now - last <= 30 * 60_000;
    return {state: recent && expected ? (passed === total ? 'current' : 'degraded') : 'unverified',
      last: Number.isSafeInteger(last) ? last : null, next: Number.isSafeInteger(next) ? next : null, passed, total, source, sourceDigest};
  } catch {
    return {state: 'unreachable', last: null, next: null, passed: null, total: null, source, sourceDigest: null};
  }
}

async function snapshot(env, now = Date.now()) {
  const [services, time] = await Promise.all([Promise.all(checks.map(spec => inspect(env, spec))), continuity(env, now)]);
  return {schema: 'nathan-ai.groundskeeper.snapshot.v1', project: 'groundskeeper-ai', observedAt: new Date(now).toISOString(),
    release: env.RELEASE_SHA ?? null, services, continuity: time};
}

function stage(report) {
  return {id: 'groundskeeper-' + Date.parse(report.observedAt), producer: 'algorithm', kind: 'fact', action: 'publish',
    destination: 'groundskeeper-ai', encoding: 'utf8', payload: JSON.stringify(report)};
}

function isStage(candidate, currentRelease) {
  if (!candidate || Object.keys(candidate).length !== 7 || !/^groundskeeper-\d{13}$/.test(candidate.id) ||
      candidate.producer !== 'algorithm' || candidate.kind !== 'fact' || candidate.action !== 'publish' ||
      candidate.destination !== 'groundskeeper-ai' || candidate.encoding !== 'utf8' ||
      typeof candidate.payload !== 'string' || candidate.payload.length > 8192) return null;
  try {
    const report = JSON.parse(candidate.payload);
    if (report.schema !== 'nathan-ai.groundskeeper.snapshot.v1' || report.project !== 'groundskeeper-ai' ||
        report.release !== currentRelease || stage(report).id !== candidate.id) return null;
    return report;
  } catch {
    return null;
  }
}

function denied(reason, status, value = null) {
  return json({bit: 0, decision: 'discard', reason, digest: value}, status);
}

async function release(request, env) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return denied('expected_json', 415);
  let input;
  try {
    input = await readJson(request);
  } catch (error) {
    return error instanceof RangeError ? denied('request_too_large', 413) : denied('invalid_json', 400);
  }
  const candidate = input?.candidate;
  if (!isStage(candidate, env.RELEASE_SHA)) return denied('invalid_candidate', 422);
  if (typeof input.permit !== 'string' || !input.permit.length || input.permit.length > 1400) return denied('missing_or_invalid_permit', 422);
  try {
    const response = await dispatch(env, conductor, '/api/release-gate/evaluate', {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({candidate, permit: input.permit})
    });
    const receipt = await readJson(response, 8192);
    if (response.status === 422 && receipt?.bit === 0) {
      return denied(typeof receipt.reason === 'string' && /^[a-z_]{1,64}$/.test(receipt.reason) ? receipt.reason : 'gate_rejected',
        422, digest.test(receipt.digest ?? '') ? receipt.digest : null);
    }
    if (response.status !== 200 || receipt?.bit !== 1 || receipt.decision !== 'release' ||
        receipt.id !== candidate.id || receipt.kind !== candidate.kind || receipt.producer !== candidate.producer ||
        receipt.action !== candidate.action || receipt.destination !== candidate.destination ||
        !digest.test(receipt.digest ?? '') || !Number.isSafeInteger(receipt.expiresAt) ||
        receipt.expiresAt <= Date.now() || !Array.isArray(receipt.sources) || !receipt.sources.length ||
        !receipt.sources.every(value => digest.test(value))) return denied('gate_unavailable', 503);
    return new Response(candidate.payload, {headers: {...headers, 'Content-Type': 'application/json; charset=utf-8',
      'X-Lasso-Release-Bit': '1', 'X-Lasso-Release-Digest': receipt.digest}});
  } catch {
    return denied('gate_unavailable', 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname === mount ? '/' :
      url.pathname.startsWith(mount + '/') ? url.pathname.slice(mount.length) : null;
    if (path === null || !['/', '/api/health', '/api/status', '/api/stage', '/api/release'].includes(path)) return json({error: 'not_found'}, 404);
    const allowed = path === '/api/release' ? 'POST' : 'GET';
    if (request.method !== allowed) return json({error: 'method_not_allowed'}, 405, {Allow: allowed});
    if (path === '/api/release') return release(request, env);
    if (path === '/api/health') {
      const ready = Boolean(env.PLATFORM) && sha.test(env.RELEASE_SHA ?? '');
      return json({service: 'groundskeeper-ai', ready, release: env.RELEASE_SHA ?? null}, ready ? 200 : 503);
    }
    const report = await snapshot(env);
    if (path === '/api/status') return json(report);
    if (path === '/api/stage') return json({state: 'awaiting_attestation', candidate: stage(report)});
    const markup = render({mount, subject, domains, report});
    return new Response(markup, {headers: {...headers, 'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"}});
  }
};

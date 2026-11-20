export const policyVersion = 'lasso-release-v1';
const encode = new TextEncoder();
const digestPattern = /^[0-9a-f]{64}$/;
const identifier = /^[a-z0-9][a-z0-9_.-]{0,95}$/;
const producers = ['binary', 'algorithm', 'llm', 'human', 'import'];
const actions = ['index', 'publish', 'deliver'];
const kinds = ['artifact', 'fact', 'quotation', 'authored', 'interpretation', 'unknown', 'counterfactual', 'absence'];
const markers = ['unknown', 'counterfactual', 'absence'];
const proofRequired = ['fact', 'quotation', 'absence'];
const ttl = 15 * 60 * 1000;

function exact(value, names) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name));
}

const base64 = bytes => btoa(String.fromCharCode(...bytes));
const url64 = bytes => base64(bytes).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
const unbase64 = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
const unurl64 = value => unbase64(value.replaceAll('-', '+').replaceAll('_', '/'));

export function candidateBytes(candidate) {
  if (!exact(candidate, ['id', 'producer', 'kind', 'action', 'destination', 'encoding', 'payload']) ||
      typeof candidate.id !== 'string' || !identifier.test(candidate.id) || !producers.includes(candidate.producer) ||
      !kinds.includes(candidate.kind) || !actions.includes(candidate.action) ||
      typeof candidate.destination !== 'string' || !identifier.test(candidate.destination)) return null;
  const { id, kind, encoding, payload } = candidate;
  if (markers.includes(kind)) {
    return encoding === 'none' && payload === null ? encode.encode(JSON.stringify({ id, kind })) : null;
  }
  if (typeof payload !== 'string' || !payload.length || payload.length > 32_768) return null;
  if (encoding === 'utf8') {
    const bytes = encode.encode(payload);
    return bytes.length <= 24_576 && new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes) === payload ? bytes : null;
  }
  if (encoding !== 'base64' || payload.length % 4 !== 0 || !/^[\w+/]*={0,2}$/.test(payload)) return null;
  try {
    const bytes = unbase64(payload);
    return bytes.length <= 24_576 && base64(bytes) === payload ? bytes : null;
  } catch {
    return null;
  }
}

function candidateEnvelope(candidate, bytes) {
  const { id, producer, kind, action, destination, encoding } = candidate;
  return JSON.stringify([policyVersion, id, producer, kind, action, destination, encoding, base64(bytes)]);
}

async function sha256(value) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encode.encode(value))),
    byte => byte.toString(16).padStart(2, '0')).join('');
}

async function key(secret) {
  return crypto.subtle.importKey('raw', encode.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function reviewFailure(kind, review) {
  if (!exact(review, ['protectsInnocence', 'honest', 'authorized', 'sources'])) return 'missing_review';
  if (review.protectsInnocence !== true) return 'innocence_check_failed';
  if (review.honest !== true) return 'honesty_check_failed';
  if (review.authorized !== true) return 'authorization_check_failed';
  if (!Array.isArray(review.sources) || review.sources.length > 8 ||
      !review.sources.every(digest => typeof digest === 'string' && digestPattern.test(digest)) ||
      new Set(review.sources).size !== review.sources.length) return 'invalid_evidence';
  return proofRequired.includes(kind) && !review.sources.length ? 'missing_evidence' : null;
}

export function discard(reason, digest = null) {
  return { policy: policyVersion, bit: 0, decision: 'discard', reason, digest };
}

export async function attest(candidate, review, secret, now = Date.now()) {
  const bytes = candidateBytes(candidate);
  if (!bytes) return discard('invalid_candidate');
  const digest = await sha256(candidateEnvelope(candidate, bytes));
  const failure = reviewFailure(candidate.kind, review);
  if (failure) return discard(failure, digest);
  const expiresAt = now + ttl;
  const envelope = url64(encode.encode(JSON.stringify([policyVersion, digest, expiresAt, review.sources])));
  const mac = await crypto.subtle.sign('HMAC', await key(secret), encode.encode(envelope));
  return { policy: policyVersion, digest, expiresAt, permit: envelope + '.' + url64(new Uint8Array(mac)) };
}

export async function evaluate(candidate, permit, secret, now = Date.now()) {
  const bytes = candidateBytes(candidate);
  if (!bytes) return discard('invalid_candidate');
  const digest = await sha256(candidateEnvelope(candidate, bytes));
  if (typeof permit !== 'string' || permit.length > 1_400 || !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]{43}$/.test(permit)) {
    return discard('missing_or_invalid_permit', digest);
  }
  const [envelope, signature] = permit.split('.');
  const verified = await crypto.subtle.verify('HMAC', await key(secret), unurl64(signature), encode.encode(envelope));
  if (!verified) return discard('invalid_signature', digest);
  const [policy, approvedDigest, expiresAt, sources] = JSON.parse(new TextDecoder().decode(unurl64(envelope)));
  if (policy !== policyVersion || digest !== approvedDigest) return discard('permit_scope_mismatch', digest);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + ttl) return discard('permit_expired', digest);
  return { policy: policyVersion, bit: 1, decision: 'release', digest, id: candidate.id, kind: candidate.kind,
    producer: candidate.producer, action: candidate.action, destination: candidate.destination, expiresAt, sources };
}

export async function selfTest() {
  const secret = 'no authority: health fixture only';
  const candidate = { id: 'health-fixture', producer: 'binary', kind: 'artifact', action: 'index', destination: 'fixture', encoding: 'base64', payload: 'AAE=' };
  const review = { protectsInnocence: true, honest: true, authorized: true, sources: [] };
  const proof = await attest(candidate, review, secret);
  const [accept, altered, unsafe] = await Promise.all([
    evaluate(candidate, proof.permit, secret),
    evaluate({ ...candidate, payload: 'AQE=' }, proof.permit, secret),
    attest(candidate, { ...review, protectsInnocence: false }, secret),
  ]);
  return accept.bit === 1 && altered.bit === 0 && unsafe.bit === 0;
}

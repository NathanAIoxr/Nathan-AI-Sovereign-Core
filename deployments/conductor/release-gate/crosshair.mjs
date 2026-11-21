import { link, mkdtemp, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { candidateBytes, candidateDigest, discard, policyVersion } from './policy.mjs';

const endpoint = 'https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/release-gate/evaluate';
const decode = new TextDecoder('utf-8', { fatal: true });
const maxInput = 64 * 1024;
const maxReceipt = 4 * 1024;
const permitLifetime = 15 * 60 * 1000;
const fileName = /^[a-z0-9][a-z0-9_-]{0,95}\.(?:txt|json|bin)$/i;
const reservedName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])\./i;
const controls = /[\u0000-\u0008\u000b-\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
const blockedBinaryPrefixes = [
  '7f454c46', '4d5a', 'feedface', 'feedfacf', 'cefaedfe', 'cffaedfe', 'cafebabe', 'bebafeca',
  'cafebabf', 'bfbafeca', '2321', '0061736d', '504b0304', '504b0506', '504b0708', '1f8b',
  '377abcaf271c', '526172211a07', '425a68', 'fd377a585a00',
];
const lines = [
  'bounded_input', 'request_shape', 'canonical_candidate', 'destination_scope',
  'output_type', 'content_profile', 'gate_decision', 'receipt_scope',
  'receipt_integrity', 'permit_freshness', 'private_staging', 'atomic_create',
];

function receipt(result, stop = lines.length) {
  const checks = lines.map((line, index) => ({
    line,
    status: index < stop ? 'pass' : index === stop ? 'block' : 'skipped',
  }));
  return { ...result, protection: 'tabor-12-line-v1', checks };
}

function block(line, reason = line) {
  return receipt(discard(reason), lines.indexOf(line));
}

async function readBounded(source, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of source) {
    size += chunk.length;
    if (size > limit) throw new RangeError('byte limit');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

function permitsContent(bytes, extension) {
  if (!bytes.length) return false;
  if (extension === '.bin') {
    const view = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const prefix = view.subarray(0, 8).toString('hex');
    return !blockedBinaryPrefixes.some(signature => prefix.startsWith(signature)) &&
      view.subarray(257, 262).toString('ascii') !== 'ustar';
  }
  try {
    const text = decode.decode(bytes);
    if (controls.test(text)) return false;
    if (extension === '.json') JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

export async function protectRelease(output, intendedId, input, { request = fetch, clock = Date.now } = {}) {
  let raw;
  try {
    raw = await readBounded(input, maxInput);
  } catch {
    return block('bounded_input', 'request_unreadable_or_too_large');
  }

  let staged;
  try {
    staged = JSON.parse(decode.decode(raw));
  } catch {
    return block('request_shape', 'invalid_json');
  }
  if (!staged || typeof staged !== 'object' || Object.keys(staged).length !== 2 ||
      !Object.hasOwn(staged, 'candidate') || typeof staged.permit !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,1356}\.[a-zA-Z0-9_-]{43}$/.test(staged.permit)) {
    return block('request_shape', 'invalid_staged_request');
  }
  const { candidate } = staged;
  const bytes = candidateBytes(candidate);
  if (!bytes) return block('canonical_candidate', 'invalid_candidate');
  if (!intendedId || candidate.destination !== intendedId) {
    return block('destination_scope', 'destination_mismatch');
  }
  const name = basename(output || '');
  if (!fileName.test(name) || reservedName.test(name)) return block('output_type', 'disallowed_output_name');
  if (!permitsContent(bytes, extname(name).toLowerCase())) {
    return block('content_profile', 'disallowed_output_content');
  }

  let decision;
  try {
    const response = await request(endpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(staged),
    });
    if (!response.ok) return block('gate_decision', response.status === 422 ? 'release_rejected' : 'gate_unavailable');
    if (response.status !== 200) return block('gate_decision', 'unexpected_gate_status');
    decision = JSON.parse(decode.decode(await readBounded(response.body, maxReceipt)));
  } catch {
    return block('gate_decision', 'gate_unavailable');
  }
  if (decision?.bit !== 1 || decision.decision !== 'release') return block('gate_decision', 'release_rejected');
  const { id, kind, producer, action, destination } = candidate;
  if (decision.policy !== policyVersion || decision.id !== id || decision.kind !== kind ||
      decision.producer !== producer || decision.action !== action || decision.destination !== destination) {
    return block('receipt_scope', 'receipt_scope_mismatch');
  }
  const digest = await candidateDigest(candidate, bytes);
  if (decision.digest !== digest) return block('receipt_integrity', 'receipt_digest_mismatch');
  const { expiresAt } = decision;
  const now = clock();
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + permitLifetime) {
    return block('permit_freshness', 'receipt_expired_or_invalid');
  }

  let staging;
  try {
    const parent = await realpath(dirname(resolve(output)));
    const folder = await stat(parent);
    if (typeof process.getuid !== 'function' || !folder.isDirectory() ||
        folder.uid !== process.getuid() || (folder.mode & 0o022) !== 0) {
      return block('private_staging', 'output_directory_not_owner_controlled');
    }
    staging = await mkdtemp(join(parent, '.lasso-release-'));
    const temporary = join(staging, 'payload');
    await writeFile(temporary, bytes, { flag: 'wx', mode: 0o600 });
    if (expiresAt <= clock()) return block('permit_freshness', 'receipt_expired_before_commit');
    try {
      await link(temporary, join(parent, name));
    } catch (error) {
      return block('atomic_create', error.code === 'EEXIST' ? 'output_exists' : 'release_io_failed');
    }
  } catch {
    return block('private_staging', 'release_staging_failed');
  } finally {
    if (staging) await rm(staging, { recursive: true, force: true }).catch(() => {});
  }

  return receipt({ policy: policyVersion, bit: 1, decision: 'release', digest, id, kind, producer,
    action, destination, expiresAt });
}

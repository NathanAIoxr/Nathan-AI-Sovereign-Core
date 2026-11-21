import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { protectRelease } from './crosshair.mjs';
import { attest, evaluate } from './policy.mjs';

const now = 1_798_000_000_000;
const key = 'fixture key with no authority outside this test';
const review = { protectsInnocence: true, honest: true, authorized: true, sources: [] };
const sample = { id: 'example', producer: 'human', kind: 'artifact', action: 'deliver',
  destination: 'academy', encoding: 'utf8', payload: '{"label":"Café"}' };
const approval = async (candidate = sample) => ({ candidate,
  permit: (await attest(candidate, review, key, now)).permit });
const bytes = body => [Buffer.from(JSON.stringify(body))];
const expected = async (url, options) => {
  assert.equal(new URL(url).protocol, 'https:');
  assert.equal(options.redirect, 'error');
  const { candidate, permit } = JSON.parse(options.body);
  const result = await evaluate(candidate, permit, key, now);
  return Response.json(result, { status: result.bit === 1 ? 200 : 422 });
};

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'tabor-release-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const output = join(dir, 'approved.json');
  const run = (input, { path = output, destination = 'academy', request = expected, clock = () => now } = {}) =>
    protectRelease(path, destination, input, { request, clock });
  return { dir, output, run };
}

test('all twelve checks pass for exact authorized bytes and create a private file', async t => {
  const { dir, output, run } = await fixture(t);
  const result = await run(bytes(await approval()));
  assert.equal(result.bit, 1);
  assert.equal(result.checks.length, 12);
  assert.ok(result.checks.every(line => line.status === 'pass'));
  assert.equal(await readFile(output, 'utf8'), sample.payload);
  assert.equal((await stat(output)).mode & 0o777, 0o600);
  assert.deepEqual(await readdir(dir), ['approved.json']);
  assert.equal(Object.hasOwn(result, 'permit'), false);
  assert.equal(Object.hasOwn(result, 'payload'), false);
});

test('malformed requests and disallowed output stop before contacting the gate', async t => {
  const { dir, run } = await fixture(t);
  const staged = await approval();
  const request = () => assert.fail('gate should not be called');
  const invalidJson = await approval({ ...sample, payload: 'not JSON' });
  const activeFormat = await approval({ ...sample, encoding: 'base64', payload: 'AGFzbQ==' });
  const cases = [
    [[Buffer.alloc(65_537)], {}, 'bounded_input'],
    [[Buffer.from('{')], {}, 'request_shape'],
    [bytes({ ...staged, debug: true }), {}, 'request_shape'],
    [bytes({ ...staged, candidate: { ...sample, encoding: 'unknown' } }), {}, 'canonical_candidate'],
    [bytes(staged), { destination: 'vault' }, 'destination_scope'],
    [bytes(staged), { path: join(dir, 'approved.mjs') }, 'output_type'],
    [bytes(invalidJson), {}, 'content_profile'],
    [bytes(activeFormat), { path: join(dir, 'approved.bin') }, 'content_profile'],
  ];
  let attempts = 0;
  for (const [input, options, line] of cases) {
    const result = await run(input, { ...options, request: () => { attempts++; return request(); } });
    assert.equal(result.bit, 0);
    assert.equal(result.checks.find(x => x.status === 'block')?.line, line);
  }
  assert.equal(attempts, 0);
  assert.deepEqual(await readdir(dir), []);
});

test('permit tampering, unavailable authority and mismatched receipts create no output', async t => {
  const { dir, run } = await fixture(t);
  const staged = await approval();
  const valid = await evaluate(sample, staged.permit, key, now);
  const changed = { ...staged, candidate: { ...sample, payload: '{"label":"changed"}' } };
  assert.equal((await run(bytes(changed))).reason, 'release_rejected');

  const cases = [
    [() => { throw Error('private internal error'); }, 'gate_unavailable'],
    [() => new Response('x'.repeat(4097)), 'gate_unavailable'],
    [() => Response.json(valid, { status: 201 }), 'unexpected_gate_status'],
    [() => Response.json({ ...valid, action: 'publish' }), 'receipt_scope_mismatch'],
    [() => Response.json({ ...valid, digest: '0'.repeat(64) }), 'receipt_digest_mismatch'],
    [() => Response.json({ ...valid, expiresAt: now }), 'receipt_expired_or_invalid'],
  ];
  for (const [request, reason] of cases) {
    const answer = await run(bytes(staged), { request });
    assert.equal(answer.bit, 0);
    assert.equal(answer.reason, reason);
    assert.equal(JSON.stringify(answer).includes('private internal error'), false);
  }
  let reads = 0;
  const expiredDuringStaging = await run(bytes(staged), { clock: () => reads++ ? valid.expiresAt : now });
  assert.equal(expiredDuringStaging.reason, 'receipt_expired_before_commit');
  assert.deepEqual(await readdir(dir), []);
});

test('writable folders, existing files, symlinks and concurrent releases keep existing bytes safe', async t => {
  const { dir, output, run } = await fixture(t);
  const staged = await approval();
  await chmod(dir, 0o777);
  assert.equal((await run(bytes(staged))).reason, 'output_directory_not_owner_controlled');
  await chmod(dir, 0o700);

  const sibling = join(dir, 'original.json');
  await writeFile(sibling, '{"original":true}');
  await symlink(sibling, output);
  assert.equal((await run(bytes(staged))).reason, 'output_exists');
  assert.equal(await readFile(sibling, 'utf8'), '{"original":true}');

  const newPath = join(dir, 'concurrent.json');
  const attempts = await Promise.all([run(bytes(staged), { path: newPath }), run(bytes(staged), { path: newPath })]);
  assert.deepEqual(attempts.map(result => result.bit).sort(), [0, 1]);
  assert.equal(attempts.find(result => result.bit === 0)?.reason, 'output_exists');
  assert.equal(await readFile(newPath, 'utf8'), sample.payload);
  assert.deepEqual((await readdir(dir)).sort(), ['approved.json', 'concurrent.json', 'original.json']);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { axes, bodies, buildMind, planes, renderMind, sha256 } from './lasso.mjs';
import { mindIds, seedMind } from './seeds.mjs';
import worker from './worker.mjs';

test('sovereign profiles are deterministic and retain their own bodies, planes, axes and IDs', async () => {
  const profiles = await Promise.all(mindIds.map(seedMind));
  assert.equal(new Set(profiles.map(profile => profile.digest)).size, mindIds.length);
  for (const profile of profiles) {
    assert.deepEqual(await seedMind(profile.identity.id), profile);
    assert.deepEqual(Object.keys(profile.axes), axes);
    assert.deepEqual(Object.keys(profile.bodies), bodies);
    assert.deepEqual(Object.keys(profile.planes), planes);
    for (const body of ['soul', 'spirit', 'shadow']) assert.ok(profile.bodies[body].length > 0);
  }
  assert.notDeepEqual(profiles[0].ledger, profiles[1].ledger);
  assert.equal(profiles.find(p => p.identity.id === 'nathan-tabor').ledger.find(r => r.id === 'harmony.frequency').status, 'source_supported');
  assert.ok(profiles.find(p => p.identity.id === 'proton').ledger.some(r => r.text === 'ProSouls' && r.status === 'authored'));
});

test('each seeded source byte span and digest correspond to its published excerpt', async () => {
  const excerpts = await readFile(new URL('./AUTHOR-EXCERPTS.md', import.meta.url), 'utf8');
  const candidates = excerpts.split('\n').flatMap(line => [
    line.replace(/^> |^- /, ''), line.split(' · ')[1]
  ]).filter(Boolean);
  const digests = await Promise.all(candidates.map(async line => {
    const bytes = new TextEncoder().encode(line);
    return [await sha256(bytes), bytes.length];
  }));
  for (const profile of await Promise.all(mindIds.map(seedMind))) {
    for (const row of profile.ledger) {
      for (const ref of row.evidence) assert.ok(digests.some(([sha, len]) => sha === ref.sha256 && len === ref.endByte), row.id);
    }
  }
});

test('Lasso holds misattribution and contradiction, audits byte spans, and requires qualifying evidence', async () => {
  const bytes = new TextEncoder().encode('Café\nLater account.');
  const sha = await sha256(bytes);
  const identity = { id: 'example', name: 'Example', domain: 'history', scale: 'person' };
  const sources = [{ id: 'a', bytes, sha256: sha, citation: 'Fixture A p. 1', classification: 'primary_record', subjectId: 'example' }];
  const evidence = (relation, startByte = 0, endByte = 5) => ({
    sourceId: 'a', startByte, endByte, relation, review: { reviewer: 'test', note: 'Record review' }
  });
  const quote = { id: 'quote', axis: 'traits', kind: 'quote', text: 'Café', evidence: [evidence('supports')] };
  const profile = await buildMind({ identity, sources, statements: [
    quote,
    { ...quote, id: 'disputed', evidence: [...quote.evidence, evidence('contradicts', 6, bytes.length)] },
    { ...quote, id: 'later', evidence: [...quote.evidence, evidence('misattributed', 6, bytes.length)] },
    { ...quote, id: 'unknown', evidence: [] },
    { ...quote, id: 'action', kind: 'action', text: 'Attested action' },
    { ...quote, id: 'view', kind: 'interpretation', text: 'Possible vantage point' }
  ] });
  assert.deepEqual(profile.activeStatementIds, ['quote', 'action', 'view']);
  assert.deepEqual(profile.ledger.map(row => row.status), ['source_supported', 'disputed', 'misattributed', 'unknown', 'source_supported', 'interpretation']);
  assert.match(renderMind(profile), /\[misattributed\]/);
  await assert.rejects(buildMind({ identity, sources, statements: [{ ...quote, text: 'Cafe' }] }), /Invalid evidence/);
  await assert.rejects(buildMind({ identity, sources, statements: [{ ...quote, evidence: [evidence('supports', 0, 4)] }] }), /Invalid evidence/);
  await assert.rejects(buildMind({ identity, sources: [{ ...sources[0], sha256: '0'.repeat(64) }], statements: [] }), /checksum mismatch/);
  await assert.rejects(buildMind({ identity, sources, statements: [{ ...quote, kind: 'measurement' }] }), /Measurements require/);
  const wrongActor = await buildMind({ identity, sources: [{ ...sources[0], subjectId: 'other' }], statements: [quote] });
  assert.equal(wrongActor.ledger[0].status, 'unknown');
});

test('dispatch scripts answer only for their own mount and reject writes', async () => {
  const origin = 'https://example.net';
  const env = { MIND_ID: 'zero', RELEASE_SHA: 'a'.repeat(40) };
  const response = await worker.fetch(new Request(origin + '/tabor-sites/mind-zero/api/profile'), env);
  assert.equal((await response.json()).identity.id, 'zero');
  assert.equal((await worker.fetch(new Request(origin + '/tabor-sites/mind-one/api/profile'), env)).status, 404);
  assert.equal((await worker.fetch(new Request(origin + '/tabor-sites/mind-zero/api/profile', { method: 'POST' }), env)).status, 405);
  assert.equal(await (await worker.fetch(new Request(origin + '/tabor-sites/mind-zero/healthz', { method: 'HEAD' }), env)).text(), '');
  assert.equal((await worker.fetch(new Request(origin + '/tabor-sites/sovereign-minds/api/catalog'), { ...env, MIND_ID: 'catalog' })).status, 200);
});

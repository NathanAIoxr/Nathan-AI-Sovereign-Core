import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cases, choose } from '../public/client.mjs';
import anubis from '../workers/anubis.mjs';
import karma from '../workers/karma.mjs';
import finale from '../workers/finale.mjs';
import { verifyRelease } from '../workers/domino.mjs';
import { release, urls } from '../workers/shared.mjs';

const request = (path, method = 'GET') => new Request('https://example.invalid' + path, { method });
const binding = (worker) => ({ fetch: (url) => worker.fetch(new Request(url)) });
const env = { ANUBIS: binding(anubis), KARMA: binding(karma), FINALE: binding(finale) };

test('0 leaves a case open and 1 advances to a definitive ending', () => {
  let state = { index: 0, message: '' };
  for (const [i, current] of cases.entries()) {
    assert.deepEqual(new Set(current.decision.map(({ value }) => value)), new Set([0, 1]));
    state = choose(state, 0);
    assert.equal(state.index, i);
    assert.equal(state.message, current.missed);
    state = choose(state, 1);
    assert.equal(state.index, i + 1);
    assert.equal(state.message, current.receipt);
  }
  assert.strictEqual(choose(state, 1), state);
});

test('entry Workers retain their independent archive identities', async () => {
  for (const [i, worker] of [anubis, karma].entries()) {
    const result = await worker.fetch(request('/api/entry'));
    const record = await result.json();
    assert.equal(record.id, release.entries[i].id);
    assert.equal(record.name, release.entries[i].name);
    const page = await worker.fetch(request('/'));
    assert.match(await page.text(), new RegExp(record.name));
  }
});

test('finale serves an interactive page, a readable story and a download', async () => {
  const site = await finale.fetch(request('/'));
  assert.match(await site.text(), /Anubis <em>/);
  assert.match((await finale.fetch(request('/client.mjs'))).headers.get('content-type'), /javascript/);
  assert.match(await (await finale.fetch(request('/read'))).text(), /The Last Weighing/);
  const book = await finale.fetch(request('/book.txt'));
  assert.match(book.headers.get('content-disposition'), /attachment/);
  assert.match(await book.text(), /Behind them, the water kept running/);
  assert.equal(await (await finale.fetch(request('/book.txt', 'HEAD'))).text(), '');
  assert.equal((await finale.fetch(request('/api/release', 'POST'))).status, 405);
  assert.equal((await finale.fetch(request('/missing'))).status, 404);
});

test('Domino verifies the four release steps and checks related homepages', async () => {
  const calls = [];
  const external = async (url, options) => {
    calls.push([url, options.method]);
    return url === urls.manifest ? Response.json(release) : new Response(null, { status: 200 });
  };
  const report = await verifyRelease(env, external);
  assert.equal(report.ready, true);
  assert.deepEqual(report.stages.map((stage) => stage.id), ['anubis', 'karma', 'finale', 'github']);
  assert(report.stages.every((stage) => stage.status === 'verified'));
  assert.deepEqual(calls, [[urls.manifest, 'GET'], ...['world', 'heka', 'pocket'].map((id) => [urls[id] + '/', 'HEAD'])]);
});

test('Domino stops on a failed binding or a stale GitHub manifest', async () => {
  const unavailable = { fetch: async () => new Response(null, { status: 503 }) };
  const blocked = await verifyRelease({ ...env, KARMA: unavailable }, () => assert.fail('called outside failed chain'));
  assert.equal(blocked.ready, false);
  assert.deepEqual(blocked.stages.map((stage) => stage.status), ['verified', 'needs attention', 'waiting on previous step', 'waiting on previous step']);
  assert.deepEqual(blocked.related, []);
  const stale = await verifyRelease(env, async () => Response.json({ ...release, version: '0.9.0' }));
  assert.equal(stale.ready, false);
  assert.equal(stale.stages.at(-1).status, 'needs attention');
});

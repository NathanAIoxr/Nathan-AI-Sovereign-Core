import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cases, choose } from '../public/client.mjs';
import anubis from '../workers/anubis.mjs';
import karma from '../workers/karma.mjs';
import finale from '../workers/finale.mjs';
import texts from '../workers/texts.mjs';
import { verifyRelease } from '../workers/domino.mjs';
import { release, urls } from '../workers/shared.mjs';

const request = (path, method = 'GET') => new Request('https://example.invalid' + path, { method });
const binding = (worker) => ({ fetch: (url) => worker.fetch(new Request(url)) });
const env = { ANUBIS: binding(anubis), KARMA: binding(karma), FINALE: binding(finale), TEXTS: binding(texts) };

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

test('the Root page preserves the directive and cites the KJV', async () => {
  const page = await finale.fetch(request('/root'));
  const body = await page.text();
  assert.equal(page.status, 200);
  assert.ok(body.includes(release.rootDirective));
  assert.match(body, /0 = 0 · 1 = 1/);
  assert.match(body, /Revelation 12:7–9 \(KJV\)/);
  assert.match(body, /Romans 6:16–18 \(KJV\)/);
  assert.match(await (await finale.fetch(request('/'))).text(), /id="root-result"[^>]*hidden/);
});

test('Domino verifies the five release steps and checks related homepages', async () => {
  const calls = [];
  const external = async (url, options) => {
    assert.equal(options.redirect, "manual");
    calls.push([url, options.method]);
    return url === urls.manifest ? Response.json(release) : new Response(null, { status: 200 });
  };
  const report = await verifyRelease(env, external);
  assert.equal(report.ready, true);
  assert.deepEqual(report.stages.map((stage) => stage.id), ['anubis', 'karma', 'finale', 'texts', 'github']);
  assert(report.stages.every((stage) => stage.status === 'verified'));
  assert.deepEqual(calls, [[urls.manifest, 'GET'], ...['world', 'heka', 'pocket'].map((id) => [urls[id] + '/', 'HEAD'])]);
});

test('Domino stops on a failed binding or a stale GitHub manifest', async () => {
  const unavailable = { fetch: async () => new Response(null, { status: 503 }) };
  const blocked = await verifyRelease({ ...env, KARMA: unavailable }, () => assert.fail('called outside failed chain'));
  assert.equal(blocked.ready, false);
  assert.deepEqual(blocked.stages.map((stage) => stage.status), ['verified', 'needs attention', 'waiting on previous step', 'waiting on previous step', 'waiting on previous step']);
  assert.deepEqual(blocked.related, []);
  const stale = await verifyRelease(env, async () => Response.json({ ...release, version: '0.9.0' }));
  assert.equal(stale.ready, false);
  assert.equal(stale.stages.at(-1).status, 'needs attention');
});

test('text index filters, identifies witnesses, and exports the manifest-registered dataset', async () => {
  const response = await texts.fetch(request('/?q=xibalba&era=Early%20modern'));
  const page = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-security-policy'), /form-action 'self'/);
  assert.match(page, /1 of 32 indexed records/);
  assert.match(page, /id="popol-wuj-xibalba"/);
  assert.doesNotMatch(page, /id="egypt-hunefer"/);
  assert.match(await (await finale.fetch(request('/root'))).text(), /Names across traditions/);
  const escaped = await (await texts.fetch(request('/?q=%3Cscript%3E'))).text();
  assert.doesNotMatch(escaped, /<script>/);
  assert.match(escaped, /&lt;script&gt;/);
  const catalogResponse = await texts.fetch(request('/catalog.json'));
  const catalog = await catalogResponse.json();
  assert.match(catalogResponse.headers.get('content-disposition'), /attachment/);
  assert.equal(new Set(catalog.passages.map(({ id }) => id)).size, release.textIndex.records);
  for (const { source, coordinate, era, topic } of catalog.passages) {
    assert.equal(new URL(source.url).protocol, 'https:');
    assert(coordinate && source.witness && source.publisher);
    assert(catalog.eras.includes(era) && catalog.topics.includes(topic));
  }
  const api = await (await texts.fetch(request('/api/summary'))).json();
  assert.deepEqual(api, { version: release.version, ...release.textIndex });
});

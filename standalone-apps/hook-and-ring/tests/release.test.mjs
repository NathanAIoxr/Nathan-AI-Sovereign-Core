import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { eventResults } from '../game/event-results.mjs';
import { validatePlugins, playChassis, traceOutline } from '../game/chassis.mjs';

await import('../scripts/build.mjs');
const { default: worker } = await import('../dist/worker.mjs');

const get = (route, env = {}, method = 'GET') => worker.fetch(new Request('https://game.test' + route, { method }), env);

test('all 60 catalog games are valid and the featured catch runs', async () => {
  const response = await get('/game-plugins.json');
  const catalog = validatePlugins(await response.json());
  assert.equal(catalog.length, 60);
  const ring = catalog.find(game => game.id === 'hook-ring');
  assert.equal(playChassis(ring, { power: 49, aim: 0 }).success, true);
  const craft = catalog.find(game => game.id === 'stamp');
  assert.equal(playChassis(craft, { trace: traceOutline(craft.parameters.path) }).success, true);
});
test('results export is enabled for completed events and omits invite and seat keys', () => {
  assert.equal(eventResults({ champion: null }), null);
  const result = eventResults({
    name: 'Club Final', goal: 3, code: 'abcdefghij', me: 0,
    players: ['Mira', 'Otto'], champion: 0,
    rounds: [[{ players: [0, 1], winner: 0, scores: [3, 2], turn: 8 }]],
  });
  assert.equal(result.champion, 'Mira');
  assert.deepEqual(result.rounds[0].matches[0].scores, [{ player: 'Mira', catches: 3 }, { player: 'Otto', catches: 2 }]);
  assert.ok(!JSON.stringify(result).includes('abcdefghij'));
  assert.equal('me' in result, false);
});
test('production health checks both tables and disables caching', async () => {
  const env = count => ({ DB: { prepare: query => {
    assert.match(query, /arcade_events.*ranked_rounds/);
    return { first: async () => ({ count }) };
  } } });
  const ready = await get('/api/status', env(2));
  assert.equal(ready.status, 200);
  assert.equal(ready.headers.get('Cache-Control'), 'no-store');
  assert.equal((await ready.json()).onlinePlay, true);
  assert.equal((await get('/api/status', env(1))).status, 503);
  assert.equal((await get('/api/status', env(2), 'POST')).status, 405);
});
test('results controls and offline module are served together', async () => {
  assert.match(await (await get('/competition')).text(), /download-results.*Download results/);
  assert.match(await (await get('/sw.js')).text(), /event-results\.mjs/);
  assert.equal((await get('/event-results.mjs')).status, 200);
});

test('the built service worker precaches a release and falls back only when the game is unavailable', async () => {
  const script = await (await get('/sw.js')).text();
  const revision = script.match(/hook-ring-cloudflare-[a-f0-9]{24}/)?.[0];
  assert.ok(revision);
  const origin = 'https://game.test';
  const handlers = new Map();
  const offline = new Map();
  const storage = {
    async addAll(requests) {
      for (const request of requests) {
        assert.equal(request.cache, 'reload');
        const url = new URL(request.url);
        const response = await get(url.pathname + url.search);
        assert.equal(response.status, 200, request.url);
        offline.set(url.pathname, response);
      }
    },
    match(request, options) {
      assert.deepEqual({ ...options }, { ignoreSearch: true });
      return offline.get(new URL(request.url).pathname);
    },
  };
  let upstream = new Response('new game module');
  runInNewContext(script, {
    Request, Response, URL,
    self: { location: { origin }, addEventListener: (name, handler) => handlers.set(name, handler), skipWaiting() {} },
    caches: { open: async key => { assert.equal(key, revision); return storage; } },
    fetch: async () => { if (!upstream) throw new Error('Offline'); return upstream; },
  });
  await new Promise(resolve => handlers.get('install')({ waitUntil: resolve }));
  const fetchRoute = path => {
    let response;
    handlers.get('fetch')({ request: new Request(origin + path), respondWith: value => { response = value; } });
    return response;
  };
  assert.equal(await fetchRoute('/training.mjs?v=2'), upstream);
  upstream = new Response('outage', { status: 503 });
  assert.equal(await fetchRoute('/training.mjs?v=2'), offline.get('/training.mjs'));
  upstream = new Response('removed', { status: 404 });
  assert.equal(await fetchRoute('/training.mjs?v=2'), upstream);
  upstream = null;
  assert.equal(await fetchRoute('/training.mjs?other=1'), offline.get('/training.mjs'));
  assert.equal(fetchRoute('/api/status'), undefined);
  assert.equal(fetchRoute('/release.json'), undefined);
  assert.equal(fetchRoute('/source.tar.gz'), undefined);
});

test('toss lab, modules, and offline shell ship together', async () => {
  assert.match(await (await get('/training')).text(), /Toss Lab/);
  for(const path of ['/controllers/engine.mjs','/controllers/kinetic.mjs','/controllers/track-baller.mjs','/shot-record.mjs']){
    assert.equal((await get(path)).status,200);
    assert.ok((await (await get('/sw.js')).text()).includes(path));
  }
});
test('online refresh returns no bracket payload when the revision is unchanged', async () => {
  let queries=0;
  const env={DB:{prepare:()=>({bind:()=>({first:async()=>{
    queries++;
    return {code:'1234567890',revision:4,expires_ms:Date.now()+10000,body:'must not be parsed'};
  }})})}};
  const response=await get('/api/events/1234567890?revision=4',env);
  assert.equal(response.status,204);
  assert.equal(await response.text(),'');
  assert.equal(queries,1);
});

test('the release directory serves the shared controller and reports its asset checksum', async () => {
  const { createHash } = await import('node:crypto');
  const release = await (await get('/release.json')).json();
  const path = '/controllers/digit-input.mjs';
  const module = await (await get(path)).text();
  assert.match(module, /from ["']\.\/engine\.mjs["']/);
  assert.match(module, /from ["']\/input\.mjs\?v=3["']/);
  assert.equal(release.routes.find(route => route.path === path).sha256, createHash('sha256').update(module).digest('hex'));
  assert.equal(release.boardCount, 60);
  assert.match(await (await get('/ecosystem')).text(), /ecosystem-bee/);
});

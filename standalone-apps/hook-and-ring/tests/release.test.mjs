import test from 'node:test';
import assert from 'node:assert/strict';
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

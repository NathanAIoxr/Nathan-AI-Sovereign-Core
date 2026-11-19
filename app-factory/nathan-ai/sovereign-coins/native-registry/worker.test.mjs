import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import worker from './worker.mjs';
import { catalog, schema, seed, masterDeploy } from './build.mjs';
import { bundle } from '../../crypto-suite/build.mjs';

const database = new DatabaseSync(':memory:');
database.exec(masterDeploy());
database.exec(schema);
database.exec(seed);
const DB = {
  prepare(sql) {
    const statement = database.prepare(sql);
    const run = (...values) => ({ results: statement.all(...values) });
    return { all: () => run(), bind: (...values) => ({ all: () => run(...values) }) };
  },
};
const BOUNTIES = { fetch: async (url) => Response.json({ url }) };
const request = (path, options) => new Request('https://catalog.test' + path, options);
const call = (path, options) => worker.fetch(request(path, options), { DB, BOUNTIES });
const get = async (path) => (await call(path)).json();
const post = (body) => ({
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});

test('complete intake and seven public additions are stored without merging identities', async () => {
  const all = await get('/coins/sovereign?scope=all');
  assert.equal(all.count, 143);
  assert.equal(all.count, catalog.length);
  assert.equal(all.coins.filter((row) => row.submitted).length, 115);
  assert.equal(all.coins.filter((row) => row.submitted_seed).length, 47);
  assert.equal(new Set(all.coins.map((row) => row.id)).size, all.count);
  for (const id of ['public:DOGE', 'nathan:DOG', 'matrix21:D0G', 'public:PI', 'nathan:π', 'public:ALPH', 'matrix21:ALP']) {
    assert.ok(all.coins.some((row) => row.id === id), id);
  }
  assert.equal((await get('/coins/sovereign/summary')).count, all.count);
});

test('native, exception, glyph, and authored-ring queries maintain their intended scope', async () => {
  const native = await get('/coins/sovereign');
  assert.equal(native.count, 88);
  assert.ok(native.coins.every((row) => row.asset_class === 'NATIVE_COIN_ONLY'));
  const review = await get('/coins/sovereign?scope=review');
  assert.equal(review.coins.find((row) => row.symbol === 'HNT').asset_class, 'EXCLUDED_TOKEN');
  assert.equal(review.coins.find((row) => row.symbol === 'ZEN').asset_class, 'EXCLUDED_TOKEN');
  const symbols = await get('/coins/sovereign?group=SYMBOLS&q=BTC');
  assert.equal(symbols.coins[0].id, 'glyph:₿');
  assert.equal(symbols.coins[0].related_id, 'public:BTC');
  const matrix = await get('/coins/sovereign?group=MATRIX21');
  const source = JSON.parse(readFileSync(new URL('../registry.json', import.meta.url))).coins;
  assert.deepEqual(matrix.coins.map((row) => [row.position, row.symbol, row.name, row.notes, row.design_units]),
    source.map((row) => [row.number, row.ticker, row.name, row.definition, row.initial_design_units || null]));
  assert.equal((await get("/coins/sovereign?q=%27%20OR%201%3D1")).count, 0);
  assert.equal((await call('/coins/sovereign?scope=unknown')).status, 400);
});

test('master SQL retains the correct bounty data and the live API forwards only known read routes', async () => {
  assert.equal(database.prepare('SELECT count(*) AS n FROM global_bounties').get().n, 14);
  assert.match((await get('/coins/sovereign/bounties/work?limit=1')).url, /\/global-bounties\/work\?limit=1$/);
  assert.equal((await call('/coins/sovereign/bounties', post({}))).status, 405);
  const page = await call('/registry?scope=review&q=%3Cscript%3E');
  const markup = await page.text();
  assert.match(markup, /&lt;script&gt;/);
  assert.match(markup, /action="\/verify-hash"/);
  assert.doesNotMatch(markup, /<script>/);
});

test('SHA-256 and SHA3-512 match known vectors and use exact unsigned target comparison', async () => {
  const sha256 = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  const sha3 = 'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0';
  const base = { algorithm: 'SHA-256', encoding: 'hex', data: '616263', expected: sha256.toUpperCase() };
  const equal = await (await call('/verify-hash', post({ ...base, target: sha256 }))).json();
  assert.equal(equal.digest, sha256);
  assert.equal(equal.matches, true);
  assert.equal(equal.meets_target, true);
  const lower = await (await call('/verify-hash', post({ ...base, target: (BigInt('0x' + sha256) - 1n).toString(16) }))).json();
  assert.equal(lower.meets_target, false);
  const sha3Response = await (await call('/verify-hash', post({ algorithm: 'SHA3-512', data: 'abc', expected: sha3 }))).json();
  assert.equal(sha3Response.digest, sha3);
  assert.equal(sha3Response.matches, true);
  assert.equal((await call('/verify-hash', post({ ...base, data: '1' }))).status, 400);
  assert.equal((await call('/verify-hash', post({ ...base, data: 'a'.repeat(17000) }))).status, 413);
  assert.equal((await call('/verify-hash', { method: 'OPTIONS' })).status, 204);
});

test('Mining Lab routes delegate to the registry and preserve the Bitcoin genesis proof', async () => {
  const { default: mining } = await import('data:text/javascript;base64,' + Buffer.from(bundle('mining-lab')).toString('base64'));
  const env = { SOVEREIGN_REGISTRY: { fetch: (req) => worker.fetch(req, { DB, BOUNTIES }) } };
  const results = await mining.fetch(request('/coins?group=MATRIX21'), env);
  assert.equal((await results.json()).count, 21);
  const digest = await mining.fetch(request('/verify-hash', post({ algorithm: 'SHA-256', data: '' })), env);
  assert.equal((await digest.json()).byte_count, 0);
  const genesis = await mining.fetch(request('/api/genesis-proof'), env);
  assert.equal((await genesis.json()).isBitcoinGenesis, true);
});

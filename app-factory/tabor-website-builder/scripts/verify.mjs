import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/worker.mjs';
import { sites, aidIds, projectOrder } from '../src/sites.mjs';
import { client, editorClient } from '../src/ui.mjs';

function createDb(migration) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL(`../migrations/${migration}.sql`, import.meta.url), 'utf8'));
  const statement = (sql, params = []) => {
    const prepared = db.prepare(sql);
    const all = () => prepared.all(...params);
    const run = () => ({ meta: { changes: prepared.run(...params).changes } });
    return {
      bind: (...args) => statement(sql, args),
      first: () => prepared.get(...params) ?? null,
      all: () => ({ results: all() }),
      run,
      result: () => sql.trimStart().startsWith('SELECT') ? { results: all() } : run(),
    };
  };
  return {
    prepare: sql => statement(sql),
    batch: async statements => {
      db.exec('BEGIN');
      try {
        const results = statements.map(item => item.result());
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

const TOKEN = 'test-token-only';
const cache = new Map();
const kv = { get: async key => cache.get(key) ?? null, put: async (key, value) => { cache.set(key, value); } };
const envs = Object.fromEntries(projectOrder.map(id => [id, { SITE_ID: id, PUBLISHER_TOKEN: TOKEN }]));
envs['handling-life'].DB = createDb('handling');
for (const id of aidIds) envs[id].DB = createDb('aid');
Object.assign(envs['site-builder'], { DB: createDb('builder'), PAGE_CACHE: kv });

const request = (id, path, init) => worker.fetch(new Request(sites[id].url + path, init), envs[id]);
const post = (id, path, payload, token = TOKEN) => request(id, path, {
  method: 'POST',
  headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});

new Function(client);
new Function(client + editorClient);
for (const id of projectOrder) {
  const status = await request(id, '/api/health');
  assert.equal(status.status, 200);
  assert.equal((await status.json()).site, id);
  assert.equal((await request(id, '/')).status, 200);
  assert.equal((await request(id, '/', { method: 'HEAD' })).body, null);
  assert.match((await request(id, '/style.css')).headers.get('content-type'), /text\/css/);
}
const { programs } = await (await request('handling-life', '/api/programs')).json();
assert.deepEqual(programs.map(program => program.id), aidIds);
for (const id of aidIds) {
  const { items } = await (await request(id, '/api/catalog')).json();
  assert.ok(items.every(item => item.planning_example));
}
const drive = 'christmas-toy-drive';
const item = { item_id: 'test-gift', category: 'Test', title: 'Test gift', description: 'Test only', unit_cost_cents: 1400, units_available: 2, active: true };
assert.equal((await post(drive, '/api/catalog', item, 'wrong')).status, 401);
assert.equal((await post(drive, '/api/catalog', item)).status, 200);
const pledge = { pledge_id: '566d1387-1d89-4ed5-a6fc-227235705b2c', item_id: item.item_id, quantity: 2 };
assert.equal((await post(drive, '/api/pledges', pledge)).status, 200);
assert.equal((await post(drive, '/api/pledges', pledge)).status, 200);
assert.equal((await post(drive, '/api/pledges', { ...pledge, pledge_id: crypto.randomUUID() })).status, 409);
assert.equal((await post(drive, '/api/pledge-status', { pledge_id: pledge.pledge_id, status: 'FULFILLED' })).status, 200);
assert.equal((await post(drive, '/api/pledge-status', { pledge_id: pledge.pledge_id, status: 'FULFILLED' })).status, 200);
const catalog = await (await request(drive, '/api/catalog')).json();
assert.equal(catalog.items[0].units_available, 0);
assert.equal(catalog.items[0].units_fulfilled, 2);
assert.ok((await (await request('cup-of-hope', '/api/catalog')).json()).items.every(row => row.planning_example));

const builder = 'site-builder';
assert.equal((await request(builder, '/api/articles?edition=conservative-voice')).status, 401);
const entry = { edition: 'conservative-voice', slug: 'sample', title: 'Article', byline: 'Byline', body: '<b>Example</b>', status: 'draft' };
const draft = await (await post(builder, '/api/publish', entry)).json();
assert.equal((await request(builder, draft.path)).status, 404);
const published = await (await post(builder, '/api/publish', { ...entry, id: draft.id, revision: draft.revision, status: 'published' })).json();
assert.equal(published.revision, 2);
assert.match(await (await request(builder, published.path)).text(), /&lt;b&gt;Example&lt;\/b&gt;/);
assert.equal((await post(builder, '/api/publish', { ...entry, id: draft.id, revision: draft.revision })).status, 409);
const withdrawn = await post(builder, '/api/publish', { ...entry, id: published.id, revision: published.revision, status: 'withdrawn' });
assert.equal(withdrawn.status, 200);
assert.equal((await request(builder, published.path)).status, 404);

for (const [from, to] of [['/', '/222'], ['/222', '/69'], ['/69', '/3333'], ['/3333', '/beyond'], ['/beyond', '/launch']]) {
  assert.ok((await (await request('year-zero', from)).text()).includes('href="/tabor-sites/year-zero' + to + '"'));
}
assert.doesNotMatch(await (await request('year-zero', '/beyond')).text(), /YEAR ZERO|YEAR 222|YEAR 69|YEAR 3333/);
const stories = await (await request('year-zero', '/api/stories')).json();
assert.ok(stories.index_count >= 200);
assert.equal(stories.reading_count, stories.readings.length);
assert.equal((await request('year-zero', '/origins/genesis-1')).status, 200);
assert.match(await (await request('police-accountability', '/')).text(), /FUCK THE POLICE/);
console.log(`Verified ${projectOrder.length} Workers, three isolated aid catalogs, pledge retries, article revisions, cache withdrawal, and ${stories.index_count} index headings plus ${stories.reading_count} sourced readings.`);

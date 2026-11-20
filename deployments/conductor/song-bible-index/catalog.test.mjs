import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { catalog, countsQuery, statements } from './catalog.mjs';
import worker from './worker.mjs';

function openCatalog() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  for (const pass of [1, 2]) {
    db.exec('BEGIN');
    for (const {sql, params} of statements()) db.prepare(sql).run(...params);
    db.exec('COMMIT');
  }
  const stub = {
    prepare(sql) {
      const statement = db.prepare(sql);
      const execute = (...params) => {
        // The D1 adapter binds numeric placeholders positionally.
        const bound = Object.fromEntries(params.map((value, i) => ['?' + (i + 1), value]));
        return {
          all: async () => ({results: statement.all(bound)}),
          first: async () => statement.get(bound),
        };
      };
      return {bind: execute, ...execute()};
    },
  };
  return {db, stub};
}

test('imports twice with no duplicate rows and every recording has a source', () => {
  const {db} = openCatalog();
  assert.deepEqual({...db.prepare(countsQuery).get()}, {
    recordings: catalog.recordings.length, passages: catalog.passages.length,
    comparisons: catalog.comparisons.length, sources: catalog.sources.length,
  });
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM recordings r
    WHERE NOT EXISTS (SELECT 1 FROM recording_sources rs WHERE rs.recording_id = r.id AND rs.role = 'recording')`).get().count, 0);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  db.close();
});

test('returns each Bogan performance separately and filters KJV comparisons', async () => {
  const {db, stub: CATALOG} = openCatalog();
  const request = path => worker.fetch(new Request('https://catalog.example' + path), {CATALOG});
  const found = await (await request('/api/recordings?q=Lucille+Bogan')).json();
  assert.deepEqual(found.recordings.map(row => row.id), ['bogan-shave-commercial','bogan-shave-explicit']);
  const allusions = await (await request('/api/recordings?relationship=allusion')).json();
  assert.equal(allusions.recordings.length, 1);
  assert.equal(allusions.recordings[0].passages.length, 2);
  const linked = await (await request('/api/recordings?q=Judges+16&relationship=retelling')).json();
  assert.equal(linked.recordings.length, 2);
  const percent = await (await request('/api/recordings?q=%25')).json();
  assert.equal(percent.recordings.length, 0);
  assert.equal((await request('/api/recordings?relationship=invalid')).status, 400);
  const html = await (await request('/?q=%3Cscript%3E')).text();
  assert.ok(html.includes('value="&lt;script&gt;"'));
  const denied = await worker.fetch(new Request('https://catalog.example/api/recordings', {method: 'POST'}), {CATALOG});
  assert.equal(denied.status, 405);
  db.close();
});

test('mounts the index at a distinct prefix and delegates every other route', async () => {
  const {mountSongIndex} = await import('./music-lab-adapter.mjs');
  const original = {fetch: request => new Response('music:' + new URL(request.url).pathname)};
  const joined = mountSongIndex(worker, original);
  const {db, stub: CATALOG} = openCatalog();
  const request = path => joined.fetch(new Request('https://music.example' + path), {CATALOG});
  assert.equal(await (await request('/api/score')).text(), 'music:/api/score');
  assert.equal(await (await request('/song-bible-indexed')).text(), 'music:/song-bible-indexed');
  assert.equal((await request('/song-bible-index?q=blues')).headers.get('location'), 'https://music.example/song-bible-index/?q=blues');
  assert.equal((await (await request('/song-bible-index/api/recordings?q=Bogan')).json()).recordings.length, 2);
  assert.ok((await (await request('/song-bible-index/')).text()).includes('href="/song-bible-index/api/handoff"'));
  db.close();
});

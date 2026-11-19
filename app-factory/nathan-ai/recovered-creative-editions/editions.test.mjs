import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

const editions = ["heka","dragons","unicorns","castles-unicorns","liberation-codex","manifestation","magic","cigam","voodoo","goodoo-joodoo"];
const counts = { dragons: 101, unicorns: 101, 'liberation-codex': 404 };

for (const id of editions) {
  test(id + ' serves its website, game, and reader', async () => {
    const { default: worker } = await import('../' + id + '/worker.mjs');
    const config = JSON.parse(await readFile(new URL('../' + id + '/app.json', import.meta.url), 'utf8'));
    const request = (path, init) => worker.fetch(new Request(config.website + path, init));
    for (const [path, match] of [['/', /Play the game/], ['/books', /Download reader/], ['/game', /data-view="game"/]]) {
      const page = await request(path);
      assert.equal(page.status, 200);
      assert.match(await page.text(), match);
    }
    const js = await request('/game.js');
    assert.match(js.headers.get('Content-Type'), /^text\/javascript/);
    const reader = await request('/books/reader.md');
    assert.match(reader.headers.get('Content-Disposition'), /attachment/);
    assert.ok((await reader.text()).length > 200);
    const health = await (await request('/healthz')).json();
    assert.deepEqual(health, {status: 'ok', app: id, records: counts[id] ?? 0});
    const data = await (await request('/api/app')).json();
    assert.equal(new Set(data.catalog.map(row => row[0])).size, counts[id] ?? 0);
    assert.equal((await request('/catalog')).status, counts[id] ? 200 : 404);
    const head = await request('/', { method: 'HEAD' });
    assert.equal(await head.text(), '');
    assert.equal((await request('/', { method: 'POST' })).status, 405);
    assert.equal((await request('/<script>')).status, 404);
  });
}

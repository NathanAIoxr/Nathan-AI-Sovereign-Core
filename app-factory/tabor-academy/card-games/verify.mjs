import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSeed } from './catalog.mjs';

const { publicUrl } = JSON.parse(await readFile(new URL('cloudflare.json',import.meta.url),'utf8'));
const { games, lessons, release } = await buildSeed();
async function get(path, type) {
  const url = new URL(path,publicUrl);
  url.searchParams.set('verify', release);
  const r = await fetch(url,{ signal:AbortSignal.timeout(15000), cache:'no-store' });
  assert.equal(r.status,200,url.href);
  assert.match(r.headers.get('content-type') || '',type);
  return r;
}
const [page, catalog, detail, curriculum, assets] = await Promise.all([
  get('',/text\/html/).then((r)=>r.text()),
  get('api/health',/application\/json/).then((r)=>r.json()),
  get('api/games/gin-rummy',/application\/json/).then((r)=>r.json()),
  get('api/lessons',/application\/json/).then((r)=>r.json()),
  get('play.js',/javascript/).then((r)=>r.text()),
]);
assert.match(page,/Card Games Library/);
assert.equal(catalog.games,games.length);
assert.equal(catalog.rules,games.filter((g)=>g.rulebook).length);
assert.equal(catalog.play,games.filter((g)=>g.engine).length);
assert.equal(catalog.release,release);
assert.equal(detail.title,'Gin Rummy');
assert.equal(curriculum.lessons.length,lessons.length);
assert.match(assets,/export const activities/);
console.log(JSON.stringify({ publicUrl, ...catalog }));

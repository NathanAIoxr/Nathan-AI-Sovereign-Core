import assert from 'node:assert/strict';
import { sites, projectOrder, aidIds } from '../src/sites.mjs';

async function get(id, path, type, status = 200) {
  const response = await fetch(sites[id].url + path, {
    redirect: 'error',
    signal: AbortSignal.timeout(12000),
  });
  assert.equal(response.status, status, id + path);
  assert.ok(response.headers.get('content-type')?.includes(type), id + path);
  return response;
}

await Promise.all(projectOrder.map(async id => {
  const health = await get(id, '/api/health', 'application/json');
  assert.equal((await health.json()).site, id);
  const home = await get(id, '/', 'text/html');
  assert.match(await home.text(), /<main id="main">/);
  await get(id, '/style.css', 'text/css');
  console.log('OK ' + sites[id].url);
}));
await Promise.all(aidIds.map(async id => {
  const response = await get(id, '/api/catalog', 'application/json');
  assert.equal((await response.json()).program, id);
}));
const programs = await get('handling-life', '/api/programs', 'application/json');
assert.deepEqual((await programs.json()).programs.map(program => program.id), aidIds);
await get('site-builder', '/edition/conservative-voice/article/about-the-archive.html', 'text/html');
await get('site-builder', '/editor', 'text/html');
const sequence = [['/', '/222'], ['/222', '/69'], ['/69', '/3333'], ['/3333', '/beyond'], ['/beyond', '/launch']];
for (const [from, to] of sequence) {
  const response = await get('year-zero', from, 'text/html');
  assert.ok((await response.text()).includes('href="/tabor-sites/year-zero' + to + '"'), from + ' to ' + to);
}
const stories = await get('year-zero', '/api/stories', 'application/json');
const { index_count, reading_count } = await stories.json();
assert.ok(index_count >= 200);
console.log('Creation archive:', index_count, 'bibliographic headings and', reading_count, 'sourced readings');
const privateApi = await fetch(sites['site-builder'].url + '/api/articles?edition=conservative-voice', { signal: AbortSignal.timeout(12000) });
assert.ok([401, 503].includes(privateApi.status), 'editorial queue requires credentials');

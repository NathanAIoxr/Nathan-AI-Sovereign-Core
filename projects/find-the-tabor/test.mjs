import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const projects = JSON.parse(read('projects.json'));
const releases = JSON.parse(read('dist/releases.json'));
const load = async id => (await import(`./dist/${id}/index.mjs`)).default;
const request = (url, opts) => new Request('https://local.test' + url, opts);

test('each independent edition serves project-scoped source records', async () => {
  assert.equal(new Set(releases.map(([, name]) => name)).size, 10);
  assert.equal(new Set(Object.values(projects).map(({pages}) => pages)).size, 9);
  for (const [id, config] of Object.entries(projects)) {
    const app = await load(id);
    const status = await app.fetch(request('/health')).json();
    const data = await app.fetch(request('/api/records')).json();
    assert.equal(status.worker, config.worker);
    assert.equal(data.project, id);
    assert.equal(data.records.length, status.records);
    assert.equal(new Set(data.records.map(row => row.id)).size, data.records.length);
    for (const { links } of data.records) {
      assert.ok(links.every(([name, url]) => name && /^https:\/\/|^\/(?!\/)/.test(url)));
    }
    assert.equal(app.fetch(request('/api/records', {method:'POST'})).status, 405);
    assert.equal(app.fetch(request('/missing')).status, 404);
    assert.equal(await app.fetch(request('/', {method:'HEAD'})).text(), '');
    const onPages = read(`dist/pages/${id}/index.html`);
    assert.match(onPages, /pages\.dev/);
    assert.match(onPages, /<script src="\/filters\.js" defer>/);
    assert.deepEqual(JSON.parse(read(`dist/pages/${id}/api/records.json`)), data);
  }
});
test('lineage search normalizes accents and escapes query text', async () => {
  const app = await load('lineage');
  assert.match(await app.fetch(request('/?q=tabarestan')).text(), /name-east/);
  const html = await app.fetch(request('/?q=%3Cscript%3E')).text();
  assert.match(html, /value="&lt;script&gt;"/);
  assert.doesNotMatch(html, /<script>/);
});
test('both directions, authorship labels and institutional co-use survive publication', async () => {
  const app = await load('silk');
  assert.match(await app.fetch(request('/')).text(), /East Asia → Central Asia/);
  assert.match(read('dist/pages/silk/back/index.html'), /Anatolia and the eastern Mediterranean → Iran/);
  const light = JSON.parse(read('dist/pages/light/api/records.json')).records;
  assert.equal(light.find(row => row.id === 'rotation').status, 'Author framework');
  assert.equal(light.find(row => row.id === 'vatican-words').status, 'Documented');
});
test('book downloads exactly preserve the archived manuscript text', async () => {
  const app = await load('books');
  const sources = {
    'before-the-first-road':'tss-01-before-the-first-road-draft.md',
    'series-bible':'tss-series-bible-source.md'
  };
  for (const [slug, file] of Object.entries(sources)) {
    const original = read(`../../app-factory/one/library-mind/books/${file}`);
    assert.equal(await app.fetch(request(`/download/${slug}.md`)).text(), original);
    assert.equal(read(`dist/pages/books/download/${slug}.md`), original);
    assert.match(await app.fetch(request(`/read/${slug}`)).text(), /OUR WORD IS OUR BOND/);
  }
});

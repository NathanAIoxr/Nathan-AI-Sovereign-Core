import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';

const name = process.argv[2];
const mode = process.argv[3] ?? 'local';
if (!['taborpoolboys','kristian-plaque'].includes(name) || !['local','live'].includes(mode)) {
  throw new Error('Specify taborpoolboys or kristian-plaque, followed by local or live.');
}
const file = new URL('../' + name + '/app.json', import.meta.url);
const app = JSON.parse(await readFile(file, 'utf8'));
const { default: worker } = await import('../' + name + '/worker.mjs');
const get = (suffix = '', method = 'GET') => {
  const url = new URL(suffix, app.url);
  return mode === 'live'
    ? fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(15_000) })
    : worker.fetch(new Request(url, { method }));
};

const health = await get('health');
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), { app: name, status: 'ok', version: app.version });

const manifestResponse = await get('manifest.webmanifest');
assert.equal(manifestResponse.status, 200);
assert.match(manifestResponse.headers.get('content-type'), /^application\/manifest\+json/);
const manifest = await manifestResponse.json();
const scope = new URL(app.url).pathname;
assert.equal(manifest.id, scope);
assert.equal(manifest.scope, scope);
assert.equal(manifest.start_url, scope);
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.name, app.title);

for (const size of [180, 192, 512]) {
  const response = await get('icon-' + size + '.png');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.readUInt32BE(0), 0x89504e47);
  assert.equal(bytes.readUInt32BE(16), size);
  assert.equal(bytes.readUInt32BE(20), size);
  let offset = 8;
  const blocks = [];
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const label = bytes.subarray(offset + 4, offset + 8).toString();
    if (label === 'IDAT') blocks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  assert.equal(inflateSync(Buffer.concat(blocks)).length, size * (size + 1));
}

const home = await get();
assert.equal(home.status, 200);
const html = await home.text();
assert.ok(html.includes('href="' + scope + 'manifest.webmanifest"'));
assert.ok(html.includes('src="' + scope + 'main.js"'));
assert.equal((await get('', 'HEAD')).status, 200);
assert.equal((await get('missing')).status, 404);
const [client, offline] = await Promise.all(['main.js', 'sw.js'].map(async path => {
  const response = await get(path);
  assert.equal(response.status, 200);
  const source = await response.text();
  new Function(source);
  return source;
}));
assert.ok(offline.includes(JSON.stringify(scope)));
assert.ok(client.includes(JSON.stringify(scope)));
if (name === 'kristian-plaque') {
  const print = await get('print');
  assert.equal(print.status, 200);
  const closing = 'Be a KRISTIAN … NOT A CHILD RAPIST CHRISTIAN';
  assert.ok(html.includes(closing));
  assert.ok((await print.text()).includes(closing));
  assert.ok(html.includes('plaque.webp'));
  const record = await (await get('history')).text();
  const transcript = await get('history.txt');
  assert.ok(record.includes('… NO A CHILD RAPIST CHRISTIAN'));
  assert.ok(record.includes('ChatGPT'));
  assert.ok(record.includes('THE CHRISTIAN CHARACTERS'));
  assert.ok(transcript.headers.get('content-disposition').startsWith('attachment'));
  const content = await transcript.text();
  assert.ok(content.includes(closing));
  assert.ok(content.includes('… NO A CHILD RAPIST CHRISTIAN'));
  assert.ok(content.includes('Accountability belongs with the people who commit it and anyone who covers it up.'));

} else {
  assert.equal((html.match(/data-edition=/g) ?? []).length, 5);
  assert.equal((html.match(/class="issue-cover"/g) ?? []).length, 5);
  assert.ok(html.includes('boys-christmas.webp'));
  assert.ok(html.includes('Match the Covers'));
  assert.ok(html.includes('because you know what is better than one Tabor right?  TWO!!!'));
}
console.log(name + ' passed ' + mode + ' checks');

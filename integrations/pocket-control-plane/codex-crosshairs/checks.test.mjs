import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { createViews, anchors } from './views.mjs';
import { readLocalArchive } from './local-archive.mjs';

const entries = Array.from({ length: 10 }, (_, number) => ({ id: 'codex-0' + number }));

test('nine simultaneous views share entries and stable symbolic origins', () => {
  const views = createViews(entries);
  assert.equal(views.length, 9);
  assert.equal(new Set(views.map(view => view.id)).size, 9);
  assert.deepEqual(anchors.map(anchor => anchor.origin), [[0, 0, 0], [0, 0]]);
  const byId = id => views.find(view => view.id === id);
  const forward = entries.map(entry => entry.id);
  const backward = [...forward].reverse();
  assert.deepEqual(byId('forward:this-side').positions.map(entry => entry.id), forward);
  assert.deepEqual(byId('backward:this-side').positions.map(entry => entry.id), backward);
  assert.deepEqual(byId('forward:other-side').positions.map(entry => entry.id), backward);
  assert.deepEqual(byId('backward:other-side').positions.map(entry => entry.id), forward);
  assert.equal(byId('upside-down:this-side').rotation, 180);
  assert.equal(byId('upside-down:other-side').flipGlyphs, true);
  for (const view of views) {
    assert.deepEqual(view.positions.map(entry => entry.id).sort(), forward);
    for (const entry of view.positions) {
      if (view.mirror !== 'as-mirror') continue;
      assert.deepEqual(entry.counterpart, [-entry.position[0], entry.position[1]]);
    }
  }
  assert.deepEqual(entries.map(entry => entry.id), forward);
});

test('local email import decodes plain text and skips HTML', async () => {
  const message = [
    'Subject: Codex 3',
    'Content-Type: multipart/alternative; boundary="test"',
    '',
    '--test',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    'Caf=C3=A9 and ONE=20',
    '--test',
    'Content-Type: text/html',
    '',
    '<script>privateHTML()</script>',
    '--test--',
  ].join('\r\n');
  const source = new File([message], 'codex-03.eml');
  assert.deepEqual([...await readLocalArchive(source)], [['codex-03', 'Café and ONE \r\n']]);
  await assert.rejects(readLocalArchive(new File([message], 'codex-01-it.eml')), /numbered Codex/);
  await assert.rejects(readLocalArchive(new File(['broken ZIP'], 'recovery.zip')), /ZIP directory/);
});

test('built Worker serves the reader and one API for all nine views', async t => {
  const output = await mkdtemp(join(tmpdir(), 'codex-crosshairs-test-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  execFileSync(process.execPath, [fileURLToPath(new URL('build.mjs', import.meta.url)), output]);
  const { default: worker } = await import(pathToFileURL(join(output, 'worker.mjs')));
  const request = (path, method = 'GET') => worker.fetch(new Request('https://example.com' + path, { method }));
  const response = request('/api/views');
  const model = await response.json();
  assert.equal(model.views.length, 9);
  assert.deepEqual(model.entries.map(entry => entry.id), entries.map(entry => entry.id));
  assert.equal(model.entries[3].path, '/work/codex-03/');
  assert.match(await request('/').text(), /id="views"/);
  assert.match(response.headers.get('content-security-policy'), /connect-src 'self'/);
  assert.match(request('/local-archive.mjs').headers.get('content-type'), /javascript/);
  assert.equal(request('/api/views', 'POST').status, 405);
  assert.equal(await request('/api/views', 'HEAD').text(), '');
  assert.equal(request('/missing').status, 404);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { availableChats, importChatEntries } from '../public/archive.js';

test('1-1=0 clears the session and ignores a reply that finishes after Lock', async () => {
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) {
      const listeners = {};
      elements.set(id, {
        value: '', textContent: '', children: [], listeners,
        addEventListener(type, listener) { listeners[type] = listener; },
        replaceChildren() { this.children = []; },
        append(...children) { this.children.push(...children); },
        focus() {}, reset() {}, querySelector() { return element(id + '-submit'); }
      });
    }
    return elements.get(id);
  };
  let pending;
  const requests = [];
  const source = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).replace(/^import [^\n]+\n/, '');
  runInNewContext(source, {
    URL, Headers, AbortController, Response,
    location: { href: 'https://test.invalid/memory-bank/' },
    availableChats, importChatEntries,
    document: { getElementById: element, querySelector: element },
    fetch: (url, options) => {
      requests.push({ url: String(url), options });
      return new Promise((resolve) => { pending = resolve; });
    }
  });
  element('key').value = 'fixture-private-key';
  element('connect').listeners.click();
  element('question').value = 'private search';
  element('recall').listeners.submit({ preventDefault() {} });
  assert.equal(requests[0].url, 'https://test.invalid/memory-bank/recall');
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[0].options.body), { q: 'private search', limit: 8 });
  let finishArchive;
  element('archive-file').value = 'local-export.json';
  element('archive-file').files = [{ size: 20, text: () => new Promise((resolve) => { finishArchive = resolve; }) }];
  const preview = element('archive-file').listeners.change();

  element('lock').listeners.click();
  assert.equal(requests[0].options.signal.aborted, true);
  assert.equal(element('key').value, '');
  assert.equal(element('question').value, '');
  assert.equal(element('recall-status').textContent, '');
  assert.equal(element('copy').hidden, true);
  assert.equal(element('archive-file').value, '');
  finishArchive('ignored after lock');
  await preview;
  assert.equal(element('archive-status').textContent, '');
  pending(Response.json({ memories: [{ id: 1, title: 'late result' }], next_before_id: null }));
  await setImmediate();
  assert.deepEqual(element('results').children, []);
  assert.equal(element('recall-status').textContent, '');

  element('recall').listeners.submit({ preventDefault() {} });
  await setImmediate();
  assert.equal(requests.length, 1);
  assert.equal(element('recall-status').textContent, 'Enter your access key first.');
});

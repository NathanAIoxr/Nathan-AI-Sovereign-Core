'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = require('./engine.js');
const inventory = JSON.parse(fs.readFileSync(path.join(__dirname,'inventory.json'), 'utf8'));
function sample(p, t = 'f') { return {p,t,b:123,s:'sha'}; }
test('the two user-authored formulas remain exact, without mirror or inversion claims', () => {
  assert.deepEqual(api.FORMULAS, ['node = mind = node','mind = node = mind']);
});
test('every GitHub tree path appears exactly once with accurate counts', () => {
  assert.equal(inventory.entries.length, inventory.entryCount);
  assert.equal(inventory.entries.filter(x=>x.t==='f').length, inventory.fileCount);
  assert.equal(inventory.entries.filter(x=>x.t==='d').length, inventory.directoryCount);
  assert.ok(inventory.entryCount >= 1000);
  assert.equal(new Set(inventory.entries.map(x=>x.p)).size, inventory.entryCount);
  assert.ok(inventory.entries.every(x=>!x.p.startsWith('/') && !x.p.split('/').includes('..')));
});
test('path gives only candidates, not source or runtime evidence', () => {
  const row = api.fromPath(sample('app-factory/nathan-ai/node-runtime/engine.js'));
  assert.equal(row.scope, 'Nathan AI');
  assert.ok(row.candidates.includes('connect'));
  assert.deepEqual(row.observed, []);
  assert.equal(row.runtimeVerified, false);
  assert.equal(row.evidenceLevel,'path-only');
});
test('source scan signals are distinguishable from verified execution', () => {
  const row = api.analyzeText(sample('app-factory/nathan-ai/assistant/app.js'),
    "async function go(){ const answer = await fetch('/status'); localStorage.setItem('x','y'); document.createElement('p'); }");
  assert.ok(row.observed.includes('receive'));
  assert.ok(row.observed.includes('remember'));
  assert.ok(row.observed.includes('create'));
  assert.equal(row.runtimeVerified, false);
  assert.equal(row.evidenceLevel,'static-source-scanned');
  assert.ok(row.evidence.every(x=>x.basis==='static-source-pattern'));
});
test('content does not turn documents or directories into proven implementation', () => {
  const doc = api.analyzeText(sample('docs/ideation.md'), 'fetch("/status")');
  const dir = api.fromPath(sample('app-factory/nathan-ai/factory','d'));
  assert.equal(doc.evidenceLevel,'path-only');
  assert.equal(dir.type,'directory');
  assert.equal(dir.runtimeVerified,false);
});
test('filter covers actual paths, including those without candidate labels', () => {
  const rows = [api.fromPath(sample('docs/misc.md')),api.fromPath(sample('app-factory/nathan-ai/assistant/engine.js'))];
  assert.equal(api.search(rows,{scope:'Nathan AI'}).length,1);
  assert.equal(api.search(rows,{query:'misc'}).length,1);
  assert.equal(api.search(rows,{capability:'no-such-capability'}).length,0);
  assert.equal(api.summary(rows).total,2);
});

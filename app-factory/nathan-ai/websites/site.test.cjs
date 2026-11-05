'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const portal = path.join(__dirname, 'index.html');
const toy = path.resolve(__dirname, '../../christmas-toy-drive/index.html');
const desktop = path.join(__dirname, 'launchpad.html');
const hub = path.resolve(__dirname, '../index.html');
const factory = path.resolve(__dirname, '../../index.html');

function html(file) { return fs.readFileSync(file, 'utf8'); }
function inlineScripts(markup) {
  return [...markup.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((s) => s.trim());
}
function localLinks(file) {
  const markup = html(file);
  return [...markup.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((value) =>
    !value.startsWith('#') && !/^[a-z][a-z0-9+.-]*:/i.test(value));
}
test('portal and Christmas Toy Drive are standalone HTML pages', () => {
  for (const file of [portal, toy, desktop]) {
    assert.ok(fs.existsSync(file), file);
    const source = html(file);
    assert.match(source, /<!doctype html>/i);
    assert.match(source, /<meta name="viewport"/i);
    assert.match(source, /<main\b/i);
    assert.match(source, /<nav\b/i);
    assert.match(source, /prefers-reduced-motion/);
    assert.match(source, /<title>[^<]+<\/title>/i);
  }
});
test('inline JavaScript parses without dependencies', () => {
  for (const file of [portal, toy]) {
    const scripts = inlineScripts(html(file));
    assert.ok(scripts.length, 'Inline JavaScript exists in ' + file);
    scripts.forEach((source) => assert.doesNotThrow(() => new vm.Script(source, { filename: file })));
  }
});
test('every relative navigation link resolves to a repository file or directory', () => {
  for (const file of [portal, toy]) {
    for (const url of localLinks(file)) {
      const dest = path.resolve(path.dirname(file), decodeURIComponent(url.split(/[?#]/, 1)[0]));
      assert.ok(fs.existsSync(dest), file + ' has broken link: ' + url);
      if (fs.statSync(dest).isDirectory()) {
        assert.ok(fs.existsSync(path.join(dest, 'index.html')), file + ' linked folder without index: ' + url);
      }
    }
  }
});
test('original main hub and Factory have additive links into new sites', () => {
  assert.match(html(hub), /href="\.\/websites\/index\.html"/);
  assert.match(html(factory), /href="\.\/nathan-ai\/websites\/"/);
  assert.match(html(factory), /href="\.\/christmas-toy-drive\/"/);
});
test('no public donation processing or child intake is introduced', () => {
  for (const file of [portal, toy]) {
    const source = html(file);
    assert.doesNotMatch(source, /<form\b/i);
    assert.doesNotMatch(source, /stripe\.com|paypal\.com|donate\.stripe/i);
    assert.doesNotMatch(source, /<iframe\b/i);
  }
  assert.match(html(toy), /gift-list-v1/);
  assert.match(html(toy), /localStorage/);
  assert.match(html(portal), /ROOT and TREE of STUPIDITY/);
});

test('full public launcher has valid JavaScript, documented routes and source-only links', () => {
  const vm = require('node:vm');
  const launcher = html(path.join(__dirname,'launchpad.js'));
  const registry = html(path.join(__dirname,'registry.js'));
  assert.doesNotThrow(()=>new vm.Script(launcher));
  assert.doesNotThrow(()=>new vm.Script(registry));
  const context = { window: {} };
  vm.runInNewContext(registry, context);
  const modules = context.window.NathanAIWebsiteModules;
  assert.ok(Array.isArray(modules) && modules.length >= 95, 'Full public directory expected');
  const ids = new Set();
  for (const module of modules) {
    assert.ok(typeof module.title === 'string' && module.title.length, 'title required');
    assert.ok(typeof module.id === 'string' && !ids.has(module.id), 'unique id: '+module.id);
    ids.add(module.id);
    assert.ok(['apps','games','creative','research','community'].includes(module.group), 'known group');
    assert.ok(module.url.startsWith('../../'), 'local relative URL');
    const target = path.resolve(__dirname, module.url);
    assert.ok(fs.existsSync(target), 'public module path exists: '+module.url);
    if (fs.statSync(target).isDirectory()) assert.ok(fs.existsSync(path.join(target,'index.html')), 'folder has index: '+module.url);
  }
  assert.match(html(portal), /href="\.\/launchpad\.html"/);
  assert.match(html(desktop), /id="module-cards"/);
});

// Source-first D archive integration: preserve original data while linking all public doors.
test('D original source archive integrates hub, website and desktop without replacing A–Z', () => {
  const dRoot = path.resolve(__dirname, '../../../archive-index/alphabet/d');
  const dHtml = path.join(dRoot, 'index.html');
  const dCanon = path.join(dRoot, 'canonical-d-sequences.json');
  const chatbox = path.resolve(__dirname, '../hop-in/chatbox/index.html');
  const chatEngine = require('../hop-in/chatbox/engine.js');
  const original = JSON.parse(html(dCanon));
  assert.ok(fs.existsSync(dHtml));
  assert.equal(original.categories.length, 5);
  assert.deepEqual(original.categories.map(x => x.title), [
    'the Demonology Dilution of Atoms',
    'The Double Dilution of Amplitudes',
    'The David Dilution of Ancestry-kin',
    'Dancing Demons',
    'Davidic Dancers'
  ]);
  assert.match(html(hub), /href="\.\.\/\.\.\/archive-index\/alphabet\/d\/index\.html"/);
  assert.match(html(portal), /href="\.\.\/\.\.\/\.\.\/archive-index\/alphabet\/d\/index\.html"/);
  assert.match(html(chatbox), /Explore D \/ DD \/ DDD \/ inversions/);
  const command = chatEngine.reply('/d variants');
  assert.equal(command.kind, 'route');
  assert.ok(command.links.some(x => x.url === '../../../../archive-index/alphabet/d/index.html'));
  assert.equal(Object.keys(chatEngine.MODE_LABELS).length, 7);
  const runtime = {window: {}};
  vm.runInNewContext(html(path.join(__dirname, 'registry.js')), runtime);
  const dApp = runtime.window.NathanAIWebsiteModules.find(x => x.id === 'nathan-ai/d-archive/index.html');
  assert.ok(dApp);
  const gateway = path.resolve(__dirname, '../d-archive/index.html');
  assert.equal(path.resolve(__dirname, dApp.url), gateway);
  assert.match(html(gateway), /src="\.\.\/\.\.\/\.\.\/archive-index\/alphabet\/d\/index\.html"/);
  assert.ok(fs.existsSync(gateway));
});

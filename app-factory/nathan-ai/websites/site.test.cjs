'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const portal = path.join(__dirname, 'index.html');
const toy = path.resolve(__dirname, '../../christmas-toy-drive/index.html');
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
  for (const file of [portal, toy]) {
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

'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8');
const html = read('studio.html');
const plan = read('assets/TWO-MOONS-CONCEPT-PLAN.svg');
const stages = read('assets/TWO-MOONS-ASSEMBLY-STAGES.svg');
const doc = read('BUILD-PLANS.md');

test('four stage controls have meaningful interactive functions', () => {
  for (const i of [0,1,2,3]) assert.match(html, new RegExp('data-stage="'+i+'"'));
  for (const id of ['previous','next','reset']) assert.match(html, new RegExp('id="'+id+'"'));
  assert.match(html, /addEventListener/);
  assert.match(html, /aria-pressed/);
});

test('both SVG image assets referenced from the working studio exist', () => {
  for (const name of ['TWO-MOONS-CONCEPT-PLAN.svg','TWO-MOONS-ASSEMBLY-STAGES.svg']) {
    assert.ok(html.includes(name));
    assert.ok(fs.existsSync(path.join(__dirname,'assets',name)));
  }
  for (const art of [plan, stages]) {
    assert.match(art, /<svg[\s>]/);
    assert.match(art, /<\/svg>/);
    assert.match(art, /FICTION|fiction|speculative|CONCEPT|concept/i);
  }
});

test('observed Moon and hypothetical second construction stay differentiated', () => {
  assert.match(plan, /MOON 01/);
  assert.match(plan, /MOON 02/);
  assert.match(plan, /OBSERVED NATURAL MOON/);
  assert.match(plan, /FICTIONAL BUILD MODEL/);
  assert.match(doc, /cover story/i);
});

test('the numeric lunar reference is consistent and the art is not called authentic', () => {
  for (const x of [html,plan,stages,doc]) assert.match(x,/3,474\.8/);
  assert.match(html, /not genuine Redstone/i);
  assert.match(doc, /the GitHub repository presently contains newly created source-labeled SVG alternatives/i);
});

test('the studio has no network or command activation code', () => {
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|navigator\.geolocation|serviceWorker\.register/i);
});

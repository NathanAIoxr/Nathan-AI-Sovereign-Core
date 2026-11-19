import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { advance, answer, begin, categories } from '../Retro/quiz-engine.mjs';

const names = ['Scrambler', 'Sudoku', 'YardArcade', 'Retro'];
const required = {
  Scrambler: ['scrambler'],
  Sudoku: ['sudoku'],
  YardArcade: ['hook', 'yard-darts', 'sword-practice', 'spear-quintain', 'cornhole',
    'horseshoes', 'lawn-jarts', 'tracker-sword', 'grapple'],
  Retro: ['void', 'quiz']
};
const digest = data => createHash('sha256').update(data).digest('hex');

for (const name of names) {
  const base = new URL('../Generated/' + name + '/Web/', import.meta.url);
  const shelf = JSON.parse(await readFile(new URL('shelf.json', base), 'utf8'));
  const entries = new Set(shelf.entries.map(entry => entry.id));
  assert.equal(entries.size, shelf.entries.length);
  for (const id of required[name]) assert.ok(entries.has(id), name + ' missing ' + id);
  if (name === 'YardArcade') {
    assert.equal(shelf.entries.filter(entry => entry.group === 'Arcade boards').length, 60);
    assert.equal(shelf.entries.filter(entry => entry.group === 'Track Baller').length, 13);
  }
  const url = 'https://offline.invalid';
  for (const [path, asset] of Object.entries(shelf.routes)) {
    assert.match(asset.file, /^assets\/[a-f0-9]{20}$/);
    const bytes = await readFile(new URL(asset.file, base));
    assert.equal(bytes.length, asset.bytes);
    assert.equal(digest(bytes), asset.sha256);
    const body = bytes.toString('utf8');
    let links = [];
    if (asset.type === 'text/html') {
      links = [...body.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
      assert.doesNotMatch(body, /<script(?:\s[^>]*?)?>(?!\s*<\/script>)\s*[^<]/);
      assert.doesNotMatch(body, /Planned U\.S\. storefront pricing|Planned online play and hosting/);
    }
    if (asset.type === 'text/javascript') {
      links = [...body.matchAll(/(?:from\s*|import\s*)['"]([./][^'"]+)['"]/g)].map(match => match[1]);
    }
    for (const address of links) {
      if (address.startsWith('#')) continue;
      const destination = new URL(address, url + path);
      assert.equal(destination.origin, url, name + ' external link at ' + path);
      assert.ok(shelf.routes[destination.pathname], name + ' missing ' + path + ' → ' + destination.pathname);
    }
  }
  console.log(name + ' shelf, dependencies and asset checksums verified');
}

for (const [category, questions] of Object.entries(categories)) {
  let round = begin(category);
  assert.deepEqual(advance(round), round);
  for (const [, options, correct] of questions) {
    assert.ok(options[correct]);
    round = answer(round, correct);
    assert.deepEqual(answer(round, correct), round);
    round = advance(round);
  }
  assert.equal(round.score, questions.length);
  assert.deepEqual(answer(round, 0), round);
}
assert.throws(() => begin('unknown'));
console.log('Retro quiz transitions verified');

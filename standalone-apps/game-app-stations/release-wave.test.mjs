import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';

const originals = [
  'castles-unicorns-the-rotating-storyteller','the-game-of-games-the-tabor-spiraltm',
  'the-rubber-hose','fee-fi-fo-fum-beanstalk-escape','101-fairy-tale-worlds-one-story-arcade',
];
const ports = ['crossword-matrix','three-by-three','seed-circuit','territory-stone','pixel-cipher','harbor-lines'];
const field = process.env.APP_TEST_TASK;

for (const id of originals) {
  if (field && field !== 'archive') continue;
  test(id + ' has runnable archived inline JavaScript and no remote executable dependency', async () => {
    const bytes = await readFile(new URL('./apps/'+id+'/play.html', import.meta.url));
    const source = bytes.toString('utf8');
    assert.match(source,/<title>[^<]+<\/title>/i);
    assert.doesNotMatch(source,/<(?:script|iframe)\b[^>]*\bsrc\s*=/i);
    const scripts = Array.from(source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi))
      .filter(([, attributes]) => !/\btype\s*=/.test(attributes) || /type\s*=\s*["'](?:application|text)\/javascript["']/i.test(attributes));
    assert(scripts.length>0);
    for (const [, ,code] of scripts) new Script(code, {filename:id});
    const manifest = JSON.parse(await readFile(new URL('./apps/'+id+'/app.json', import.meta.url), 'utf8'));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.archive_sha256);
  });
}

for (const id of ports) {
  if (field && field !== id) continue;
  test(id + ' has an independent playable entry and a demonstrated outcome', async () => {
    const base = new URL('./apps/'+id+'/', import.meta.url);
    const html = await readFile(new URL('play.html',base),'utf8');
    assert.match(html,/<script type="module" src="\.\/game\.mjs">/);
    const api = await import(new URL('engine.mjs',base));
    if (id==='three-by-three') {
      assert.deepEqual(api.winningLine(['X','X','X','','O','','','','O']),[0,1,2]);
      assert.equal(api.winningLine(['X','O','X','O','X','X','O','X','O']),undefined);
    }
    if (id==='seed-circuit') {
      const start=[3,3,3,3,0,3,3,3,3,0];
      assert.equal(api.sow(start,0,5),null);
      const extra=api.sow(start,0,1);
      assert.equal(extra.player,0);
      assert.equal(extra.next.reduce((a,b)=>a+b),24);
      assert.equal(api.sow([0,0,0,1,9,0,1,0,0,13],0,3).finished,true);
    }
    if (id==='territory-stone') {
      assert.deepEqual(api.territory([2,1,2,1,0,1,2,1,2],3),[5,4]);
      assert.deepEqual(api.territory([1,0,2],3),[1,1]);
    }
    if (id==='pixel-cipher') {
      assert.deepEqual(api.pixelClues(api.pixelPicture),[['1','3','5','3','1'],['1','3','5','3','1']]);
      assert.deepEqual(api.runs([1,0,1,1]),[1,2]);
    }
    if (id==='crossword-matrix') {
      assert(api.crosswordDone(Array.from('RING......R......I......DART')));
      assert(!api.crosswordDone(Array(28).fill('A')));
    }
    if (id==='harbor-lines') {
      let paths = [[0],[20]];
      assert.equal(api.extend(paths,0,6),paths);
      for (const n of [5,10,11,12]) paths=api.extend(paths,0,n);
      for (const n of [21,22,23,24,19,14,9,4]) paths=api.extend(paths,1,n);
      assert.deepEqual(paths.map(path=>path.at(-1)),[12,4]);
    }
  });
}

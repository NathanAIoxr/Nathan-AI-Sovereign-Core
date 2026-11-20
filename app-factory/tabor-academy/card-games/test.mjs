import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { buildSeed } from './catalog.mjs';
import { buildModules, mount } from './build.mjs';
import withCardGames, { serveCardGames } from './academy-card-games.mjs';
import { activities, combinations, deadwood, deck, handTotal, hiLo } from './public/play.js';

const seed = await buildSeed();
const sqlite = new DatabaseSync(':memory:');
sqlite.exec([seed.schema,...seed.chunks,seed.receipt].join('\n'));
sqlite.exec(await readFile(new URL('wiki/schema.sql',import.meta.url),'utf8'));
function statement(query, params = []) {
  return {
    bind: (...values) => statement(query,values),
    all: () => ({ results: sqlite.prepare(query).all(...params) }),
    first: () => sqlite.prepare(query).get(...params) || null,
  };
}
const db = { prepare: statement, batch: async (list) => list.map((item) => item.all()) };
const req = (path, options) => new Request('https://example.com/tabor-academy/card-games/' + path, options);
const api = async (path)=> (await serveCardGames(req(path),db,path.split('?')[0])).json();

test('seed is replayable and counts reflect rulebooks and live activities', async () => {
  sqlite.exec([seed.schema,...seed.chunks,seed.receipt].join('\n'));
  const health = await api('api/health');
  assert.equal(health.games,seed.games.length);
  assert.equal(health.rules,seed.games.filter((game)=>game.rulebook).length);
  assert.equal(health.lessons,seed.lessons.length);
  assert.equal(health.release,seed.release);
  assert.ok(health.games > 1000);
  const registered = seed.games.filter((game)=>game.engine).map((game)=>game.engine).sort();
  assert.deepEqual(registered,Object.keys(activities).sort());
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM card_imports').get().n,1);
});

test('catalog search handles accents, aliases, pagination, literal punctuation and incorrect record ids', async () => {
  const page = await api('api/games?limit=5');
  assert.equal(page.games.length,5);
  assert.equal(page.nextOffset,5);
  const next = await api('api/games?limit=5&offset=5');
  assert.ok(next.games.every((g)=>!page.games.some(({id})=>g.id === id)));
  const garbage = await api('api/games?q=Garbage&play=1');
  assert.ok(garbage.games.some((g)=>g.id === 'trash'));
  const historic = await api('api/games?q=Karnoffel&status=reconstructed');
  assert.ok(historic.games.some((g)=>g.id === 'karnoeffel'));
  assert.equal((await api("api/games?q=%27%20OR%201=1--")).total,0);
  const fragment = await api('api/games/game-of-leaves');
  assert.equal(fragment.rulebook,null);
  assert.equal(fragment.status,'fragment');
  assert.ok(fragment.research);
  assert.ok((await api('api/games/leaf-table')).rulebook);
  const missing = await serveCardGames(req('api/games/unknown'),db,'api/games/unknown');
  assert.equal(missing.status,404);
  assert.equal((await serveCardGames(req('api/games',{method:'POST'}),db,'api/games')).status,405);
});

test('curriculum links to games and mount preserves the existing Academy', async () => {
  const { lessons } = await api('api/lessons');
  assert.equal(lessons[0].id,'comfortable-table');
  assert.ok(lessons.some((l)=>l.id === 'hi-lo'));
  assert.ok(lessons.every((lesson)=>!lesson.game_id || seed.games.some((g)=>g.id === lesson.game_id)));
  const additions = await buildModules();
  const original = new Map([['academy-entry.mjs','import a from "./worker.mjs";\nexport default a;\n'],['worker.mjs','base']]);
  const mounted = mount(original,additions);
  assert.equal(mounted.get('worker.mjs'),'base');
  assert.match(mounted.get('academy-entry.mjs'),/export default withCardGames\(a\)/);
  assert.deepEqual(mount(mounted,additions),mounted);
  const academy = withCardGames({ fetch: () => new Response('existing route') });
  assert.equal(await (await academy.fetch(new Request('https://example.com/institution/'),{},null)).text(),'existing route');
  const landing = await academy.fetch(req(''),{CARD_GAMES_DB:db});
  assert.match(await landing.text(),/Card Games Library/);
  assert.equal((await academy.fetch(req('api/health'),{CARD_GAMES_DB:db})).status,200);
  assert.equal((await academy.fetch(new Request('https://example.com/card-games/api/health'),{CARD_GAMES_DB:db})).status,200);
});

test('deck, Hi-Lo, flexible blackjack aces, target groups and overlapping Gin melds', () => {
  const cards = deck();
  assert.equal(new Set(cards.map((c)=>c.rank + c.suit.glyph)).size,52);
  assert.equal(cards.reduce((total,c)=>total + hiLo(c),0),0);
  const card = (rank, suit)=>cards.find((c)=>c.rank === rank && (!suit || c.suit.glyph === suit));
  assert.equal(handTotal([card(1,'♠'),card(6)]),17);
  assert.equal(handTotal([card(1,'♠'),card(1,'♦'),card(9)]),21);
  assert.equal(handTotal([card(1),card(6),card(8)]),15);
  assert.deepEqual(combinations([card(2),null,card(3),card(5)],10),[0,2,3]);
  const gin = [card(7,'♣'),card(7,'♦'),card(7,'♥'),card(8,'♥'),card(9,'♥')];
  assert.equal(deadwood(gin),14);
});

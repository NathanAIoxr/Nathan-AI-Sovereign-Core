import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const load = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const readData = async (name) => JSON.parse(await load('data/' + name + '.json'));
export const normalize = (name) => name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim();
const sql = (value) => value == null ? 'NULL' : "'" + String(value).replaceAll("'", "''") + "'";
const json = (value) => value == null ? null : JSON.stringify(value);

export async function readCatalog() {
  const [indexed, supplement, editions, recovery, lessons] = await Promise.all(
    ['pagat-index', 'supplement-index', 'editions', 'recovery', 'lessons'].map(readData)
  );
  const authored = [...editions, ...recovery].map((game) => ({
    ...game, aliases: [...new Set(game.aliases || [])], sources: game.sources || [],
  }));
  const redirect = new Map();
  const exact = new Map();
  for (const game of authored) {
    const keys = [game.title, ...game.aliases].map(normalize);
    for (const url of game.upgrade || []) redirect.set(url, game);
    for (const key of keys) exact.set(key, game);
  }
  const games = [...authored];
  const indexedKeys = new Map();
  for (const entry of [...indexed,...supplement]) {
    const candidate = redirect.get(entry.sources[0].url);
    const matched = candidate && [candidate.title, ...candidate.aliases].some((name) =>
      normalize(name) === normalize(entry.title) || normalize(entry.title).startsWith(normalize(name) + ' (')
    );
    if (matched || exact.has(normalize(entry.title))) {
      const target = matched ? candidate : exact.get(normalize(entry.title));
      target.aliases = [...new Set([...target.aliases, entry.title, ...entry.aliases])].filter((title) => title !== target.title);
      target.sources = [...new Map([...target.sources, ...entry.sources].map((source) => [source.url, source])).values()];
    } else {
      const sourceKeys = entry.sources.map(({ url }) => normalize(entry.title) + '|' + url);
      const sameEntry = sourceKeys.map((k) => indexedKeys.get(k)).find(Boolean);
      if (sameEntry) {
        sameEntry.sources = [...new Map([...sameEntry.sources, ...entry.sources].map((source) => [source.url, source])).values()];
      } else {
        games.push(entry);
      }
      for (const key of sourceKeys) indexedKeys.set(key, sameEntry || entry);
    }
  }

  const ids = new Set();
  for (const game of games) {
    if (!/^[a-z0-9-]{1,90}$/.test(game.id) || ids.has(game.id)) throw new Error('Bad or duplicate game id: ' + game.id);
    ids.add(game.id);
    for (const source of game.sources) {
      if (new URL(source.url).protocol !== 'https:') throw new Error('Source must use HTTPS: ' + source.url);
    }
    if (game.rulebook && !['setup','turns','finish','teach'].every((section) => Boolean(game.rulebook[section]))) {
      throw new Error('Incomplete rulebook: ' + game.id);
    }
    delete game.upgrade;
  }
  for (const lesson of lessons) {
    if (lesson.game && !ids.has(lesson.game)) throw new Error('Missing lesson game: ' + lesson.game);
  }
  return { games, lessons };
}

function upsert(table, columns, rows) {
  return 'INSERT INTO ' + table + ' (' + columns.join(',') + ') VALUES\n' +
    rows.map((row) => '(' + row.map(sql).join(',') + ')').join(',\n') +
    '\nON CONFLICT(id) DO UPDATE SET ' + columns.slice(1).map((c) => c + '=excluded.' + c).join(',') + ';';
}

export async function buildSeed() {
  const catalog = await readCatalog();
  const release = createHash('sha256').update(JSON.stringify(catalog)).digest('hex').slice(0, 16);
  const schema = await load('schema.sql');
  const options = { ...catalog, release, schema, chunks: [] };
  const columns = ['id','title','family','region','players','deck','status','aliases','sources','rulebook','engine','research','search_text'];
  const rows = catalog.games.map((g) => [
    g.id, g.title, g.family, g.region, g.players, g.deck, g.status, json(g.aliases),
    json(g.sources), json(g.rulebook), g.engine, g.research,
    normalize([g.title, ...g.aliases, g.family, g.region, g.deck].join(' ')),
  ]);
  for (let i = 0; i < rows.length; i += 30) options.chunks.push(upsert('card_games', columns, rows.slice(i,i+30)));
  options.chunks.push(upsert('card_lessons', ['id','sequence','level','title','body','game_id'],
    catalog.lessons.map(({ id, level, title, game, ...body }, i) => [id,i+1,level,title,json(body),game])));
  options.receipt = 'INSERT INTO card_imports(release,game_count,lesson_count) VALUES (' +
    [sql(release),catalog.games.length,catalog.lessons.length].join(',') + ') ON CONFLICT(release) DO NOTHING;';
  return options;
}

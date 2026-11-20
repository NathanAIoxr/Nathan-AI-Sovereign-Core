import { assets } from './card-assets.mjs';
import { publishReferences } from './card-intake-publish.mjs';
import { engineSpecs, listResearch, researchForGame, researchSummary } from './card-reference-api.mjs';

export const route = '/tabor-academy/card-games/';
const statuses = new Set(['documented','reconstructed','original','indexed','fragment']);
const lookup = (name) => name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim();
const columns = 'id,title,family,region,players,deck,status,aliases,sources,rulebook,engine,research';
const listColumns = 'id,title,family,region,players,deck,status,engine';
const policy = "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";

function response(body, type, status = 200) {
  return new Response(body, { status, headers: {
    'content-type': type,
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'cache-control': status === 200 ? 'public, max-age=60' : 'no-store',
    'content-security-policy': policy,
  } });
}

const json = (value, status) => response(JSON.stringify(value), 'application/json; charset=utf-8', status);

function fullRecord(row) {
  return {
    ...row,
    aliases: JSON.parse(row.aliases),
    sources: JSON.parse(row.sources),
    rulebook: row.rulebook ? JSON.parse(row.rulebook) : null,
  };
}

function filter(url) {
  const clauses = [];
  const params = [];
  const q = lookup((url.searchParams.get('q') || '').slice(0, 100));
  if (q) {
    clauses.push('instr(search_text, ?) > 0');
    params.push(q);
  }
  const status = url.searchParams.get('status');
  if (statuses.has(status)) {
    clauses.push('status = ?');
    params.push(status);
  }
  const family = url.searchParams.get('family');
  if (family) {
    clauses.push('family = ?');
    params.push(family.slice(0, 50));
  }
  if (url.searchParams.get('play') === '1') clauses.push('engine IS NOT NULL');
  return { where: clauses.length ? ' WHERE ' + clauses.join(' AND ') : '', params };
}

function boundedParameter(value, fallback, max, min = 0) {
  if (!/^\d{1,8}$/.test(value || '')) return fallback;
  return Math.min(max, Math.max(min, Number(value)));
}

async function listGames(url, db) {
  const { where, params } = filter(url);
  const limit = boundedParameter(url.searchParams.get('limit'), 24, 100, 1);
  const offset = boundedParameter(url.searchParams.get('offset'), 0, 1_000_000);
  const order = " ORDER BY CASE status WHEN 'indexed' THEN 1 ELSE 0 END, title COLLATE NOCASE, id";
  const [games, count] = await db.batch([
    db.prepare('SELECT ' + listColumns + ' FROM card_games' + where + order + ' LIMIT ? OFFSET ?')
      .bind(...params, limit, offset),
    db.prepare('SELECT COUNT(*) AS total FROM card_games' + where).bind(...params),
  ]);
  const total = count.results[0].total;
  return json({ games: games.results, total, nextOffset: offset + limit < total ? offset + limit : null });
}

async function info(db) {
  const [games, lessons, release, families] = await db.batch([
    db.prepare('SELECT count(*) AS total, sum(rulebook IS NOT NULL) AS rules, sum(engine IS NOT NULL) AS play FROM card_games'),
    db.prepare('SELECT count(*) AS total FROM card_lessons'),
    db.prepare('SELECT release FROM card_imports ORDER BY published_at DESC, rowid DESC LIMIT 1'),
    db.prepare('SELECT DISTINCT family FROM card_games ORDER BY family'),
  ]);
  return json({ status: 'ok', games: games.results[0].total, rules: games.results[0].rules,
    play: games.results[0].play, lessons: lessons.results[0].total,
    release: release.results[0]?.release, families: families.results.map((row) => row.family) });
}

export async function serveCardGames(request, db, path) {
  if (path === 'api/references/intake' && request.method === 'POST') return publishReferences(request,db);
  if (request.method !== 'GET') return json({ error: 'Use GET' }, 405);
  const url = new URL(request.url);
  if (Object.hasOwn(assets, path)) {
    const [mime, body] = assets[path];
    return response(body, mime);
  }
  if (!db) return json({ error: 'Card catalog temporarily unavailable' }, 503);
  try {
    if (path === 'api/health') return await info(db);
    if (path === 'api/games') return await listGames(url, db);
    if (path === 'api/references/summary') return json(await researchSummary(db));
    if (path === 'api/references/engine-specs') return json({ specs:await engineSpecs(db) });
    if (path === 'api/references') {
      const result = await listResearch(db,url.searchParams);
      return result ? json(result) : json({error:'Unknown reference source'},400);
    }
    if (path === 'api/lessons') {
      const { results } = await db.prepare('SELECT id,level,title,body,game_id FROM card_lessons ORDER BY sequence').all();
      return json({ lessons: results.map(({ body, ...row }) => ({ ...row, ...JSON.parse(body) })) });
    }
    const detail = /^api\/games\/([a-z0-9-]{1,90})$/.exec(path);
    if (detail) {
      const row = await db.prepare('SELECT ' + columns + ' FROM card_games WHERE id = ?').bind(detail[1]).first();
      if (row) return json({ ...fullRecord(row),researchReferences:await researchForGame(db,row.id) });
    }
    return json({ error: 'Not found' }, 404);
  } catch (error) {
    console.error(JSON.stringify({ component: 'academy-card-games', path, reason: error.name }));
    return json({ error: 'Card catalog temporarily unavailable' }, 503);
  }
}

export default function withCardGames(academy) {
  return {
    ...academy,
    async fetch(request, env, ctx) {
      const path = new URL(request.url).pathname;
      const relative = path.replace(/^\/tabor-academy(?=\/|$)/, '') || '/';
      if (relative === '/card-games') return Response.redirect(new URL(route, request.url), 308);
      if (relative.startsWith('/card-games/')) return serveCardGames(request, env.CARD_GAMES_DB, relative.slice(12));
      const original = await academy.fetch(request, env, ctx);
      if (request.method === 'GET' && ['/', '/map', '/map/'].includes(relative) && original.ok &&
        original.headers.get('content-type')?.includes('text/html') && typeof HTMLRewriter !== 'undefined') {
        return new HTMLRewriter().on('main h1', {
          element(el) {
            el.after('<p><a href="/tabor-academy/card-games/">Card Games Library</a></p>', { html: true });
          },
        }).transform(original);
      }
      return original;
    },
  };
}

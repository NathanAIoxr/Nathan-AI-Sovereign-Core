import legacy from './legacy.mjs';
import { HashRequestError, hashInput, verifyHash } from './hash.mjs';
import { registryPage, browserScript, styleSheet } from './page.mjs';

const scopes = new Map([
  ['native', ['NATIVE_COIN_ONLY']],
  ['connected', ['CONNECTED_NATIVE']],
  ['historical', ['HISTORICAL_NATIVE']],
  ['review', ['EXCLUDED_TOKEN', 'REVIEW_REQUIRED']],
  ['design', ['NATHAN_DESIGN']],
  ['symbols', ['GLYPH_REFERENCE', 'NATHAN_DESIGN']],
  ['all', []],
]);
const groups = ['A-Z', 'NUMBERS', 'SYMBOLS', 'NATHAN_AI_CORE', 'MATRIX21'];
const bountyRoutes = new Set(['bounties', 'bounties/work', 'bounties/intake', 'bounties/stats']);
const registryRoutes = new Set(['/registry', '/registry.js', '/registry.css', '/coins/sovereign',
  '/coins/sovereign/summary', '/verify-hash']);
const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};
const json = (value, status = 200, additionalHeaders = {}) => Response.json(value, {
  status,
  headers: { ...headers, 'access-control-allow-origin': '*', ...additionalHeaders },
});

function file(body, type, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...headers,
      'content-type': type + '; charset=utf-8',
      'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    },
  });
}

export function filters(query) {
  const group = query.get('group');
  const scope = query.get('scope') ?? ({ MATRIX21: 'design', NATHAN_AI_CORE: 'design', SYMBOLS: 'symbols' })[group] ?? 'native';
  const q = (query.get('q') ?? '').trim();
  const letter = (query.get('letter') ?? '').toUpperCase();
  if (!scopes.has(scope) || (group !== null && !groups.includes(group)) ||
      (letter && !/^[A-Z]$/.test(letter)) || q.length > 120) {
    throw new HashRequestError('Choose a supported scope, group and letter, with search text of at most 120 characters.');
  }
  return { group, scope, q, letter };
}

async function readRegistry(db, { group, scope, q, letter }) {
  const classes = scopes.get(scope);
  const where = [];
  const values = [];
  if (classes.length) {
    where.push('asset_class IN (' + classes.map(() => '?').join(', ') + ')');
    values.push(...classes);
  }
  if (group || scope === 'symbols') {
    where.push('index_group = ?');
    values.push(group ?? 'SYMBOLS');
  }
  if (letter) {
    where.push("index_group = 'A-Z' AND substr(upper(symbol), 1, 1) = ?");
    values.push(letter);
  }
  if (q) {
    where.push("instr(lower(symbol || ' ' || name || ' ' || notes || ' ' || coalesce(submitted, '') || ' ' || consensus_or_math || ' ' || id), lower(?)) > 0");
    values.push(q);
  }
  let sql = 'SELECT * FROM sovereign_coins';
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY CASE index_group WHEN \'A-Z\' THEN 1 WHEN \'NUMBERS\' THEN 2 WHEN \'SYMBOLS\' THEN 3 WHEN \'NATHAN_AI_CORE\' THEN 4 ELSE 5 END, position, symbol COLLATE NOCASE, id';
  const statement = db.prepare(sql);
  const { results } = await (values.length ? statement.bind(...values) : statement).all();
  return results.map((row) => ({ ...row, submitted_seed: row.submitted_seed ? JSON.parse(row.submitted_seed) : null }));
}

async function forwardBounties(url, env, tail) {
  const target = 'https://tabor-bridge.nathantaboract.workers.dev/global-bounties/';
  const route = tail === 'bounties' ? 'bounties' : tail.slice('bounties/'.length);
  const response = await env.BOUNTIES.fetch(target + route + url.search);
  return new Response(response.body, {
    status: response.status,
    headers: { ...headers, 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const isBounty = path.startsWith('/coins/sovereign/') && bountyRoutes.has(path.slice('/coins/sovereign/'.length));
    if (!registryRoutes.has(path) && !isBounty) return legacy.fetch(request, env);
    const method = path === '/verify-hash' ? 'POST' : 'GET';
    const incomingMethod = request.method;
    if (incomingMethod === 'OPTIONS' && method === 'POST') {
      return new Response(null, { status: 204, headers: {
        ...headers, 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST',
        'access-control-allow-headers': 'content-type',
      } });
    }
    if (incomingMethod !== method) return json({ error: 'Method not allowed.' }, 405, { allow: method });
    try {
      if (path === '/verify-hash') return json(await verifyHash(await hashInput(request)));
      if (path === '/registry.css') return file(styleSheet, 'text/css');
      if (path === '/registry.js') return file(browserScript, 'text/javascript');
      if (isBounty) return await forwardBounties(url, env, path.slice('/coins/sovereign/'.length));
      if (path === '/coins/sovereign/summary') {
        const { results } = await env.DB.prepare(
          'SELECT index_group, asset_class, count(*) AS count FROM sovereign_coins GROUP BY index_group, asset_class ORDER BY index_group, asset_class',
        ).all();
        return json({
          count: results.reduce((total, row) => total + row.count, 0),
          groups: results,
          archives: {
            historical_catalog: '/coins',
            ledger_slots: 'https://nathan-ai-crypto-64.nathantaboract.workers.dev/api/restoration',
          },
          bounties: {
            catalog: '/coins/sovereign/bounties',
            stats: '/coins/sovereign/bounties/stats',
            civic_work: '/coins/sovereign/bounties/work',
            prize_intake: '/coins/sovereign/bounties/intake',
            submitted_total: 341,
            submitted_total_status: 'source total unresolved',
          },
        });
      }
      const selection = filters(url.searchParams);
      const coins = await readRegistry(env.DB, selection);
      if (path === '/registry') return file(registryPage(selection, coins), 'text/html');
      return json({ ...selection, count: coins.length, coins });
    } catch (error) {
      if (error instanceof HashRequestError) return json({ error: error.message }, error.status);
      return json({ error: 'Registry service temporarily unavailable.' }, 503);
    }
  },
};

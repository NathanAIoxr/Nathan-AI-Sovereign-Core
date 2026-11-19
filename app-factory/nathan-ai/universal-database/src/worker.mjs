import page from './page.html';
import client from './client.mjs';
import game from './game.mjs';

export async function readBoard(db) {
  const [dimensions, links, beacons, sectors] = await db.batch([
    db.prepare('SELECT * FROM dimension ORDER BY cycle_order'),
    db.prepare('SELECT * FROM dimension_link ORDER BY source, direction'),
    db.prepare('SELECT * FROM beacon ORDER BY code, sector'),
    db.prepare('SELECT COUNT(*) AS total FROM sector')
  ]);
  return { dimensions: dimensions.results, links: links.results, beacons: beacons.results, sectors: sectors.results[0].total };
}

function asset(body, type) {
  return new Response(body, { headers: {
    'Content-Type': type + '; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  } });
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
    const path = new URL(request.url).pathname;
    try {
      switch (path) {
        case '/':
        case '/index.html': return asset(page, 'text/html');
        case '/client.mjs': return asset(client, 'application/javascript');
        case '/game.mjs': return asset(game, 'application/javascript');
        case '/board.json': return Response.json(await readBoard(env.DB_D1));
        case '/api/roots': {
          const [origin, structure, routes] = await Promise.all([
            env.DB_D0.prepare('SELECT * FROM sovereign_root').first(),
            env.DB_D1.prepare('SELECT * FROM sovereign_root').first(),
            env.DB_D0.prepare('SELECT * FROM root_route ORDER BY box_id').all()
          ]);
          return Response.json({ origin, structure, routes: routes.results });
        }
        default: return new Response('Not found', { status: 404 });
      }
    } catch (error) {
      console.error(error);
      return Response.json({ error: 'Database unavailable' }, { status: 503 });
    }
  }
};

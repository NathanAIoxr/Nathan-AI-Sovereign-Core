const paths = [
  ['website-core', 'Website Core'],
  ['book-series', 'Book Series'],
  ['apps', 'Apps'],
  ['games', 'Games'],
];

export const stagingPrefix = '/tabor-sites/sovereign-staging';

export async function stagingPreview(request, env, respond) {
  const url = new URL(request.url);
  if (url.origin !== 'https://unified-operations-cockpit.nathantaboract.workers.dev' ||
      !(url.pathname === stagingPrefix || url.pathname.startsWith(stagingPrefix + '/'))) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return respond(request, 'Method not allowed', 405, { Allow: 'GET, HEAD' });

  const page = url.pathname.slice(stagingPrefix.length).replace(/\/$/, '');
  if (page === '/health') {
    const row = await env.ZONES.prepare(
      "SELECT COUNT(*) AS project_count FROM zones_registry WHERE project_id IN ('sovereign-website-core','sovereign-book-series','sovereign-apps','sovereign-games')"
    ).first();
    await env.ZONES.prepare('SELECT sequence FROM provenance_ledger LIMIT 1').first();
    const result = { service: 'sovereign-staging', status: row.project_count === 4 ? 'ok' : 'incomplete', projects: row.project_count };
    return respond(request, JSON.stringify(result), row.project_count === 4 ? 200 : 503, { 'Content-Type': 'application/json' });
  }

  const project = paths.find(([slug]) => '/' + slug === page);
  if (page && !project) return respond(request, 'Not found', 404);
  const title = project?.[1] ?? 'Tabor Sovereign Staging';
  const links = paths.map(([slug, label]) => '<li><a href="' + stagingPrefix + '/' + slug + '">' + label + '</a></li>').join('');
  const navigation = project ? '<p><a href="' + stagingPrefix + '">All staging projects</a></p>' : '<ul>' + links + '</ul>';
  const markup = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + title + '</title><style>body{margin:10vh auto;padding:1.5rem;max-width:38rem;background:#182328;color:#f2f7f6;font:1.1rem/1.55 system-ui}a{color:#a8eae0}h1{line-height:1.15}</style>' +
    '<main><h1>' + title + '</h1><p>Staging · Holding</p>' + navigation + '</main></html>';
  return respond(request, markup, 200, { 'Content-Type': 'text/html; charset=utf-8' });
}

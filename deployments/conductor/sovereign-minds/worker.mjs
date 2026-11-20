import { mindIds, seedMind, states } from './seeds.mjs';
import { renderMind } from './lasso.mjs';

const root = '/tabor-sites/';
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const entry = id => ({
  id, name: states[id][0], path: root + 'mind-' + id + '/api/profile', report: root + 'mind-' + id + '/report.md'
});
const atlas = 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/nathan-ai/personal-intelligence/minds/mind-of-minds/catalog.json';

function catalogPage() {
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sovereign MINDs · Nathan AI</title><style>
  :root{color-scheme:light dark}body{max-width:46rem;margin:3rem auto;padding:0 1.2rem;font:1rem/1.65 system-ui,sans-serif}
  h1{font-size:clamp(2.5rem,8vw,4.5rem);line-height:1.05;margin:.35rem 0 1rem}
  ul{padding:0;list-style:none}li{padding:.65rem 0;border-bottom:1px solid GrayText}a{margin-right:.75rem}
  </style><main><p>Nathan AI · Conductor</p><h1>Sovereign MINDs</h1>
  <p>Open each MIND’s source ledger, body and plane mappings, and evidence status.</p>
  <ul>${mindIds.map(id => {
    const row = entry(id);
    return `<li><strong>${row.name}</strong> · <a href="${row.report}">Source ledger</a><a href="${row.path}">JSON</a></li>`;
  }).join('')}</ul><p><a href="${atlas}">Mind of Minds source catalog</a><a href="/tabor-sites/conductor">The Conductor</a></p></main></html>`;
}

export default {
  async fetch(request, env) {
    const id = env.MIND_ID;
    const index = id === 'catalog';
    const mount = root + (index ? 'sovereign-minds' : 'mind-' + id);
    const pathname = new URL(request.url).pathname;
    const path = pathname === mount ? '/' : pathname.startsWith(mount + '/') ? pathname.slice(mount.length) : pathname;
    const head = request.method === 'HEAD';
    const reply = (value, status = 200) => head
      ? new Response(null, { status, headers: { ...headers, 'Content-Type': 'application/json' } })
      : Response.json(value, { status, headers });
    if (request.method !== 'GET' && !head) return new Response(null, { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });

    if (index) {
      if (path === '/healthz') return reply({ ready: true, service: 'sovereign-minds', release: env.RELEASE_SHA, catalogCount: mindIds.length });
      if (path === '/api/catalog') return reply({ title: 'Sovereign MINDs', release: env.RELEASE_SHA, minds: mindIds.map(entry), sourceCatalog: atlas });
      if (path === '/') return new Response(head ? null : catalogPage(), { headers: {
        ...headers, 'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
      } });
    } else if (mindIds.includes(id) && ['/', '/healthz', '/api/profile', '/report.md'].includes(path)) {
      const mind = await seedMind(id);
      if (path === '/healthz') return reply({ ready: true, mindId: id, digest: mind.digest, release: env.RELEASE_SHA });
      if (path === '/report.md') return new Response(head ? null : renderMind(mind), { headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' } });
      return reply(mind);
    }
    return reply({ error: 'not_found' }, 404);
  }
};

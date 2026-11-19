import { archive, assets, collections } from './assets.mjs';
import { anchors, createViews } from './views.mjs';

const index = new Map(archive.map(entry => [entry.id, entry]));
const viewBodies = new Map(collections.map(collection => {
  const entries = collection.projects.map(id => index.get(id));
  return [collection.id, JSON.stringify({ anchors, entries, views: createViews(entries) })];
}));
const securityHeaders = {
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
};
const routes = new Map([
  ['/', ['text/html', assets['page.html']]],
  ['/styles.css', ['text/css', assets['styles.css']]],
  ['/browser.mjs', ['text/javascript', assets['browser.mjs']]],
  ['/local-archive.mjs', ['text/javascript', assets['local-archive.mjs']]],
  ['/views.mjs', ['text/javascript', assets['views.mjs']]],
  ['/api/collections', ['application/json', JSON.stringify({ anchors, entries: archive, collections })]],
]);

export default {
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { ...securityHeaders, allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const views = url.pathname === '/api/views' && viewBodies.get(url.searchParams.get('collection') ?? 'originals');
    const route = views ? ['application/json', views] : routes.get(url.pathname);
    if (!route) return new Response(null, { status: 404, headers: securityHeaders });
    const [type, body] = route;
    return new Response(request.method === 'HEAD' ? null : body, {
      headers: {
        ...securityHeaders,
        'cache-control': 'no-cache',
        'content-type': type + '; charset=utf-8',
      },
    });
  },
};

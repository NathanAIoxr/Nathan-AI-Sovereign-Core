import { archive, assets } from './assets.mjs';
import { anchors, createViews } from './views.mjs';

const payload = { anchors, entries: archive, views: createViews(archive) };
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
  ['/api/views', ['application/json', JSON.stringify(payload)]],
]);

export default {
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { ...securityHeaders, allow: 'GET, HEAD' } });
    }
    const route = routes.get(new URL(request.url).pathname);
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

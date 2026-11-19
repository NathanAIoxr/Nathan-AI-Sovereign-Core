import { readFile } from 'node:fs/promises';

const types = {
  'index.html': 'text/html',
  'recovery.html': 'text/html',
  'style.css': 'text/css',
  'timeline.mjs': 'text/javascript',
  'scenario.mjs': 'text/javascript',
  'app.mjs': 'text/javascript'
};
const assets = {};
for (const [name, type] of Object.entries(types)) {
  assets[name] = { type, body: await readFile(new URL(name, import.meta.url), 'utf8') };
}

const runtime = `
const prefix = '/tabor-apps/scrambler';
const headers = {
  'Cache-Control': 'no-cache',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'Permissions-Policy': 'geolocation=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff'
};
export default {
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === prefix) return Response.redirect(new URL(prefix + '/' + url.search, url), 308);
    const method = request.method;
    if (method !== 'GET' && method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
    }
    const path = url.pathname.startsWith(prefix + '/') ? url.pathname.slice(prefix.length) : url.pathname;
    const name = path === '/' ? 'index.html' : path.slice(1);
    if (!Object.hasOwn(assets, name)) {
      return new Response(method === 'HEAD' ? null : 'Not found', { status: 404, headers });
    }
    const asset = assets[name];
    return new Response(method === 'HEAD' ? null : asset.body, {
      headers: { ...headers, 'Content-Type': asset.type + '; charset=utf-8' }
    });
  }
};
`;
process.stdout.write('const assets = ' + JSON.stringify(assets) + ';\n' + runtime);

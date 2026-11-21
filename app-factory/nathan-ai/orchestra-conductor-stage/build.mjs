import { readFile, writeFile } from 'node:fs/promises';

const files = {
  '/index.html': 'text/html; charset=utf-8',
  '/stage.css': 'text/css; charset=utf-8',
  '/stage.mjs': 'text/javascript; charset=utf-8',
  '/score.mjs': 'text/javascript; charset=utf-8',
};
const contents = await Promise.all(Object.entries(files).map(async ([path, type]) => [
  path, [type, await readFile(new URL('./web' + path, import.meta.url), 'utf8')],
]));
const worker = `const assets = ${JSON.stringify(Object.fromEntries(contents))};
const security = {
  'cache-control': 'no-cache',
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; media-src blob:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};
export default {
  fetch(request) {
    const { pathname } = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { ...security, Allow: 'GET, HEAD' } });
    }
    const entry = assets[pathname === '/' ? '/index.html' : pathname];
    if (!Array.isArray(entry)) return new Response(null, { status: 404, headers: security });
    return new Response(request.method === 'HEAD' ? null : entry[1], {
      headers: { ...security, 'content-type': entry[0] },
    });
  },
};`;
await writeFile(process.argv[2] ?? 'orchestra-conductor-worker.mjs', worker + '\n');

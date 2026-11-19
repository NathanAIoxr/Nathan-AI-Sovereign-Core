import { mkdir, readFile, writeFile } from 'node:fs/promises';

const types = {
  '/': ['index.html.in', 'text/html; charset=utf-8'],
  '/zones/': ['zones/index.html.in', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8']
};
const assets = Object.fromEntries(await Promise.all(Object.entries(types).map(async ([path, [file, type]]) =>
  [path, { type, body: await readFile(new URL('../public/' + file, import.meta.url), 'utf8') }]
)));
const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const bundle = source.replace('export default {', 'const app = {') + `
const assets = ${JSON.stringify(assets)};
export default {
  fetch(request, env) {
    const ASSETS = {
      fetch(assetRequest) {
        const path = new URL(assetRequest.url).pathname;
        const asset = assets[path === '/zones' ? '/zones/' : path];
        if (!asset) return new Response('Not found', { status: 404 });
        return new Response(assetRequest.method === 'HEAD' ? null : asset.body, {
          headers: { 'Content-Type': asset.type, 'Cache-Control': 'public, max-age=60' }
        });
      }
    };
    return app.fetch(request, { API_KEY: env.API_KEY, READ_API_KEY: env.READ_API_KEY, DB: env.DB, ASSETS });
  }
};
`;
const out = new URL('../dist-platform/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('worker.js', out), bundle);

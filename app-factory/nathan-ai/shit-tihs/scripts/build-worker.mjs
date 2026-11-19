import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const publicDir = new URL('../public/', import.meta.url);
const buildDir = new URL('../.build/', import.meta.url);
const mimeTypes = new Map([
  ['html', 'text/html; charset=utf-8'],
  ['css', 'text/css; charset=utf-8'],
  ['js', 'text/javascript; charset=utf-8'],
  ['mjs', 'text/javascript; charset=utf-8'],
  ['webmanifest', 'application/manifest+json'],
  ['png', 'image/png'],
  ['webp', 'image/webp']
]);

const names = (await readdir(publicDir)).sort();
const assets = {};
for (const name of names) {
  const extension = name.split('.').at(-1);
  const mime = mimeTypes.get(extension);
  if (!mime) throw new Error(`Unsupported public asset: ${name}`);
  const binary = mime.startsWith('image/');
  const bytes = await readFile(new URL(name, publicDir));
  assets[`/${name}`] = [mime, binary, bytes.toString(binary ? 'base64' : 'utf8')];
}

const worker = `const assets = ${JSON.stringify(assets)};

export default {
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const path = new URL(request.url).pathname;
    const key = path === '/' ? '/index.html' : path;
    if (!Object.hasOwn(assets, key)) return new Response('Not found', { status: 404 });
    const [mime, binary, data] = assets[key];
    const body = request.method === 'HEAD' ? null : binary
      ? Uint8Array.from(atob(data), character => character.charCodeAt(0))
      : data;
    return new Response(body, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'no-cache',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }
};
`;
await mkdir(buildDir, { recursive: true });
await writeFile(new URL('worker.mjs', buildDir), worker);

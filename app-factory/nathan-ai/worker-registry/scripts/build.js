import { mkdir, readFile, writeFile } from 'node:fs/promises';
const dir = new URL('../', import.meta.url);
const sources = {
  '/': ['index.html.in', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8']
};
const assets = Object.fromEntries(await Promise.all(Object.entries(sources).map(async ([path, [file, type]]) =>
  [path, { type, body: await readFile(new URL('public/' + file, dir), 'utf8') }]
)));
const script = await readFile(new URL('worker.js', dir), 'utf8');
await mkdir(new URL('dist/', dir), { recursive: true });
await writeFile(new URL('dist/worker.js', dir), 'const assets = ' + JSON.stringify(assets) + ';\n' + script);

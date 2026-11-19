import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (name, encoding = 'utf8') => readFile(join(root, 'site', name), encoding);
const versions = {
  '/': ['Simulator', 'arena', 'Digital Flubber.', 'Fling a soft body, dial up the bounce, and build an arena with balls and Flubber walls.'],
  '/game': ['Arcade', 'arena', 'Flubber Arcade.', 'Hit three targets in order. Aim your Flubber and clear the course against the clock.'],
  '/learn': ['Learn', 'learn'],
  '/zones': ['Zones', 'zones'],
  '/sos': ['SOS', 'sos']
};
const files = {};
const layout = await read('layout.html');
function render(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]);
}
for (const [route, [title, template, heading, summary]] of Object.entries(versions)) {
  const page = route.slice(1) || 'simulator';
  const body = render(await read(template + '.html'), { heading, summary });
  files[route] = { type: 'text/html; charset=utf-8', value: render(layout, { page, title, body }) };
}
const fileTypes = {
  'style.css': 'text/css; charset=utf-8',
  'app.mjs': 'text/javascript; charset=utf-8',
  'physics.mjs': 'text/javascript; charset=utf-8',
  'policy.mjs': 'text/javascript; charset=utf-8',
  'manifest.webmanifest': 'application/manifest+json',
  'icon-192.png': 'image/png',
  'icon-512.png': 'image/png'
};
for (const [name, type] of Object.entries(fileTypes)) {
  const binary = type === 'image/png';
  files['/' + name] = { type, binary, value: await read(name, binary ? 'base64' : 'utf8') };
}
const sw = await read('sw.js');
const version = createHash('sha256').update(JSON.stringify(files)).update(sw).digest('hex').slice(0, 14);
files['/sw.js'] = { type: 'text/javascript; charset=utf-8', value: render(sw, { version }) };
await mkdir(join(root, 'dist'), { recursive: true });
await writeFile(join(root, 'dist', 'assets.mjs'), 'export const files = ' + JSON.stringify(files) + ';\n');
await writeFile(join(root, 'dist', 'policy.mjs'), await read('policy.mjs'));
for (const name of ['main', 'slubber', 'sos']) {
  await writeFile(join(root, 'dist', name + '.mjs'), await readFile(join(root, 'edge', name + '.mjs')));
}

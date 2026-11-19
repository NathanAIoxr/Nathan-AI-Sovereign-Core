import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve(process.argv[2] ?? 'dist-codex-crosshairs');
const source = name => new URL(name, import.meta.url);
const read = name => readFile(source(name), 'utf8');
const catalog = JSON.parse(await read('../codex-release/manifest.json'));
const numbered = catalog.filter(project => /^codex-0[0-9]$/.test(project.id)).sort((a, b) => a.id.localeCompare(b.id));
if (numbered.length !== 10 || new Set(numbered.map(project => project.id)).size !== 10) {
  throw new Error('The Pocket Codex manifest must supply each numbered source from 0 through 9.');
}
const archive = await Promise.all(numbered.map(async project => {
  const record = JSON.parse(await read('../codex-release/projects/' + project.id + '/app.json'));
  if (record.id !== project.id || typeof record.summary !== 'string') {
    throw new Error('Invalid public Codex source record: ' + project.id);
  }
  return {
    id: project.id,
    number: Number(project.id.slice(-2)),
    title: project.title,
    summary: record.summary,
    path: '/work/' + project.id + '/',
  };
}));
const assets = Object.fromEntries(await Promise.all(
  ['page.html', 'styles.css', 'browser.mjs', 'local-archive.mjs'].map(async name => [name, await read(name)]),
));
await mkdir(output, { recursive: true });
await Promise.all([
  ...['worker.mjs', 'views.mjs'].map(name => copyFile(source(name), resolve(output, name))),
  writeFile(resolve(output, 'assets.mjs'), 'export const archive = ' + JSON.stringify(archive) +
    ';\nexport const assets = ' + JSON.stringify(assets) + ';\n'),
]);

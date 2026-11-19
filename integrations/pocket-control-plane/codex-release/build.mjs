import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const source = relative => readFile(new URL(relative, import.meta.url), 'utf8');
const manifest = JSON.parse(await source('./manifest.json'));
const appIds = new Set();
const workerNames = new Set();
const projects = [];
for (const row of manifest) {
  if (!/^[a-z0-9-]+$/.test(row.id)) throw new Error('Invalid project ID');
  const app = JSON.parse(await source('./projects/' + row.id + '/app.json'));
  if (app.id !== row.id || app.worker !== row.worker || app.group !== row.group || app.title !== row.title ||
      app.worker !== 'tabor-recovered-' + app.id || appIds.has(app.id) || workerNames.has(app.worker)) {
    throw new Error('Manifest mismatch for ' + row.id);
  }
  projects.push(app);
  appIds.add(app.id);
  workerNames.add(app.worker);
}
const station = await source('./station.mjs');
const identity = await source('./github-identity.mjs');
const pocket = (await source('./pocket.mjs')).split('\n').filter(line => !line.startsWith('import ')).join('\n');
const target = resolve(process.argv[2] ?? 'dist-pocket-codex');
await mkdir(target, { recursive: true });
for (const app of projects) {
  await writeFile(resolve(target, app.worker + '.mjs'), station + '\nexport default createProject(' + JSON.stringify(app) + ');\n');
}
const publicProjects = projects.map(({ question, ...app }) => app);
await writeFile(resolve(target, 'nathan-ai-pocket-codex.mjs'),
  [station, identity, pocket, 'export default createPocket(' + JSON.stringify(publicProjects) + ');'].join('\n'));
await writeFile(resolve(target, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Built ' + projects.length + ' standalone Worker modules and the Pocket Control directory.');

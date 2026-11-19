import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateCatalogOrder, orderedRelease } from './release-order.mjs';
const source = relative => readFile(new URL(relative, import.meta.url), 'utf8');
const manifest = JSON.parse(await source('./manifest.json'));
const standaloneApps = JSON.parse(await source('./standalone-apps.json'));
validateCatalogOrder([...manifest, ...standaloneApps]);
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
const order = (await source('./release-order.mjs')).replace(/^export /gm, '');
const edgeOperations = (await source('./edge-operations.mjs')).split('\n').filter(line => !line.startsWith('import ')).join('\n');
const pocket = (await source('./pocket.mjs')).split('\n').filter(line => !line.startsWith('import ')).join('\n');
const target = resolve(process.argv[2] ?? 'dist-pocket-codex');
await mkdir(target, { recursive: true });
for (const app of projects) {
  await writeFile(resolve(target, app.worker + '.mjs'), station + '\nexport default createProject(' + JSON.stringify(app) + ');\n');
}
for (const app of standaloneApps) {
  const expectedOrigin = app.id === 'taborpoolboys' ? 'https://pub-2df43f63514844ecbcd9f7da4de75d89.r2.dev' : 'https://' + app.id + '.pages.dev';
  if (!/^[a-z0-9-]+$/.test(app.id) || app.worker !== app.id + '-worker' || app.group !== 'standalone-apps' ||
      appIds.has(app.id) || workerNames.has(app.worker) || new URL(app.url).origin !== expectedOrigin) {
    throw new Error('Invalid standalone app ' + app.id);
  }
  appIds.add(app.id);
  workerNames.add(app.worker);
}
const publicProjects = projects.map(({ question, ...app }) => app);
await writeFile(resolve(target, 'nathan-ai-pocket-codex.mjs'),
  [station, identity, order, edgeOperations, pocket, 'export default createPocket(' + JSON.stringify(publicProjects) + ', ' + JSON.stringify(standaloneApps) + ');'].join('\n'));
await writeFile(resolve(target, 'manifest.json'), JSON.stringify([...manifest, ...standaloneApps], null, 2));
await writeFile(resolve(target, 'release-order.json'), JSON.stringify(orderedRelease([...manifest, ...standaloneApps]), null, 2));
console.log('Built ' + projects.length + ' standalone Worker modules and the Pocket Control directory.');

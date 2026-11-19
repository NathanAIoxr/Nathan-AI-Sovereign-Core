import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { orderedRelease, validateCatalogOrder } from '../codex-release/release-order.mjs';

const output = resolve(process.argv[2] ?? 'dist-codex-crosshairs');
const source = name => new URL(name, import.meta.url);
const read = name => readFile(source(name), 'utf8');
const readJson = async name => JSON.parse(await read(name));
const [manifest, standalone, evidence] = await Promise.all([
  readJson('../codex-release/manifest.json'),
  readJson('../codex-release/standalone-apps.json'),
  readJson('./recovery-evidence.json'),
]);
const projects = [...manifest, ...standalone];
validateCatalogOrder(projects);
const order = orderedRelease(projects);
const archive = await Promise.all(projects.map(async (project, index) => {
  const record = project.group === 'standalone-apps' ? project :
    await readJson('../codex-release/projects/' + project.id + '/app.json');
  if (record.id !== project.id || record.group !== project.group || typeof record.summary !== 'string') {
    throw new Error('Invalid public Codex source record: ' + project.id);
  }
  const original = order.crosshairs.sources.includes(project.id);
  const proof = Object.hasOwn(evidence, project.id) ? evidence[project.id] : undefined;
  if (proof && (project.group !== 'recovery' || typeof proof.label !== 'string' || typeof proof.note !== 'string' ||
      (proof.url && !/^https:\/\/github\.com\/NathanAIoxr\/Nathan-AI-Sovereign-Core\/blob\/[\da-f]{40}\//.test(proof.url)))) {
    throw new Error('Invalid recovery source for ' + project.id);
  }
  const number = original ? Number(project.id.slice(-2)) : undefined;
  return {
    id: project.id,
    group: project.group,
    ...(original ? { number } : {}),
    marker: original ? String(number) : project.id === 'codex-01-it' ? '1 IT' : String(index + 1),
    title: project.title,
    status: record.status,
    summary: record.summary,
    path: '/work/' + project.id + '/',
    ...(proof ? { evidence: proof } : {}),
  };
}));
const collections = [
  { id: 'originals', title: 'Codex 0–9', projects: order.crosshairs.sources },
  { id: 'all', title: 'All projects', projects: projects.map(project => project.id) },
  ...order.groups,
];
const assets = Object.fromEntries(await Promise.all(
  ['page.html', 'styles.css', 'browser.mjs', 'local-archive.mjs', 'views.mjs'].map(async name => [name, await read(name)]),
));
await mkdir(output, { recursive: true });
await Promise.all([
  ...['worker.mjs', 'views.mjs'].map(name => copyFile(source(name), resolve(output, name))),
  writeFile(resolve(output, 'assets.mjs'), 'export const archive = ' + JSON.stringify(archive) +
    ';\nexport const collections = ' + JSON.stringify(collections) +
    ';\nexport const assets = ' + JSON.stringify(assets) + ';\n'),
]);

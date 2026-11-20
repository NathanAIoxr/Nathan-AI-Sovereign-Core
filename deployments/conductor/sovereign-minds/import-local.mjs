import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildMind, renderMind } from './lasso.mjs';

const [manifestPath, format = 'json'] = process.argv.slice(2);
if (!manifestPath || !['json', 'markdown'].includes(format)) {
  console.error('Usage: node import-local.mjs reviewed-manifest.json [json|markdown]');
  process.exit(2);
}
try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const sources = await Promise.all(manifest.sources.map(async ({ file, ...source }) => ({
    ...source, bytes: await readFile(resolve(dirname(manifestPath), file))
  })));
  const mind = await buildMind({ ...manifest, sources });
  process.stdout.write(format === 'markdown' ? renderMind(mind) : JSON.stringify(mind, null, 2) + '\n');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

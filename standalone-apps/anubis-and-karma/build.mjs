import { readFile, mkdir, writeFile } from 'node:fs/promises';

const read = (name) => readFile(new URL(name, import.meta.url), 'utf8');
const files = {
  release: 'release.json',
  index: 'public/index.html',
  style: 'public/site.css',
  client: 'public/client.mjs',
  novella: 'public/the-last-weighing.txt',
};
const assets = Object.fromEntries(
  await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await read(path)])),
);

await mkdir(new URL('.generated/', import.meta.url), { recursive: true });
await writeFile(new URL('.generated/assets.mjs', import.meta.url), [
  'export const release = ' + JSON.stringify(JSON.parse(assets.release)) + ';',
  ...Object.entries(assets)
    .filter(([key]) => key !== 'release')
    .map(([key, content]) => 'export const ' + key + ' = ' + JSON.stringify(content) + ';'),
].join('\n') + '\n');

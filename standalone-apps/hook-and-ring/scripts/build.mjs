import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { routes } from './routes.mjs';

const here = path => new URL('../' + path, import.meta.url);
const modules = ['game/physics.mjs', 'game/yard-rules.mjs', 'server/worker.mjs'];
const source = await Promise.all(modules.map(path => readFile(here(path), 'utf8')));
const server = source.map(module => module.replace(/^import .*?;\n/gm, '').replace(/^export /gm, '')).join('\n');
const assets = await Promise.all(routes.map(async ([route, path, type, binary]) => [
  route,
  { type, content: await readFile(here('game/' + path), binary ? 'base64' : 'utf8'), binary },
]));
const script = server + '\nconst bundled = ' + JSON.stringify(assets) + ";\nconst assets = new Map(bundled.map(([path,{type,content,binary}]) => [path,{\n  type, bytes: () => binary ? Uint8Array.from(atob(content), c => c.charCodeAt(0)) : content\n}]));\nexport default createWorker(assets);\n";

await mkdir(here('dist/'), { recursive: true });
await writeFile(here('dist/worker.mjs'), script);

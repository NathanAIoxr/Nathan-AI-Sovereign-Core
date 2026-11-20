import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const types = {
  'index.html':'text/html; charset=utf-8',
  'style.css':'text/css; charset=utf-8',
  'app.js':'text/javascript; charset=utf-8',
  'play.js':'text/javascript; charset=utf-8',
};

export async function buildModules() {
  const assets = {};
  for (const [name, mime] of Object.entries(types)) {
    assets[name === 'index.html' ? '' : name] = [mime, await readFile(new URL('public/' + name,root),'utf8')];
  }
  return new Map([
    ['academy-card-games.mjs',await readFile(new URL('academy-card-games.mjs',root),'utf8')],
    ['card-assets.mjs','export const assets = ' + JSON.stringify(assets) + ';\n'],
  ]);
}

const entryModule = 'academy-entry.mjs';
const entryImport = 'import withCardGames from "./academy-card-games.mjs";\n';
const wrapped = '\\bexport default withCardGames\\(';
export function mount(original, additions) {
  const modules = new Map(original);
  const entry = modules.get(entryModule);
  if (!entry) throw new Error('The current Academy entry module is missing');
  if (!new RegExp(wrapped).test(entry)) {
    const match = /^export default (.+);\s*$/m.exec(entry);
    if (!match || /\bexport default\b/.test(entry.slice(0,match.index))) {
      throw new Error('The Academy entry layout needs review before mounting');
    }
    modules.set(entryModule,entryImport + entry.replace(match[0], 'export default withCardGames(' + match[1] + ');\n'));
  }
  for (const [name,source] of additions) modules.set(name,source);
  return modules;
}

if (process.argv.includes('--local-assets')) {
  const modules = await buildModules();
  await writeFile(new URL('card-assets.mjs',root), modules.get('card-assets.mjs'), 'utf8');
}

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = resolve(process.argv[2] ?? 'dist');
const requested = process.argv[3];
const read = path => readFile(resolve(root, path), 'utf8');
const [shell, style, common, manifest] = await Promise.all([
  read('layout.html'), read('theme.css'), read('common.js'), read('catalog.json')
]);
const catalog = JSON.parse(manifest);
const entries = requested ? catalog.filter(({ id }) => id === requested) : catalog;
if (requested && !entries.length) throw new Error('Unknown release: ' + requested);

async function write(path, content) {
  const target = resolve(output, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target + '.tmp', content);
  await rename(target + '.tmp', target);
}

function layout(title, view, script = '', nested = true) {
  const replacements = {
    TITLE: title, VIEW: view, STYLE: '<style>\n' + style + '</style>',
    SCRIPT: script ? '<script>\n"use strict";\n' + common + '\n' + script.replaceAll('</script', '<\\/script') + '</script>' : '',
    RELEASES: nested ? '../index.html' : 'index.html',
    GALLERY: nested ? '../../index.html' : '../index.html',
  };
  return shell.replace(/\{\{([A-Z]+)\}\}/g, (_, token) => replacements[token]);
}

await Promise.all(entries.map(async entry => {
  const [view, script] = await Promise.all([read(entry.id + '/view.html'), read(entry.id + '/app.js')]);
  const portable = layout('BOOBIES by Nathan Tabor · ' + entry.name, view, 'const releases = ' + JSON.stringify(catalog) + ';\n' + script);
  await write('releases/' + entry.id + '/index.html', portable);
}));

if (!requested) {
  const cards = catalog.map(({ id, name, title, description }) => `
    <article class="card">
      <p class="eyebrow">${name}</p><h2>${title}</h2>
      <p>${description}</p><a href="${id}/index.html">Open ${name} ↗</a>
    </article>`).join('');
  await write('releases/index.html', layout('BOOBIES by Nathan Tabor · Releases', `
    <h1>Releases</h1><p class="lede">Choose a BOOBIES release.</p>
    <div class="grid">${cards}</div>`, '', false));
}

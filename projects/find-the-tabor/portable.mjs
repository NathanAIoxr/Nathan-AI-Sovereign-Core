import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));
const projects = JSON.parse(readFileSync(join(here, 'projects.json'), 'utf8'));
const out = process.argv[2] ?? join(here, 'public');
for (const [id, current] of Object.entries(projects)) {
  const source = join(here, 'dist/pages', id);
  const files = readdirSync(source,{recursive:true,withFileTypes:true})
    .filter(entry => entry.isFile() && !entry.name.startsWith('_'));
  for (const file of files) {
    const within = posix.relative(source, join(file.parentPath, file.name));
    const local = join(out, id, within);
    const from = posix.dirname(id + '/' + within);
    const pathTo = target => posix.relative(from, target);
    let content = readFileSync(join(source, within), 'utf8');
    if (within.endsWith('.html')) {
      for (const [other, {pages}] of Object.entries(projects)) {
        content = content.replaceAll('https://' + pages + '.pages.dev', pathTo(other + '/index.html'));
      }
      content = content.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_match, attribute, path) => {
        const target = !path ? 'index.html' : path.startsWith('read/') ? path + '/index.html' : path;
        return `${attribute}="${pathTo(id + '/' + target)}"`;
      });
      content = content.replace('<form method="get">', `<form method="get" data-home="${pathTo(id + '/index.html')}" data-back="${pathTo(id + '/back/index.html')}">`);
    }
    mkdirSync(dirname(local), {recursive:true});
    writeFileSync(local, content);
  }
}

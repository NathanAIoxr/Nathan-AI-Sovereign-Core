import { readFileSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = fileURLToPath(new URL('.', import.meta.url));
const root = fileURLToPath(new URL('../../', import.meta.url));
const out = join(here, 'dist');
const read = name => readFileSync(join(here, name), 'utf8');
const json = name => JSON.parse(read(name));
const rows = json('research.json');
const catalog = json('works.json');
const sources = json('sources.json');
const projects = json('projects.json');
const css = read('style.css');
const base = 'https://nathantaboract.workers.dev';
const link = worker => base.replace('//', `//${worker}.`);
const db = 'ab07f843-9ad1-4c71-b04f-4260bb7a96a2';
const bookFiles = {
  'before-the-first-road': ['BEFORE THE FIRST ROAD', 'tss-01-before-the-first-road-draft.md'],
  'series-bible': ['THE TABOR SECRET SOCIETY · Series Bible', 'tss-series-bible-source.md']
};
const originals = Object.fromEntries(Object.entries(bookFiles).map(([id, [title, file]]) =>
  [id, [title, readFileSync(join(root, 'app-factory/one/library-mind/books', file), 'utf8')]]));

const generated = [];
for (const [id, details] of [...Object.entries(projects), ['checks', {worker:'tabor-research-checks'}]]) {
  const dir = join(out, id);
  mkdirSync(dir, { recursive: true });
  const type = id === 'checks' ? 'checks' : 'worker';
  const data = id === 'checks' ? {
    project:{id, ...details},
    sources:Object.entries(sources).filter(([id]) => !['hebrew','greek','builds','clouder'].includes(id)).map(([id, source]) => [id, source[1]])
  } : {
    project:{id, ...details},
    navigation:Object.entries(projects).map(([key, {worker, label}]) =>
      ({title:label, link:key === id ? '/' : link(worker), active:key === id})),
    records:(rows[id] ?? catalog[id]).map(([id,status,title,note,...links]) =>
      ({ id,status,title,note,links:links.map(source => {
        if (Array.isArray(source)) return source;
        if (!sources[source]) throw new Error(`Missing source '${source}'`);
        return sources[source];
      }) })),
    manuscripts:id === 'books' ? originals : {},
    css
  };
  const release = createHash('sha256').update(read(type + '.mjs')).update(JSON.stringify(data)).digest('hex').slice(0, 16);
  data.project.release = release;
  writeFileSync(join(dir, 'content.mjs'), Object.entries(data).map(([key,value]) =>
    `export const ${key} = ${JSON.stringify(value)};\n`).join(''));
  copyFileSync(join(here, type + '.mjs'), join(dir, 'index.mjs'));
  writeFileSync(join(dir, 'wrangler.json'), JSON.stringify({
    name:details.worker, main:'index.mjs', compatibility_date:'2026-11-19', workers_dev:true,
    ...(id === 'checks' ? {d1_databases:[{binding:'RESEARCH_DB',database_name:'tabor-research-checks-db',database_id:db}],triggers:{crons:['17 11 * * *']}} : {})
  }, null, 2));
  generated.push([id, details.worker, release]);
}
writeFileSync(join(out, 'releases.json'), JSON.stringify(generated, null, 2));

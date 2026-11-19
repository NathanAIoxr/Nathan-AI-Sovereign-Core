import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = dirname(fileURLToPath(import.meta.url));
const output = resolve(root, process.argv[2] || 'dist');
const repo = 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core';
const releaseRef = 'build/game-app-stations-20261119';
const unitPath = 'standalone-apps/game-app-stations';
const allowedStatuses = {
  'existing-launch': 'Existing launch',
  'source-available': 'Source available',
  'build-pending': 'Build pending',
};
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
})[char]);
const href = (value, label) => '<a href="' + escape(value) + '">' + escape(label) + '</a>';
const getText = path => readFile(path, 'utf8');

function validate(record, id) {
  if (record.id !== id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw Error('Invalid ID: ' + id);
  if (!record.title?.trim() || !Object.hasOwn(allowedStatuses, record.status)) throw Error('Invalid status or title: ' + id);
  if (record.station !== 'apps/' + id + '/index.html') throw Error('Invalid route: ' + id);
  if ((record.status === 'existing-launch') !== Boolean(record.launch)) throw Error('Inconsistent launch status: ' + id);
  if (record.status === 'source-available' && !record.source) throw Error('Missing source: ' + id);
  for (const link of [record.launch, record.source].filter(Boolean)) {
    const url = new URL(link);
    if (url.protocol !== 'https:' || url.username || url.password || url.hostname === 'chatgpt.com') {
      throw Error('Invalid public URL: ' + id);
    }
  }
}

function document(title, body) {
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>' +
    escape(title) + '</title><style>body{max-width:62rem;margin:3rem auto;padding:0 1.2rem;background:#f7f3eb;color:#1e2b25;font:17px/1.5 system-ui,sans-serif}h1{font:600 clamp(2.1rem,6vw,3.6rem)/1.1 Georgia,serif;margin:.35em 0}a{color:#075849;text-underline-offset:3px}nav{margin:1.5rem 0}nav a{display:inline-block;margin:0 1.2rem .45rem 0}li{margin:.5rem 0}input{font:inherit;width:min(100%,32rem);box-sizing:border-box;padding:.55rem;margin:.6rem 0 1rem}small{color:#465650}.entries li{padding:.45rem 0;border-bottom:1px solid #ddd5c5}.entries{padding-left:1.25em}a:focus-visible,input:focus-visible{outline:2px solid #075849;outline-offset:3px}</style><main>' +
    body + '</main></html>';
}

function station(record) {
  const links = [];
  if (record.launch) links.push(href(record.launch, 'Open original app'));
  if (record.source && record.source !== record.launch) links.push(href(record.source, 'View source'));
  links.push(href(repo + '/blob/' + releaseRef + '/' + unitPath + '/apps/' + record.id + '/app.json', 'GitHub manifest'));
  const notes = record.next_action ? '<p>' + escape(record.next_action) + '</p>' : '';
  return document(record.title, '<p><a href="../../index.html">All app stations</a></p><h1>' +
    escape(record.title) + '</h1><p>' + escape(allowedStatuses[record.status]) + '</p>' + notes +
    '<nav aria-label="App links">' + links.join(' ') + '</nav><p><small>' +
    escape(record.collections.join(' · ')) + '</small></p>');
}

const records = [];
for (const id of await readdir(resolve(root, 'apps'))) {
  const record = JSON.parse(await getText(resolve(root, 'apps', id, 'app.json')));
  validate(record, id);
  records.push(record);
}
records.sort((a,b)=>a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id, 'en'));
const entries = records.map(record => '<li data-name="' + escape([record.title,...record.aliases].join(' ')) +
  '">' + href(record.station, record.title) + ' <small>' + escape(allowedStatuses[record.status]) + '</small></li>');
const index = document('Nathan Tabor Game & App Stations',
  '<h1>Nathan Tabor Game &amp; App Stations</h1><p>' + records.length + ' independent station addresses</p>' +
  '<label for="search">Find an app</label><br><input id="search" type="search"><p id="result-count" role="status"></p>' +
  '<ul class="entries">' + entries.join('') + '</ul><script>const input=document.getElementById("search"),items=[...document.querySelectorAll("[data-name]")];input.addEventListener("input",()=>{const q=input.value.trim().toLowerCase();for(const item of items)item.hidden=!item.dataset.name.toLowerCase().includes(q);document.getElementById("result-count").textContent=items.filter(item=>!item.hidden).length+" stations";});</script>');
const files = new Map(records.map(record => [record.station, station(record)]));
files.set('index.html', index);
files.set('catalog.json', JSON.stringify({ schema:1, count:records.length, stations:records }) + '\n');
const hashes = {};
for (const [path, body] of files) {
  const target = resolve(output, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body);
  hashes[path] = createHash('sha256').update(body).digest('hex');
}
await writeFile(resolve(output, 'release.json'), JSON.stringify({schema:1, count:records.length, hashes}, null, 2)+'\n');
console.log('Built ' + records.length + ' app stations.');

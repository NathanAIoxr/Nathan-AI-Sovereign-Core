import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { routes } from '../../hook-and-ring/scripts/routes.mjs';

const output = new URL('../Generated/', import.meta.url);
const apps = new URL('../../', import.meta.url);
const arcadeRoot = new URL('hook-and-ring/', apps);
const sudokuRoot = new URL('game-app-stations/apps/nathan-ai-sudoku-master/', apps);
const scramblerRoot = new URL('scrambler/', apps);
const repo = new URL('../', apps);
const trackerRoot = new URL('app-factory/tabor-tracker-ball/public/', repo);

const offlinePaths = new Set(['/', '/index.html', '/yard-darts', '/arcade', '/chassis', '/training', '/grapple-it']);
const skippedPaths = new Set(['/competition', '/competition.css', '/competition-ui.mjs', '/event-results.mjs',
  '/ecosystem', '/ecosystem.css', '/ecosystem.mjs', '/ecosystem.json', '/sw.js', '/manifest.webmanifest']);

const textTypes = { html: 'text/html', css: 'text/css', mjs: 'text/javascript', json: 'application/json', svg: 'image/svg+xml' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function oneChange(text, pattern, replacement) {
  const result = text.replace(pattern, replacement);
  if (result === text) throw new Error('Expected app markup changed: ' + pattern);
  return result;
}

function arcadeText(path, html) {
  html = html.replace(/<a\b[^>]*href="\/(?:competition|ecosystem)(?:\?[^"]*)?"[^>]*>[\s\S]*?<\/a>/g, '')
    .replace(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>([\s\S]*?)<\/a>/g, '<span>$1</span>')
    .replace(/<link\b[^>]*rel="manifest"[^>]*>/g, '');
  if (path === '/' || path === '/index.html') {
    html = oneChange(html, /<option value="daily">[^<]*<\/option>/, '');
  }
  if (path === '/chassis') {
    html = oneChange(html, /<button id="copy-game"/, '<button hidden id="copy-game"');
  }
  if (path === '/yard-darts') {
    html = oneChange(html, /<button type="button" class="mode" id="daily"/, '<button hidden type="button" class="mode" id="daily"');
    html = oneChange(html, /<button class="btn" id="yard-board-open"/, '<button hidden class="btn" id="yard-board-open"');
    html = oneChange(html, /<details><summary>Planned U\.S\. storefront pricing<\/summary>[\s\S]*?<\/details>/, '');
    html = oneChange(html, /<details><summary>Planned online play and hosting<\/summary>[\s\S]*?<\/details>/, '');
    html = oneChange(html, ' and 75 for your first verified Daily Tournament score each day', '');
  }
  return html;
}

const first = [
  { id: 'hook', title: 'Hook & Ring', group: 'Featured', path: '/' },
  { id: 'yard-darts', title: 'Yard Darts', group: 'Featured', path: '/yard-darts' },
  { id: 'arcade', title: 'Toss & Target', group: 'Featured', path: '/arcade' },
  { id: 'training', title: 'Toss Lab', group: 'Featured', path: '/training' },
  { id: 'grapple', title: 'Grapple It', group: 'Featured', path: '/grapple-it' }
];

async function packageApp(app, title, entries, resources) {
  const target = new URL(app + '/', output);
  const web = new URL('Web/', target);
  const routeMap = {};
  await rm(web, { recursive: true, force: true });
  await mkdir(new URL('assets/', web), { recursive: true });

  for (const [path, type, body] of resources) {
    if (!path.startsWith('/') || path.includes('?') || routeMap[path]) throw new Error('Invalid route ' + path);
    const file = 'assets/' + hash(path).slice(0, 20);
    routeMap[path] = { file, type: type.split(';')[0], bytes: body.length, sha256: hash(body) };
    await writeFile(new URL(file, web), body);
  }
  const ids = new Set();
  for (const entry of entries) {
    if (ids.has(entry.id) || !routeMap[entry.path.split('?')[0]]) throw new Error('Invalid shelf entry ' + entry.id);
    ids.add(entry.id);
  }
  await writeFile(new URL('shelf.json', web), JSON.stringify({ title, entries, routes: routeMap }, null, 2) + '\n');
  console.log(app + ': ' + entries.length + ' launch destinations, ' + resources.length + ' offline assets');
}

async function directBundle(root, names, edit = content => content) {
  return Promise.all(names.map(async name => {
    const bytes = await readFile(new URL(name, root));
    const type = textTypes[name.split('.').at(-1)];
    if (!type) throw new Error('Missing MIME type for ' + name);
    return ['/' + name, type, name.endsWith('.html') ? Buffer.from(edit(bytes.toString('utf8'))) : bytes];
  }));
}

function isolatedScrambler(html) {
  return html.replaceAll('href="./"', 'href="./index.html"')
    .replace(/<a href="\.\/recovery\.html"[^>]*>[^<]*<\/a>/g, '')
    .replace(/<a href="https:\/\/[^"]+">[^<]*<\/a>/g, '');
}

function removeWebNavigation(html) {
  return html.replace(/<aside id="nathan-record-notice"[^>]*>[\s\S]*?<\/aside>/, '')
    .replace(/<link\b[^>]*rel="manifest"[^>]*>/g, '');
}

await packageApp('Scrambler', 'Scrambler', [{ id: 'scrambler', title: 'Route editor', path: '/index.html', group: 'Tools' }],
  await directBundle(scramblerRoot, ['index.html', 'style.css', 'app.mjs', 'timeline.mjs', 'scenario.mjs'], isolatedScrambler));
await packageApp('Sudoku', 'Sudoku Master', [{ id: 'sudoku', title: 'Sudoku Master', path: '/play.html', group: 'Puzzles' }],
  await directBundle(sudokuRoot, ['play.html', 'sudoku.css', 'engine.mjs', 'sudoku.mjs'],
    html => oneChange(html, '<a href="./index.html">App station</a>', '')));

execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: fileURLToPath(arcadeRoot), stdio: 'inherit' });
const arcade = (await import(new URL('dist/worker.mjs', arcadeRoot).href)).default;
const packed = [];
for (const [path, , type] of routes) {
  if (skippedPaths.has(path)) continue;
  if (type.startsWith('text/html') && !offlinePaths.has(path)) throw new Error('Classify new page ' + path);
  const response = await arcade.fetch(new Request('https://local.invalid' + path), {});
  if (!response.ok) throw new Error('Cannot read Worker asset ' + path);
  const bytes = Buffer.from(await response.arrayBuffer());
  packed.push([path, type, type.startsWith('text/html') ? Buffer.from(arcadeText(path, bytes.toString('utf8'))) : bytes]);
}
const catalog = JSON.parse(packed.find(([path]) => path === '/game-plugins.json')[2]);
if (!['sword-practice', 'spear-quintain', 'cornhole', 'horseshoes', 'lawn-jarts'].every(id => catalog.some(game => game.id === id))) {
  throw new Error('Named arcade boards are missing');
}
const entries = catalog.map(({ id, name }) => ({ id, title: name,
  path: '/chassis?game=' + encodeURIComponent(id), group: 'Arcade boards' }));
const tracker = await directBundle(trackerRoot,
  ['index.html', 'style.css', 'icon.svg', 'app.mjs', 'track-baller.mjs', 'digit-input.mjs', 'games.mjs', 'render.mjs', 'catalog.json'],
  html => removeWebNavigation(html).replaceAll('href="./"', 'href="/tracker/index.html"')
    .replace('href="./?game=grip"', 'href="/tracker/index.html?game=grip"'));
const digit = tracker.find(([path]) => path === '/digit-input.mjs');
digit[2] = Buffer.from(oneChange(oneChange(digit[2].toString('utf8'),
  '../../../standalone-apps/tactilecore-sdk/src/engine.mjs', '/controllers/engine.mjs'),
  '../../../standalone-apps/hook-and-ring/game/input.mjs', '/input.mjs'));
packed.push(...tracker.map(([path, type, body]) => ['/tracker' + path, type, body]));
const trackerCatalog = JSON.parse(tracker.find(([path]) => path === '/catalog.json')[2]);
const trackerEntries = trackerCatalog.map(({ id, title }) => ({
  id: 'tracker-' + id, title: title + ' · Track Baller', path: '/tracker/index.html?game=' + encodeURIComponent(id), group: 'Track Baller'
}));
await packageApp('YardArcade', 'Tabor Yard Arcade', [...first, ...entries, ...trackerEntries], packed);

let voidHTML = removeWebNavigation(await readFile(new URL('app-factory/game-reference-lab/zero-void-lab.html', repo), 'utf8'))
  .replace(/<(?:script|link)\b[^>]*(?:src|href)="\.\.\/shared\/[^"]*"[^>]*>(?:<\/script>)?/g, '');
const voidScript = voidHTML.match(/<script>([\s\S]+?)<\/script>/);
if (!voidScript) throw new Error('Zero & Void Lab main script missing');
voidHTML = voidHTML.replace(voidScript[0], '<script src="/void.mjs" type="module"></script>');
const retroRoot = new URL('../Retro/', import.meta.url);
await packageApp('Retro', 'Tabor Retro Lab', [
  { id: 'void', title: 'Zero & Void Lab', group: '1970s mechanics', path: '/void.html' },
  { id: 'quiz', title: 'Category Challenge', group: '1980s mechanics', path: '/quiz.html' }
], [
  ['/void.html', 'text/html', Buffer.from(voidHTML)],
  ['/void.mjs', 'text/javascript', Buffer.from(voidScript[1])],
  ...await directBundle(retroRoot, ['quiz.html', 'quiz.css', 'quiz.mjs', 'quiz-engine.mjs'])
]);

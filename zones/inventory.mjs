import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const commit = git(['rev-parse', process.argv[2] ?? 'HEAD']).trim();
const files = git(['ls-tree', '-r', '--name-only', '-z', commit]).split('\0').filter(Boolean);
const canonical = files.filter(path => /^(app-factory|standalone-apps|integrations|publications|projects)\//.test(path)
  && !/(?:^|\/)(?:private(?:-[^/]+)?|recovered-source|node_modules)(?:\/|$)/i.test(path));
const candidatePaths = canonical.filter(path => /\/(?:app|book|series|website)\.json$/.test(path));
const appDirs = new Set(candidatePaths.map(path => path.slice(0, path.lastIndexOf('/'))));
const websites = canonical.filter(path => /^(?:app-factory\/sites|standalone-apps)\/[^/]+\/index\.html$/.test(path)
  && !appDirs.has(path.slice(0, path.lastIndexOf('/'))));

function keyFor(path) {
  const label = path.split('/').at(-2).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  return 'src-' + label + '-' + createHash('sha256').update(path).digest('hex').slice(0, 16);
}

const knownBase = 'app-factory/nathan-ai/boobies-by-nathan-tabor';
const releases = JSON.parse(readFileSync(new URL('./boobies.json', import.meta.url), 'utf8'));
const tracked = new Set(files);
const curated = releases.map(({ id, title, kind, path }) => {
  const source = knownBase + '/' + path;
  if (!tracked.has(source)) throw new Error('Source missing from tracked commit: ' + source);
  return { id, title, kind, path: source };
});
const candidates = [...candidatePaths, ...websites].map(path => ({
  id: keyFor(path),
  title: path.split('/').at(-2),
  kind: /\/(book|series)\.json$/.test(path) ? 'book' :
    /\/(website\.json|index\.html)$/.test(path) ? 'website' : path.includes('/games/') ? 'game' : 'app',
  path,
}));
const rows = [...curated, ...candidates];
if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('Duplicate project ID');
process.stdout.write(JSON.stringify({ commit, rows }));

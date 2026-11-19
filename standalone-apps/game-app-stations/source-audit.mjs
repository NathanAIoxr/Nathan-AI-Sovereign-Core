import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const stationRoot = dirname(fileURLToPath(import.meta.url))
const repository = 'NathanAIoxr/Nathan-AI-Sovereign-Core'
const manifestDirectory = 'standalone-apps/game-app-stations/'
const runnableFiles = new Set(['.html', '.js', '.mjs', '.ts', '.tsx', '.swift', '.py', '.gd', '.json'])
const ignoredTerms = new Set(['a', 'and', 'app', 'by', 'game', 'games', 'nathan', 'of', 'the', 'tm'])
const genericFiles = new Set(['package.json', 'tsconfig.json', 'package-lock.json'])
const stationId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function words(input) {
  return input.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

function sourcePath(source) {
  if (!source) return null
  const url = new URL(source)
  const prefix = '/' + repository + '/blob/main/'
  return url.hostname === 'github.com' && url.pathname.startsWith(prefix)
    ? decodeURIComponent(url.pathname.slice(prefix.length))
    : null
}

function candidateScore(path, terms) {
  const parts = path.split('/')
  const filename = parts.pop()
  const name = basename(filename, extname(filename))
  const groups = [...parts, name].map(part => new Set(words(part)))
  const score = Math.max(...groups.map(group =>
    terms.filter(term => group.has(term)).length / terms.length))
  if (score === 1) return score
  if (terms.length < 3 || score < 0.67) return 0
  return score
}

function sourceFiles(paths) {
  return paths.filter(path =>
    !path.startsWith(manifestDirectory) &&
    !path.startsWith('.github/') &&
    !genericFiles.has(basename(path)) &&
    /.(?:html|m?js|tsx?|swift|py|gd|json|md)$/i.test(path))
}

function resolution(app, paths, pathSet, drafts) {
  const terms = [...new Set(words(app.id).filter(word => !ignoredTerms.has(word)))]
  const declaredPath = sourcePath(app.source)
  const candidates = terms.length ? paths.flatMap(path => {
    const score = candidateScore(path, terms)
    if (!score || path === declaredPath) return []
    const kind = runnableFiles.has(extname(path).toLowerCase()) ? 'code-or-data' : 'documentation'
    return [{ path, score, kind }]
  }).sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, 6) : []
  const sourceState = declaredPath
    ? pathSet.has(declaredPath) ? 'declared-repository-path' : 'declared-path-missing'
    : app.source ? 'declared-url' : candidates.length ? 'repository-candidate' : 'source-recovery'
  return {
    app_id: app.id,
    lane: app.status === 'source-available' ? 'build-source' : 'recover-source',
    source_state: sourceState,
    source: app.source ?? null,
    candidates,
    draft_task: drafts.get(app.id) ?? null,
    next_action: candidates.length && !app.source
      ? 'Review the candidate for the exact app before using its code or assets.'
      : app.next_action
  }
}

function gitPaths() {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    .split('\0').filter(Boolean)
}

const [shard, shardCount] = process.argv.slice(2, 4).map(Number)
if (!Number.isSafeInteger(shard) || !Number.isSafeInteger(shardCount) ||
    shardCount < 1 || shard < 0 || shard >= shardCount) {
  throw new Error('Provide a zero-based shard index and positive shard count.')
}
const output = process.argv[4]
if (!output) throw new Error('Provide an output JSON path.')
const pathSnapshot = process.argv[5]
const tracked = pathSnapshot ? JSON.parse(readFileSync(pathSnapshot, 'utf8')) : gitPaths()
const files = sourceFiles(tracked)
const pathSet = new Set(files)
const drafts = new Map(JSON.parse(readFileSync(join(stationRoot, 'fast-build-lanes.json'), 'utf8'))
  .map(row => [row.app_id, row.key]))
const apps = readdirSync(join(stationRoot, 'apps')).sort()
  .map(id => {
    const app = JSON.parse(readFileSync(join(stationRoot, 'apps', id, 'app.json'), 'utf8'))
    if (id !== app.id || !stationId.test(id)) throw new Error('Unexpected station ID ' + id)
    return app
  })
  .filter(app => ['source-available', 'build-pending'].includes(app.status))
const results = apps.filter((_, index) => index % shardCount === shard)
  .map(app => resolution(app, files, pathSet, drafts))
writeFileSync(output, JSON.stringify({ shard, shardCount, expected: apps.length, results }, null, 2) + '\n')
console.log('Checked %d queued stations in shard %d/%d', results.length, shard + 1, shardCount)

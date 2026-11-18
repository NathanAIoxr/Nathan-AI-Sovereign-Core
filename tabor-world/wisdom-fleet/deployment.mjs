import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import modules from './modules.mjs'

const cohort = 'tabor-federation-v1'
const binding = 'REPLICAS'
const date = '2026-11-18'
const bucket = 'tabor-worker-catalog-replicas'
const core = 'tabor-wisdom-fleet'

function entryWorker(id) {
  return `const id = ${JSON.stringify(id)}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    if (path !== '/' && !['/worker','/bot','/agent'].includes(path)) {
      return Response.json({ error: 'Route not found.' }, { status: 404 })
    }
    return env.FLEET.fetch(new Request('https://fleet.internal/v1/modules/' + id + (path === '/' ? '' : path), request))
  },
}
`
}

async function local(name) {
  return readFile(new URL(name, import.meta.url), 'utf8')
}
const slots = JSON.parse(await local('slots.json'))
const files = Object.fromEntries(await Promise.all(['worker.mjs', 'modules.mjs', 'engine.mjs', 'deployment.mjs', 'README.md', 'slots.json'].map(async name => [name, await local(name)])))
const replicas = JSON.stringify({ schema: 'tabor.wisdom-fleet.release.v1', cohort, slots, modules, files })
const sha = createHash('sha256').update(replicas).digest('hex')
const gateway = {
  name: core,
  metadata: { main_module: 'worker.mjs', compatibility_date: date, bindings: [
    { name: binding, type: 'r2_bucket', bucket_name: bucket },
    { name: 'RELEASE_SHA', type: 'plain_text', text: sha },
  ] },
  files: Object.fromEntries(['worker.mjs','engine.mjs','modules.mjs'].map(name => [name, files[name]])),
}
const workers = modules.map(([id]) => {
  const slug = String(id).padStart(3, '0')
  return {
    name: 'tabor-wisdom-' + slug,
    metadata: {
      main_module: 'worker.mjs', compatibility_date: date,
      bindings: [{ name: 'FLEET', type: 'service', service: core }],
    },
    files: { 'worker.mjs': entryWorker(slug) },
  }
})
const out = resolve(process.argv[2] ?? 'build')
await mkdir(out, { recursive: true })
await Promise.all([
  writeFile(resolve(out, 'release.json'), replicas),
  writeFile(resolve(out, 'deploy.json'), JSON.stringify({ gateway, workers, sha, bucket, cohort, slots })),
])
console.log(JSON.stringify({ sha, bytes: Buffer.byteLength(replicas), slots: slots.length, workers: workers.length }))

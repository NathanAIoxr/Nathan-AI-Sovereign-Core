import modules from './modules.mjs'
import { describe, modes, parseInput, run } from './engine.mjs'

const byID = new Map(modules.map(m => [m[0], m]))
const cohort = 'tabor-federation-v1'
const source = 'https://tabor-supercomputer-federation.nathantaboract.workers.dev/v1/nodes'
const host = 'https://library-of-tabor-wisdom.nathantaboract.workers.dev'
const nonce = /^[a-f0-9]{64}$/
const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
}
const json = (data, status = 200, extra = {}) => Response.json(data, { status, headers: { ...headers, ...extra } })
const E = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const html = content => new Response(content, {
  headers: { ...headers, 'content-type': 'text/html; charset=utf-8',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" },
})
export const hash = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2,'0')).join('')
const prefix = env => `wisdom-fleet/${cohort}/${env.RELEASE_SHA}/`
const links = id => Object.fromEntries(modes.map(mode => [mode, `/v1/modules/${String(id).padStart(3,'0')}/${mode}`]))

export async function inputBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new TypeError('Use application/json.')
  }
  const reader = request.body?.getReader()
  if (!reader) throw new TypeError('Provide a JSON request body.')
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let raw = ''
  let bytesRead = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytesRead += value.byteLength
      if (bytesRead > 32768) {
        await reader.cancel()
        throw new RangeError('The request body must be 32 KiB or smaller.')
      }
      raw += decoder.decode(value, { stream: true })
    }
    raw += decoder.decode()
  } finally {
    reader.releaseLock()
  }
  return parseInput(JSON.parse(raw))
}

async function loadReplica(slot, env) {
  if (!nonce.test(env.RELEASE_SHA)) return { status: 503, error: 'Release is unconfigured.' }
  const object = await env.REPLICAS.get(prefix(env) + slot + '.json')
  if (!object) return { status: 404, error: 'No installed replica for this slot.' }
  const bytes = await object.arrayBuffer()
  if (await hash(bytes) !== env.RELEASE_SHA) return { status: 503, error: 'Replica hash mismatch.' }
  const pkg = JSON.parse(new TextDecoder().decode(bytes))
  if (pkg.cohort !== cohort || !pkg.slots.includes(slot) || pkg.modules.length !== 101) {
    return { status: 503, error: 'Replica registry mismatch.' }
  }
  return { bytes, pkg }
}

function overview() {
  const items = modules.map(m => {
    const d = describe(m)
    return `<li><strong>${String(d.id).padStart(3,'0')}</strong> <a href="${d.endpoint}">${E(d.title)}</a><br><span>${E(d.task)}</span></li>`
  }).join('')
  return html(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Library of Tabor Wisdom Fleet</title>
<style>
:root{color-scheme:dark;background:#10241f;color:#fbf6e8;font:18px/1.5 system-ui,sans-serif}main{max-width:70rem;margin:auto;padding:clamp(1rem,5vw,4rem)}
h1{font:clamp(2.3rem,6vw,5rem)/1 Georgia,serif;margin:.65em 0 .4em}a{color:#bee7d3;text-underline-offset:.2em}nav{display:flex;flex-wrap:wrap;gap:.6rem 1.3rem}
ul{padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,26rem),1fr));gap:.85rem}
li{background:#19382e;border:1px solid #395f51;border-radius:.45rem;padding:.85rem 1rem}li span{color:#d8e4da;font-size:.9rem}li strong{color:#d4b880}
</style><main><nav><a href="${host}/">Wisdom Catalog</a><a href="/v1/modules">Module API</a><a href="/v1/replicas">Federation replicas</a></nav>
<h1>Library of Tabor Wisdom Fleet</h1><p>101 modules with Worker, bot, and agent modes. Index passages, run calculations, or get an analysis with its evidence and steps.</p><ul>${items}</ul></main></html>`)
}

async function handle(request, env) {
  const { pathname } = new URL(request.url)
  const read = request.method === 'GET' || request.method === 'HEAD'
  if (pathname === '/' && read) return overview()
  if (pathname === '/v1/modules' && read) {
    return json({ count: modules.length, modes, entries: modules.map(m => ({ ...describe(m), routes: links(m[0]) })) })
  }
  if (pathname === '/v1/replicas' && read) {
    if (!nonce.test(env.RELEASE_SHA)) return json({ error: 'Release is unconfigured.' }, 503)
    const wantedPrefix = prefix(env)
    const slots = []
    let cursor
    do {
      const page = await env.REPLICAS.list({ prefix: wantedPrefix, limit: 300, cursor })
      for (const { key } of page.objects) {
        const filename = key.slice(wantedPrefix.length)
        if (/^node-\d{3,4}\.json$/.test(filename)) slots.push(filename.slice(0, -5))
      }
      if (page.truncated && (!page.cursor || page.cursor === cursor)) throw new Error('Invalid replica cursor')
      cursor = page.truncated ? page.cursor : undefined
    } while (cursor)
    return json({ cohort, source, releaseSHA256: env.RELEASE_SHA, storedCopies: slots.length, completeListing: true, slots })
  }
  const match = /^\/v1(\/nodes\/(node-\d{3,4}))?(?:\/modules\/(\d{3})(?:\/(worker|bot|agent))?)?(?:\/(bundle|receipt))?$/.exec(pathname)
  if (!match || !match[2] && !match[3] || match[3] && match[5]) return json({ error: 'Route not found.' }, 404)
  const [, , slot, serial, mode, file] = match
  if (!read && (request.method !== 'POST' || !serial || !mode)) return json({ error: 'Method not allowed.' }, 405, { allow: mode ? 'GET, HEAD, POST' : 'GET, HEAD' })
  let table = byID
  let replica
  if (slot) {
    const loaded = await loadReplica(slot, env)
    if (!loaded.pkg) return json({ error: loaded.error }, loaded.status)
    replica = { slot, cohort, releaseSHA256: env.RELEASE_SHA, modules: loaded.pkg.modules.length }
    if (file === 'bundle') return new Response(loaded.bytes, { headers: { ...headers, 'content-type': 'application/json', 'content-disposition': 'attachment; filename="wisdom-fleet-release.json"' } })
    if (!serial) return json({ ...replica, registry: source, bundle: `/v1/nodes/${slot}/bundle` })
    table = new Map(loaded.pkg.modules.map(m => [m[0], m]))
  }
  const module = table.get(Number(serial))
  if (!module) return json({ error: 'Unknown module.' }, 404)
  if (read) return json({ ...describe(module), routes: links(module[0]), replica, requestedMode: mode })
  try {
    return json({ ...run(module, mode, await inputBody(request), table), replica })
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError || error instanceof RangeError) return json({ error: error.message }, 400)
    throw error
  }
}

export default {
  async fetch(request, env) {
    let response
    try {
      response = await handle(request, env)
    } catch (error) {
      console.error('Wisdom Fleet request failed', error)
      response = json({ error: 'Wisdom Fleet temporarily unavailable.' }, 503)
    }
    return request.method === 'HEAD' ? new Response(null, response) : response
  },
}

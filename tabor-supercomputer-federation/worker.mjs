const count = 50
const cohort = 'tabor-federation-v1'
const encoder = new TextEncoder()
const attachments = [
  { id: 'bitcoin-sha256d', category: 'Bitcoin and cryptocurrency', mode: 'synthetic_benchmark', link: '/v1/bitcoin-demo',
    physical_execution: 'requires_operator_attached_asic_and_pool' },
  { id: 'mining-hub', category: 'Mining fleet integration', mode: 'service_link',
    physical_execution: 'unverified' },
  { id: 'manifesting-the-matrix', category: 'Manifesting the Matrix', mode: 'bounded_matrix_kernel',
    link: '/v1/matrix-demo', broader_workloads: 'awaiting_operator_mapping' },
  { id: 'tabor-world', category: 'Tabor World Hub', mode: 'service_link' },
  { id: 'sovereign-digital-stack', category: 'Sovereign Digital Stack', mode: 'service_link' },
  { id: 'memory-storage', category: 'RAM and storage', mode: 'service_link' },
  { id: 'github-supercomputer', category: 'GitHub release and verification', mode: 'source_and_ci',
    href: 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/codex/tabor-supercomputer-federation/tabor-supercomputer-federation' },
]
const providers = [
  ['WORLD', 'tabor-world-hub', '/health'],
  ['STACK', 'tabor-sovereign-digital-stack', '/health'],
  ['MEMORY', 'tabor-raw-memory-storage', '/health'],
  ['SUPER', 'nathan-tabor-supercomputer', '/'],
  ['SUPER2X', 'nathan-tabor-supercomputer-2x', '/'],
  ['MINING', 'tabor-corp-mining-hub', '/'],
]

const json = (body, status = 200) => Response.json(body, { status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
} })
const nodeId = n => 'node-' + String(n).padStart(3, '0')
const nodePattern = /^node-(00[1-9]|0[1-4][0-9]|050)$/

export function capacityPlan(systems) {
  if (!Number.isInteger(systems) || systems < 1 || systems > count) throw new RangeError('systems')
  const target = 450
  const driveTB = 30
  const parity = 2
  const spare = 1
  const holdback = 10
  const data = Math.ceil(target * 100 / ((100 - holdback) * driveTB))
  const total = data + parity + spare
  const modeled = data * driveTB * (100 - holdback) / 100
  return {
    units: 'decimal', status: 'modeled_capacity', systems, target_tb_per_system: target,
    target_total_tb: target * systems, per_system: {
      drive_tb: driveTB, installed_drives: total, data_equivalent_drives: data,
      parity_equivalent_drives: parity, spare_drives: spare, holdback_percent: holdback,
      raw_tb: total * driveTB, modeled_tb_after_holdback: modeled,
    },
    fleet: { installed_drives: total * systems, raw_tb: total * driveTB * systems,
      modeled_tb_after_holdback: modeled * systems },
  }
}

function record(id) {
  return {
    schema: 1, id, cohort, database: 'isolated_sqlite_durable_object',
    compute_role: id === 'node-001' ? 'federation_lead' : 'federation_member',
    capacity: capacityPlan(1),
    physical_host_attachment: 'unverified',
    attachments: attachments.map(item => item.id),
  }
}

export class SupercomputerNode {
  constructor(ctx) {
    this.sql = ctx.storage.sql
    this.sql.exec('CREATE TABLE IF NOT EXISTS node_record (slot INTEGER PRIMARY KEY CHECK (slot = 1), record TEXT NOT NULL)')
  }
  async fetch(request) {
    const [id, operation] = new URL(request.url).pathname.slice(1).split('/')
    if (!nodePattern.test(id)) return json({ error: 'unknown_node' }, 404)
    if (request.method === 'POST') {
      this.sql.exec('INSERT OR IGNORE INTO node_record(slot, record) VALUES (1, ?)', JSON.stringify(record(id)))
    }
    const entries = this.sql.exec('SELECT record FROM node_record WHERE slot = 1').toArray()
    if (!entries.length) return json({ error: 'node_not_provisioned', id }, 404)
    const item = JSON.parse(entries[0].record)
    if (item.id !== id) return json({ error: 'node_identity_mismatch' }, 409)
    if (operation === 'matrix-demo') return json({ node: id, workload: matrixDemo(8) })
    return json(item)
  }
}

async function authorize(request, secret) {
  const value = request.headers.get('Authorization') ?? ''
  if (!secret || secret.length < 32 || !value.startsWith('Bearer ') || value.length > 256) return false
  const candidate = value.slice(7)
  if (!candidate) return false
  const alg = { name: 'HMAC', hash: 'SHA-256' }
  const expected = await crypto.subtle.importKey('raw', encoder.encode(secret), alg, false, ['verify'])
  const actual = await crypto.subtle.importKey('raw', encoder.encode(candidate), alg, false, ['sign'])
  const message = crypto.getRandomValues(new Uint8Array(32))
  return crypto.subtle.verify('HMAC', expected, await crypto.subtle.sign('HMAC', actual, message), message)
}

function readInteger(params, name, fallback, max) {
  const values = params.getAll(name)
  if (!values.length) return fallback
  if (values.length !== 1 || !/^[1-9][0-9]?$/.test(values[0])) return null
  const value = Number(values[0])
  return value <= max ? value : null
}

function nodeFetch(env, id, method = 'GET', suffix = '') {
  return env.NODES.getByName(id).fetch('https://node.internal/' + id + suffix, { method })
}

async function providerStatus(env) {
  return Promise.all(providers.map(async ([binding, name, path]) => {
    if (!env[binding]) return { name, status: 'unbound' }
    try {
      const response = await env[binding].fetch('https://service.internal' + path)
      await response.body?.cancel()
      return { name, status: response.ok ? 'reachable' : 'unverified', http_status: response.status }
    } catch {
      return { name, status: 'unverified' }
    }
  }))
}

export function matrixDemo(size) {
  const values = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => (row * 13 + col * 7 + 1) % 17))
  const product = values.map(left => values.map(right =>
    left.reduce((sum, number, index) => sum + number * right[index], 0)))
  return { mode: 'synthetic_matrix_kernel', operation: 'A_times_transpose_A', size,
    checksum: product.flat().reduce((sum, value) => sum + value, 0), first_row: product[0] }
}

function dashboard() {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tabor Supercomputer Federation</title>
<style>:root{color-scheme:dark;font-family:Geist,system-ui,sans-serif;background:#11191d;color:#edf5f4}body{margin:auto;padding:clamp(22px,6vw,70px);max-width:65rem}header{border-bottom:1px solid #43545c;padding-bottom:22px}h1{font-weight:650;font-size:clamp(2.35rem,7vw,4.7rem);line-height:1.02;margin:.3em 0}p{max-width:57ch;line-height:1.6;color:#bfcecf}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:16px;margin:30px 0}.stats article{border:1px solid #43545c;border-radius:8px;padding:15px}.stats strong{display:block;font-size:1.75rem;color:#a8ebce}.stats span{font-size:.9rem;color:#bfcecf}a{color:#bcebd7;text-underline-offset:3px}li{margin-bottom:14px}footer{margin-top:32px}</style>
<main><header><h1>Tabor Supercomputer Federation</h1><p>By Nathan Tabor</p><p>Individual node databases, workload attachments, and a shared fleet plan.</p></header>
<section class="stats" aria-label="Fleet design">
<article><strong>50</strong><span>Node database slots</span></article><article><strong>450 TB</strong><span>Storage target per system</span></article><article><strong>22.5 PB</strong><span>Modeled fleet target</span></article>
</section><h2>Federation</h2><ul><li><a href="/v1/nodes">Inspect node databases</a></li><li><a href="/v1/plan?systems=1">One-system capacity plan</a></li><li><a href="/v1/plan?systems=50">50-system capacity plan</a></li><li><a href="/v1/services">Check connected services</a></li><li><a href="/v1/attachments">View workload attachments</a></li><li><a href="/v1/matrix-demo">Run the Matrix demo</a></li><li><a href="/v1/bitcoin-demo">Run the synthetic Bitcoin benchmark</a></li><li><a href="/v1/export">Export portable fleet manifest</a></li></ul>
<footer><p>Storage figures are design targets. Physical compute and storage capacity require independently verified hardware.</p></footer></main></html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" },
  })
}

export default {
  async fetch(request, env) {
    const { pathname, searchParams } = new URL(request.url)
    if (pathname === '/v1/provision' && request.method === 'POST') {
      if (!await authorize(request, env.PROVISION_TOKEN)) return json({ error: 'unauthorized' }, 401)
      const start = readInteger(searchParams, 'start', 1, count)
      const limit = readInteger(searchParams, 'limit', 10, 10)
      if (start === null || limit === null) return json({ error: 'invalid_page' }, 400)
      const results = await Promise.all(Array.from({ length: Math.min(limit, count + 1 - start) }, async (_, index) => {
        const id = nodeId(start + index)
        try {
          const response = await nodeFetch(env, id, 'POST')
          await response.body?.cancel()
          return { id, status: response.ok ? 'provisioned' : 'unverified' }
        } catch {
          return { id, status: 'unverified' }
        }
      }))
      return json({ results }, results.every(item => item.status === 'provisioned') ? 200 : 503)
    }
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405)
    if (pathname === '/') return dashboard()
    if (pathname === '/health') return json({ service: 'Tabor Supercomputer Federation', cohort,
      fleet_slots: count, database_binding: Boolean(env.NODES), provisioning_enabled: Boolean(env.PROVISION_TOKEN?.length >= 32) })
    if (pathname === '/v1/attachments') return json({ attachments })
    if (pathname === '/v1/services') return json({ services: await providerStatus(env) })
    if (pathname === '/v1/plan') {
      const systems = readInteger(searchParams, 'systems', count, count)
      return systems === null ? json({ error: 'invalid_system_count' }, 400) : json(capacityPlan(systems))
    }
    if (pathname === '/v1/nodes') return json({ cohort, identity_source: 'fleet_manifest',
      slots: Array.from({ length: count }, (_, i) => ({ id: nodeId(i + 1), path: '/v1/nodes/' + nodeId(i + 1), matrix: '/v1/nodes/' + nodeId(i + 1) + '/matrix-demo' })) })
    if (pathname.startsWith('/v1/nodes/')) {
      const [id, operation, ...extra] = pathname.slice('/v1/nodes/'.length).split('/')
      if (!nodePattern.test(id) || extra.length || (operation !== undefined && operation !== 'matrix-demo')) return json({ error: 'unknown_node' }, 404)
      try {
        return await nodeFetch(env, id, 'GET', operation ? '/matrix-demo' : '')
      } catch {
        return json({ error: 'database_unavailable' }, 503)
      }
    }
    if (pathname === '/v1/export') return json({ schema: 1, cohort, deployment_mode: 'portable_manifest',
      capacity: capacityPlan(count), attachments, nodes: Array.from({ length: count }, (_, i) => record(nodeId(i + 1))) })
    if (pathname === '/v1/matrix-demo') {
      const size = readInteger(searchParams, 'size', 8, 16)
      return size === null ? json({ error: 'invalid_matrix_size' }, 400) : json(matrixDemo(size))
    }
    if (pathname === '/v1/bitcoin-demo') {
      try {
        const response = await env.STACK.fetch('https://stack.internal/v1/demo')
        if (response.ok) {
          const result = await response.json()
          const benchmark = result.outputs?.hashing
          if (benchmark?.mode === 'synthetic_sha256d_benchmark') return json({ benchmark, source: 'Sovereign Digital Stack' })
        } else await response.body?.cancel()
      } catch {
        return json({ error: 'benchmark_unavailable' }, 502)
      }
      return json({ error: 'benchmark_unavailable' }, 502)
    }
    return json({ error: 'not_found' }, 404)
  },
}

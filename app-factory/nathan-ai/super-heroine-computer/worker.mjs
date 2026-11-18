import { DurableObject } from 'cloudflare:workers'
import {
  author, buildManifest, buildReplica, cadence, cpuBackend, digest, identity, intervalMs, leaseMs,
  maxAttempts, mirror, replicas, retentionMs, title, verifyReplicas,
} from './workloads.mjs'

const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }
const json = (data, status = 200) => Response.json(data, { status, headers })
const slotOf = time => Math.floor(time / intervalMs) * intervalMs
const coordinator = env => env.COORDINATOR.getByName('super-heroine-v1')

export class ComputeReplica extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.db = ctx.storage.sql
    this.db.exec('CREATE TABLE IF NOT EXISTS results (slot INTEGER PRIMARY KEY, payload TEXT NOT NULL)')
  }

  async run(slot) {
    const previous = this.stored(slot)
    if (previous) return previous
    const copy = await buildReplica(buildManifest(slot))
    this.db.exec('INSERT OR IGNORE INTO results VALUES (?, ?)', slot, JSON.stringify(copy))
    this.db.exec('DELETE FROM results WHERE slot < ?', Date.now() - retentionMs)
    return this.stored(slot)
  }

  stored(slot) {
    const row = this.db.exec('SELECT payload FROM results WHERE slot = ?', slot).toArray()[0]
    return row ? JSON.parse(row.payload) : null
  }
}

export class ComputeCoordinator extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.db = ctx.storage.sql
    this.db.exec(`CREATE TABLE IF NOT EXISTS cycles (
      slot INTEGER PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      lease_until INTEGER NOT NULL DEFAULT 0,
      receipt TEXT,
      updated_at INTEGER NOT NULL
    )`)
    this.db.exec('CREATE INDEX IF NOT EXISTS cycles_retry ON cycles(status, lease_until, slot)')
    this.db.exec(`CREATE TABLE IF NOT EXISTS totals (
      name TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0
    )`)
  }

  async tick(slot) {
    const now = Date.now()
    if (slot > slotOf(now) || slot < slotOf(now) - 2 * intervalMs) return
    const claims = this.ctx.storage.transactionSync(() => {
      this.db.exec('INSERT OR IGNORE INTO cycles (slot, updated_at) VALUES (?, ?)', slot, now)
      const exhausted = this.db.exec(`UPDATE cycles SET status = 'failed', updated_at = ?
        WHERE status = 'pending' AND attempts >= ? AND lease_until <= ? RETURNING slot`, now, maxAttempts, now).toArray()
      if (exhausted.length) this.increment('failed', exhausted.length)
      this.db.exec("DELETE FROM cycles WHERE slot < ? AND status IN ('verified', 'failed', 'mismatch')", now - retentionMs)
      const slots = this.db.exec(`SELECT slot FROM cycles
        WHERE status = 'pending' AND attempts < ? AND lease_until <= ?
        ORDER BY (slot = ?) DESC, slot ASC LIMIT 2`, maxAttempts, now, slot).toArray()
      return slots.map(item => this.db.exec(`UPDATE cycles SET attempts = attempts + 1, lease_until = ?, updated_at = ?
        WHERE slot = ? RETURNING slot, attempts`, now + leaseMs, now, item.slot).one())
    })
    await Promise.all(claims.map(claim => this.execute(claim)))
  }

  increment(name, count) {
    this.db.exec(`INSERT INTO totals VALUES (?, ?) ON CONFLICT(name)
      DO UPDATE SET count = count + excluded.count`, name, count)
  }

  async execute({ slot, attempts }) {
    const manifest = buildManifest(slot)
    const executions = await Promise.allSettled(replicas.map(async name =>
      await this.env.REPLICAS.getByName(name).run(slot)))
    const failed = executions.flatMap((item, index) => item.status === 'rejected' ? [replicas[index]] : [])
    const evidence = { manifest, attempt: attempts }
    let status = 'pending'
    if (!failed.length) {
      const comparison = await verifyReplicas(manifest, executions.map(item => item.value))
      evidence.sha256 = comparison.expected
      evidence.copies = Object.fromEntries(replicas.map((name, index) => [name, comparison.replicas[index]]))
      status = comparison.verified ? 'verified' : 'mismatch'
    } else {
      evidence.unavailable = failed
      if (attempts >= maxAttempts) status = 'failed'
    }
    this.ctx.storage.transactionSync(() => {
      const rows = this.db.exec(`UPDATE cycles SET status = ?, receipt = ?, lease_until = ?, updated_at = ?
        WHERE slot = ? AND attempts = ? AND status = 'pending' RETURNING slot`,
      status, JSON.stringify(evidence), Date.now() + leaseMs, Date.now(), slot, attempts).toArray()
      if (rows.length && status !== 'pending') this.increment(status, 1)
    })
  }

  status() {
    const rows = this.db.exec('SELECT * FROM cycles ORDER BY slot DESC LIMIT 12').toArray()
    const totals = Object.fromEntries(this.db.exec('SELECT * FROM totals').toArray().map(row => [row.name, row.count]))
    return {
      title, author, identity, mirror, backend: cpuBackend, cadence_utc: cadence,
      repeat: 'no_end_date_while_cron_is_enabled', copies_per_cycle: replicas.length,
      verified_cycles: totals.verified ?? 0, failed_cycles: totals.failed ?? 0,
      mismatches: totals.mismatch ?? 0, receipt_retention_days: 30,
      recent: rows.map(row => ({
        id: 'cycle-' + row.slot, status: row.status, attempts: row.attempts,
        scheduled_at: new Date(row.slot).toISOString(), receipt: row.receipt ? JSON.parse(row.receipt) : null,
      })),
    }
  }

  receipt(slot) {
    const row = this.db.exec('SELECT status, receipt FROM cycles WHERE slot = ?', slot).toArray()[0]
    return row ? { status: row.status, evidence: row.receipt ? JSON.parse(row.receipt) : null } : null
  }
}

async function authorized(request, secret) {
  const header = request.headers.get('authorization')
  if (!secret || !header?.startsWith('Bearer ') || header.length > 256) return false
  const encoder = new TextEncoder()
  const hmac = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  const message = encoder.encode('super-heroine-operator-v1')
  const supplied = await crypto.subtle.importKey('raw', encoder.encode(header.slice(7) || ' '),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.verify('HMAC', hmac, await crypto.subtle.sign('HMAC', supplied, message), message)
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function page(data) {
  const rows = data.recent.map(row => `<tr><td><a href="/v1/receipts/${escapeHtml(row.id)}">${escapeHtml(row.scheduled_at)}</a></td>
    <td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.attempts)}</td></tr>`).join('')
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title><style>
*{box-sizing:border-box}body{margin:0;background:#0d1514;color:#eff5ee;font:16px/1.55 system-ui,sans-serif}main{max-width:48rem;margin:auto;padding:clamp(1.25rem,5vw,3rem)}h1{font-size:clamp(1.85rem,6vw,3.2rem);line-height:1.08;letter-spacing:-.035em}h2{font-size:1.25rem;margin-top:2rem}a{color:#9ae8bb}code{font-size:.9rem}dl{display:flex;flex-wrap:wrap;gap:1rem 2rem;border-block:1px solid #3e5650;padding:1rem 0}dt{color:#bcd3ca}dd{margin:0;font-weight:650}table{width:100%;text-align:left;border-collapse:collapse}td,th{padding:.55rem .35rem;border-bottom:1px solid #3e5650}</style>
<main><h1>${title}</h1><p>by ${author}</p><p>${identity}<br><code>${mirror}</code></p>
<dl><div><dt>Verified cycles</dt><dd>${data.verified_cycles}</dd></div><div><dt>Copies per cycle</dt><dd>${data.copies_per_cycle}</dd></div>
<div><dt>Failed cycles</dt><dd>${data.failed_cycles}</dd></div><div><dt>Mismatches</dt><dd>${data.mismatches}</dd></div></dl>
<p>Scheduled every five minutes in UTC. Runs fixed matrix, classical Bell-circuit simulation, and archive retrieval workloads on Cloudflare CPU.</p>
<h2>Run receipts</h2>
${rows ? `<table><thead><tr><th scope="col">Scheduled time</th><th scope="col">Status</th><th scope="col">Attempts</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>No cycle recorded yet.</p>'}
<p><a href="/v1/status">JSON status</a> · <a href="/v1/architecture">Architecture</a> · <a href="https://tabor-supercomputer-federation.nathantaboract.workers.dev/">Tabor Supercomputer Federation</a></p>
</main></html>`
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (request.method === 'POST' && pathname === '/v1/operator/tick') {
      if (!await authorized(request, env.OPERATOR_TOKEN)) return json({ error: 'unauthorized' }, 401)
      await coordinator(env).tick(slotOf(Date.now()))
      return json(await coordinator(env).status())
    }
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405)
    if (pathname === '/health') return json({ status: 'ok', backend: cpuBackend })
    if (pathname === '/v1/status') return json(await coordinator(env).status())
    if (pathname === '/v1/architecture') {
      try {
        const upstream = await env.FEDERATION.fetch('https://federation.internal/v1/hypercomputer')
        if (upstream.ok) return json(await upstream.json())
      } catch (error) {
        console.warn('Federation architecture unavailable', String(error))
      }
      return json({ error: 'federation_unavailable' }, 503)
    }
    const match = pathname.match(/^\/v1\/(receipts|results)\/cycle-(\d{1,15})$/)
    if (match) {
      const slot = Number(match[2])
      const receipt = await coordinator(env).receipt(slot)
      if (!receipt) return json({ error: 'receipt_not_found' }, 404)
      if (match[1] === 'receipts') return json(receipt)
      if (receipt.status !== 'verified') return json({ error: 'cycle_not_verified' }, 409)
      for (const name of replicas) {
        try {
          const result = await env.REPLICAS.getByName(name).stored(slot)
          if (result?.sha256 === receipt.evidence.sha256 &&
              await digest({ manifest: result.manifest, results: result.results }) === result.sha256) return json(result)
        } catch (error) {
          console.warn('Stored replica temporarily unavailable', name, String(error))
        }
      }
      return json({ error: 'replicas_unavailable' }, 503)
    }
    if (pathname === '/') return new Response(page(await coordinator(env).status()), {
      headers: { ...headers, 'content-type': 'text/html; charset=utf-8',
        'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'" },
    })
    return json({ error: 'not_found' }, 404)
  },

  async scheduled(event, env) {
    await coordinator(env).tick(slotOf(event.scheduledTime))
  },
}

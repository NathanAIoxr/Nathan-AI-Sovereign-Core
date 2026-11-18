const encoder = new TextEncoder()
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const sections = ['hashing', 'compute', 'orbital', 'wireless', 'robotics', 'frontier', 'archive']

function json(body, status = 200) {
  return Response.json(body, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  } })
}

function hex(bytes) {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(bytes) {
  return crypto.subtle.digest('SHA-256', bytes)
}

async function authorized(request, secret) {
  const token = request.headers.get('authorization') ?? ''
  if (!secret || secret.length < 32 || !token.startsWith('Bearer ') || token.length > 256) return false
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
  )
  const received = await crypto.subtle.importKey(
    'raw', encoder.encode(token.slice(7)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  ).catch(() => null)
  if (!received) return false
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const signature = await crypto.subtle.sign('HMAC', received, challenge)
  return crypto.subtle.verify('HMAC', key, signature, challenge)
}

// An 80-byte synthetic fixture with no network, wallet, pool, or block submission.
export async function hashFixture(samples) {
  if (!Number.isInteger(samples) || samples < 1 || samples > 64) throw new RangeError('samples')
  const header = encoder.encode('SOVEREIGN-DIGITAL-STACK'.padEnd(80, '0'))
  const view = new DataView(header.buffer)
  const started = performance.now()
  let lastDigest
  for (let nonce = 0; nonce < samples; nonce++) {
    view.setUint32(76, nonce, true)
    lastDigest = await sha256(await sha256(header))
  }
  return { mode: 'synthetic_sha256d_benchmark', samples, last_digest: hex(lastDigest),
    runtime_elapsed_ms: performance.now() - started }
}

function modelCompute() {
  const capacities = [4, 2]
  const workUnits = [4, 3, 2]
  const remaining = [...capacities]
  const placements = workUnits.map(units => {
    const node = remaining.findIndex(slots => slots >= units)
    if (node >= 0) remaining[node] -= units
    return { units, node: node >= 0 ? node + 1 : null }
  })
  return { mode: 'simulation', capacities, placements, unused_slots: remaining }
}

export async function simulate(samples, distanceKm) {
  if (!Number.isInteger(distanceKm) || distanceKm < 1 || distanceKm > 5000) {
    throw new RangeError('distance_km')
  }
  const earthRadiusKm = 6371
  const altitudeKm = 550
  const orbitRadiusKm = earthRadiusKm + altitudeKm
  const orbitPeriodMinutes = 2 * Math.PI * Math.sqrt(orbitRadiusKm ** 3 / 398600.4418) / 60
  const frequencyMHz = 2400
  const pathLossDb = 32.44 + 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMHz)
  const hash = await hashFixture(samples)
  const steps = ['detected', 'workload_drained', 'module_isolated', 'spare_consumed', 'self_test_passed', 'restored']
  const inputs = { samples, distance_km: distanceKm }
  const outputs = {
    hashing: { mode: hash.mode, samples: hash.samples, last_digest: hash.last_digest },
    compute: modelCompute(),
    orbital: { mode: 'simulation', model: 'circular_orbit', altitude_km: altitudeKm,
      period_minutes: orbitPeriodMinutes, modeled_ground_path: 'overhead_vacuum',
      one_way_ms: altitudeKm / 299792.458 * 1000 },
    wireless: { mode: 'simulation', model: 'free_space_attenuation', distance_km: distanceKm,
      frequency_mhz: frequencyMHz, path_loss_db: pathLossDb },
    robotics: { mode: 'simulation', model: 'single_module_repair', steps, initial_spares: 1,
      remaining_spares: 0, result: steps.at(-1) },
    frontier: { mode: 'simulation', model: 'idealized_propagation', vacuum_floor_ms: distanceKm / 299792.458 * 1000,
      fiber_index_1_468_ms: distanceKm * 1.468 / 299792.458 * 1000 },
  }
  const archive = { mode: 'computed', algorithm: 'SHA-256',
    sha256: hex(await sha256(encoder.encode(JSON.stringify({ schema: 1, inputs, outputs })))) }
  return { schema: 1, inputs, outputs: { ...outputs, archive },
    measurements: { runtime_elapsed_ms: hash.runtime_elapsed_ms } }
}

export class RunLedger {
  constructor(ctx) { this.storage = ctx.storage }
  async fetch(request) {
    if (request.method === 'GET') {
      const run = await this.storage.get('run')
      return run ? json(run) : json({ error: 'run_not_found' }, 404)
    }
    const { id, samples, distanceKm } = await request.json()
    const previous = await this.storage.get('run')
    const matches = run => run.inputs.samples === samples && run.inputs.distance_km === distanceKm
    const replay = run => matches(run) ? json(run) : json({ error: 'run_id_conflict' }, 409)
    if (previous) return replay(previous)

    const candidate = { id, ...(await simulate(samples, distanceKm)) }
    const outcome = await this.storage.transaction(async txn => {
      const existing = await txn.get('run')
      if (existing) return { existing }
      await txn.put('run', candidate)
      return { created: true }
    })
    return outcome.created ? json(candidate, 201) : replay(outcome.existing)
  }
}

function integerParam(params, name, fallback, max) {
  const values = params.getAll(name)
  if (!values.length) return fallback
  if (values.length !== 1 || !/^[1-9]\d{0,3}$/.test(values[0])) return null
  const value = Number(values[0])
  return value <= max ? value : null
}

export default {
  async fetch(request, env) {
    const { pathname, searchParams } = new URL(request.url)
    if (request.method === 'GET' && pathname === '/health') {
      return json({ service: 'Sovereign Digital Stack', status: 'reachable', sections,
        durable_ledger: Boolean(env.RUNS), protected_runs_enabled: Boolean(env.RUNS && env.RUN_TOKEN?.length >= 32) })
    }
    if (request.method === 'GET' && pathname === '/v1/demo') return json(await simulate(4, 10))
    const match = /^\/v1\/runs\/([^/]+)$/.exec(pathname)
    if (!match || !uuid.test(match[1]) || !['GET', 'POST'].includes(request.method)) {
      return json({ error: 'not_found' }, 404)
    }
    if (!await authorized(request, env.RUN_TOKEN)) return json({ error: 'unauthorized' }, 401)
    if (!env.RUNS) return json({ error: 'ledger_unavailable' }, 503)
    const ledger = env.RUNS.getByName(match[1])
    try {
      if (request.method === 'GET') return await ledger.fetch('https://ledger.internal/run')
      const samples = integerParam(searchParams, 'samples', 16, 64)
      const distanceKm = integerParam(searchParams, 'distance_km', 10, 5000)
      if (samples === null || distanceKm === null) return json({ error: 'invalid_parameters' }, 400)
      return await ledger.fetch('https://ledger.internal/run', { method: 'POST',
        body: JSON.stringify({ id: match[1], samples, distanceKm }) })
    } catch {
      console.error(JSON.stringify({ event: 'run_ledger_unavailable' }))
      return json({ error: 'ledger_unavailable' }, 503)
    }
  },
}

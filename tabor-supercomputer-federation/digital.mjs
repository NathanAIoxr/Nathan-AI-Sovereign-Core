const seatsPerNode = 20
const samples = 120
const encoder = new TextEncoder()
const modes = Object.freeze({
  baseline: { hz: 540, fps: 500, polling_hz: 1000, base_rtt_ms: 18, queue_max_ms: 2 },
  loaded: { hz: 540, fps: 500, polling_hz: 1000, base_rtt_ms: 18, queue_max_ms: 30 },
  tuned: { hz: 540, fps: 500, polling_hz: 1000, base_rtt_ms: 18, queue_max_ms: 5 },
  clarity: { hz: 240, fps: 220, polling_hz: 1000, base_rtt_ms: 18, queue_max_ms: 2 },
  speed: { hz: 720, fps: 660, polling_hz: 8000, base_rtt_ms: 18, queue_max_ms: 2 },
})

const exercises = Object.freeze({
  'identity-recovery': [
    ['detect', 'Synthetic identity alert received', 'fixture-identity-01'],
    ['contain', 'Test session marked revoked', 'mock-session-state'],
    ['recover', 'Replacement test identity restored access', 'mock-access-verification'],
    ['verify', 'Old session denied and replacement validated', 'fixture-test-result'],
  ],
  'backup-restore': [
    ['detect', 'Fixture dataset integrity mismatch flagged', 'fixture-storage-01'],
    ['contain', 'Affected synthetic dataset marked read-only', 'mock-storage-state'],
    ['recover', 'Known-good fixture snapshot selected', 'fixture-restore-manifest'],
    ['verify', 'Restored fixture records matched expected values', 'fixture-test-result'],
  ],
  'service-recovery': [
    ['detect', 'Synthetic service availability alert received', 'fixture-service-01'],
    ['contain', 'Synthetic service removed from mock routing', 'mock-routing-state'],
    ['recover', 'Known-good service fixture brought online', 'fixture-service-state'],
    ['verify', 'Fixture health check and request replay passed', 'fixture-test-result'],
  ],
})

const fixtures = Object.freeze({
  'identity-recovery': available => {
    const sessions = new Map([['old-test-session', true]])
    sessions.set('old-test-session', false)
    if (available) sessions.set('new-test-session', true)
    return { contained: sessions.get('old-test-session') === false,
      recovered: sessions.get('new-test-session') === true }
  },
  'backup-restore': available => {
    const expected = ['test-record-a', 'test-record-b']
    const damaged = ['test-record-a']
    const quarantined = damaged.length !== expected.length
    const restored = available ? [...expected] : damaged
    return { contained: quarantined,
      recovered: restored.length === expected.length && restored.every((value, index) => value === expected[index]) }
  },
  'service-recovery': available => {
    const selected = available ? { healthy: true, reply: 'fixture-ok' } : null
    return { contained: true, recovered: selected?.healthy === true && selected.reply === 'fixture-ok' }
  },
})

export const digitalOperations = Object.freeze(['digital', 'moment', 'lisssarrr'])
const buildSteps = [
  ['1+1=2', 'Build'], ['1−1=0', 'Clear'], ['1×1=1', 'Integrate'], ['1÷1=1', 'Verify'],
]
const round = value => Math.round(value * 1000) / 1000
const seatId = index => 'seat-' + String(index).padStart(4, '0')
const firstSeat = id => (Number(id.slice(5)) - 1) * seatsPerNode + 1

function relativePath(id, operation) {
  return '/v1/nodes/' + id + '/' + operation
}

export function digitalFleet(ids) {
  return {
    mode: 'digital_seat_allocation', nodes: ids.length, seats_per_node: seatsPerNode,
    total_seats: ids.length * seatsPerNode, simultaneous_playable_sessions: 'not_provisioned',
    moment_profiles: Object.keys(modes), lisssarrr_exercises: Object.keys(exercises),
    method: buildSteps.map(([equation, action]) => ({ equation, action })),
    allocation: ids.map(id => ({ node: id, first_seat: seatId(firstSeat(id)),
      last_seat: seatId(firstSeat(id) + seatsPerNode - 1), path: relativePath(id, 'digital') })),
  }
}

function parameter(query, key, fallback) {
  const values = query.getAll(key)
  return values.length === 0 ? fallback : values.length === 1 ? values[0] : null
}

function stats(values) {
  values.sort((a, b) => a - b)
  const percentile = fraction => round(values[Math.ceil(values.length * fraction) - 1])
  return { p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99) }
}

function momentForSeat(index, settings) {
  let state = index
  function draw() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
  const frame = [], inputToDisplay = [], rtt = []
  for (let sample = 0; sample < samples; sample++) {
    const input = draw() * 1000 / settings.polling_hz
    const render = (0.8 + 0.4 * draw()) * 1000 / settings.fps
    const display = draw() * 1000 / settings.hz
    const networkVariance = 3 * draw()
    const queue = settings.queue_max_ms * draw()
    frame.push(render)
    inputToDisplay.push(input + render + display)
    rtt.push(settings.base_rtt_ms + networkVariance + queue)
  }
  return { seat: seatId(index), modeled_render_frame_ms: stats(frame),
    modeled_input_to_display_ms: stats(inputToDisplay), modeled_rtt_ms: stats(rtt) }
}

async function seal(body) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(body)))
  const sha256 = Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('')
  return { ...body, receipt: { sha256, serialization: 'JSON.stringify of response without receipt' } }
}

export async function runDigital(id, operation, query) {
  const start = firstSeat(id)
  const indexes = Array.from({ length: seatsPerNode }, (_, offset) => start + offset)
  if (operation === 'digital') return {
    node: id, seats: indexes.map(seatId),
    moment: relativePath(id, 'moment'), lisssarrr: relativePath(id, 'lisssarrr'),
  }
  if (operation === 'moment') {
    const profile = parameter(query, 'profile', 'baseline')
    const seat = parameter(query, 'seat', '')
    if (!Object.hasOwn(modes, profile) || seat === null) return { error: 'invalid_profile_or_seat' }
    const selected = seat ? indexes.filter(index => seatId(index) === seat) : indexes
    if (!selected.length) return { error: 'seat_outside_node' }
    const settings = modes[profile]
    return seal({
      schema: 1, scenario: 'MOMENT', node: id, mode: 'synthetic_latency_simulation', profile,
      samples_per_seat: samples, assumptions: settings, refresh_interval_ms: round(1000 / settings.hz),
      seats: selected.map(index => momentForSeat(index, settings)),
    })
  }
  const exercise = parameter(query, 'exercise', 'identity-recovery')
  const recoverySource = parameter(query, 'recovery_source', 'available')
  if (!Object.hasOwn(exercises, exercise) || !['available', 'missing'].includes(recoverySource)) {
    return { error: 'invalid_exercise_or_recovery_source' }
  }
  const checks = fixtures[exercise](recoverySource === 'available')
  return seal({
    schema: 1, scenario: 'Lisssarrr', node: id, mode: 'synthetic_defensive_tabletop',
    exercise, recovery_source: recoverySource, external_actions: 0, checks,
    result: checks.recovered ? 'fixture_recovery_verified' : 'fixture_recovery_blocked',
    timeline: exercises[exercise].map(([phase, event, evidence], step) => ({
      step: step + 1, phase,
      event: checks.recovered || step < 2 ? event :
        (phase === 'recover' ? 'Synthetic recovery prerequisite unavailable' : 'Synthetic recovery not verified'),
      evidence, evidence_type: 'synthetic_fixture',
    })),
  })
}

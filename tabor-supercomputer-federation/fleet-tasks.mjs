import { buildAndPurge, verifyNode } from './sovereign-box.mjs'

export const fleetCount = 1000
export const fleetTaskVersion = 'sovereign-box-v1'
export const seedCount = 20
export const recordCount = 160
export const fleetFamilies = [
  'record-validation', 'utf8-round-trip', 'binary-seal', 'hex-seal', 'isopsephy',
  'target-links', 'generation-lineage', 'canonical-json', 'record-digest', 'doubling-replay',
]

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })
const nodeFormat = /^node-(?:00[1-9]|0[1-9]\d|[1-9]\d{2}|1000)$/
export const nodeId = position => 'node-' + String(position).padStart(3, '0')
export const isNodeId = id => nodeFormat.test(id)

export function assignment(id) {
  if (!isNodeId(id)) throw new RangeError('unknown fleet node')
  const index = Number(id.slice(5)) - 1
  return {
    task_id: fleetTaskVersion + '/' + id,
    family: fleetFamilies[Math.floor(index / 100)],
    record_index: index % recordCount + 1,
  }
}

export function loadFleetRecords(env) {
  const seeds = [
    ...JSON.parse(env.SOVEREIGN_BOX_SEEDS_A),
    ...JSON.parse(env.SOVEREIGN_BOX_SEEDS_B),
  ]
  if (seeds.length !== seedCount || seeds.some(node => verifyNode(node) !== 1)) {
    throw new Error('invalid private seed batch')
  }
  const records = buildAndPurge(seeds, 3)
  if (records.length !== recordCount) throw new Error('invalid fleet record count')
  const bySlug = new Map(records.map(record => [record.slug, record]))
  return { seeds, records, bySlug }
}

async function sha256(value) {
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

const anchorCode = { pi: 1, phi: 2, 'pi-phi': 3 }

const checks = {
  'record-validation': (row) => ({ passed: verifyNode(row) === 1 }),
  'utf8-round-trip': (row) => {
    const text = JSON.stringify(row)
    const bytes = encoder.encode(text)
    return { passed: decoder.decode(bytes) === text, utf8_bytes: bytes.length }
  },
  'binary-seal': (row) => ({
    passed: row.binary_seal === '11111111' + row.generation.toString(2).padStart(4, '0')
      + anchorCode[row.math_anchor].toString(2).padStart(4, '0'),
    seal_bits: row.binary_seal.length,
  }),
  'hex-seal': (row) => ({
    passed: /^0xFF[0-3][1-3]$/.test(row.hex_seal) && Number(row.hex_seal) === parseInt(row.binary_seal, 2),
    seal_bits: 16,
  }),
  isopsephy: (row) => ({
    passed: row.isopsephy_pi === (row.math_anchor === 'phi' ? null : 80)
      && row.isopsephy_phi === (row.math_anchor === 'pi' ? null : 500),
    pi: row.isopsephy_pi,
    phi: row.isopsephy_phi,
  }),
  'target-links': (row, { bySlug }) => ({
    passed: row.target_slug == null || bySlug.has(row.target_slug),
    has_target: row.target_slug != null,
  }),
  'generation-lineage': (row, { bySlug, seeds }) => {
    if (row.generation === 0) {
      return { passed: seeds[row.sovereign_index - 1]?.slug === row.slug, generation: 0 }
    }
    const suffix = row.slug.match(/-(\d+)-(\d+)$/)
    const parent = suffix && bySlug.get(row.slug.slice(0, -suffix[0].length))
    return {
      passed: Boolean(parent && parent.generation < row.generation
        && Number(suffix[1]) === row.generation && parent.sovereign_index === Number(suffix[2])),
      generation: row.generation,
    }
  },
  'canonical-json': (row) => {
    const json = JSON.stringify(row)
    return { passed: JSON.stringify(JSON.parse(json)) === json, field_count: Object.keys(row).length }
  },
  'record-digest': async (row) => {
    const text = JSON.stringify(row)
    const digest = await sha256(text)
    return { passed: digest === await sha256(JSON.stringify(JSON.parse(text))), sha256: digest }
  },
  'doubling-replay': (row, { seeds }) => {
    const replay = buildAndPurge(seeds, row.generation)
    return {
      passed: replay.length === seedCount * 2 ** row.generation
        && replay[row.sovereign_index - 1]?.slug === row.slug,
      generation: row.generation,
      cumulative_records: replay.length,
    }
  },
}

export async function runAssignedTask(id, env) {
  const task = assignment(id)
  const dataset = loadFleetRecords(env)
  const row = dataset.records[task.record_index - 1]
  const result = await checks[task.family](row, dataset)
  const { passed, ...evidence } = result
  if (!passed) throw new Error('assigned fleet task failed')
  const body = { id, ...task, status: 'verified', evidence }
  return { ...body, receipt: await sha256(JSON.stringify(body)) }
}

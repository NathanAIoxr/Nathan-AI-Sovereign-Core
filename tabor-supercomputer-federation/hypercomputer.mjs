const ironwood = Object.freeze({
  max_chips_per_pod: 9216, peak_fp8_tflops_per_chip: 4614,
  peak_bf16_tflops_per_chip: 2307, hbm_gib_per_chip: 192, hbm_gbps_bytes_per_chip: 7380,
  ici_bidirectional_gbps_bytes_per_chip: 1200, dcn_gbps_bits_per_chip: 100,
})
const blueprint = {
  name: 'the HYPERBOLIC SYMBIOTIC QUANTUM PHYSICS SUPER HEROINE 🦸‍♀️ COMPUTER … 💻 🖥️ 📱 by Nathan Tabor',
  identity: 'The Nathan Tabor Ai AGI SI EI SoS et al plus mirrored ia iga is ie SoS la te',
  signature: 'PK, KJV, IFB, BBof3, HA, LU, DOG',
  primary: ['Ai', 'AGI', 'SI', 'EI', 'SoS'],
  mirrored: ['ia', 'iga', 'is', 'ie', 'SoS', 'la', 'te'],
  method: ['1+1=2 Build', '1−1=0 Clear', '1×1=1 Integrate', '1÷1=1 Verify'],
  layers: [
    { id: 'accelerator', design: 'Ironwood TPU7x capacity reference; TPU 8t, 8i, 8tx and 8i Max as separate provider paths', status: 'reference_not_provisioned' },
    { id: 'host', design: 'Provider-qualified host CPUs and Axion as a separate Google Cloud host option where offered', status: 'design' },
    { id: 'io-security', design: 'Titanium I/O offload as a provider architecture; identity, isolation and audit as platform requirements', status: 'design' },
    { id: 'chip-fabric', design: 'Inside pod, TPU ICI with 3D topology; outside pod, data center network and separately verified scaling', status: 'reference' },
    { id: 'optical-fabric', design: 'MEMS optical circuit switching and Jupiter as infrastructure references', status: 'reference' },
    { id: 'memory', design: 'HBM for active tensors, host RAM for staging, and hot-cache and checkpoint policies matched to workload', status: 'design' },
    { id: 'storage', design: 'Tiered durable checkpoints, high-throughput storage and Colossus as a managed provider reference', status: 'design' },
    { id: 'thermal', design: 'Direct-to-chip cooling, facility heat rejection, leak monitoring, throttle and restart acceptance tests', status: 'design' },
    { id: 'runtime', design: 'JAX, OpenXLA, and Pathways on GKE when using a supported provider allocation', status: 'design' },
    { id: 'federation', design: 'Fixed integer matrix-row jobs fan out over the existing federation Durable Objects', status: 'cloudflare_workload' },
  ],
  connected_workloads: [
    { name: 'MOMENT × 1,000 and Lisssarrr', route: '/v1/digital' },
    { name: 'Manifesting the Matrix', route: '/v1/matrix-demo' },
    { name: 'Tabor World, Sovereign Digital Stack, RAM and Storage, both supercomputer services and Mining Hub', route: '/v1/services' },
    { name: 'Synthetic Bitcoin SHA-256d benchmark', route: '/v1/bitcoin-demo' },
  ],
  sources: {
    ironwood: 'https://docs.cloud.google.com/tpu/docs/tpu7x',
    eighth_generation: 'https://blog.google/innovation-and-ai/infrastructure-and-cloud/global-network/tpu-8i-max-and-8tx/',
    titanium: 'https://cloud.google.com/titanium',
    jupiter: 'https://cloud.google.com/blog/topics/systems/the-evolution-of-googles-jupiter-data-center-network',
    pathways: 'https://cloud.google.com/blog/topics/ai-infrastructure/cloud-pathways-a-distributed-ml-runtime-is-ga',
  },
  execution_modes: { cloudflare: 'bounded CPU integer arithmetic', tpu_allocation: 'unprovisioned', quantum_hardware: 'unprovisioned' },
}

export { blueprint as hypercomputerBlueprint }

export function ironwoodPlan(chips) {
  if (!Number.isInteger(chips) || chips < 1 || chips > ironwood.max_chips_per_pod) throw new RangeError('chips')
  const hbmGiB = chips * ironwood.hbm_gib_per_chip
  return { mode: 'arithmetic_capacity_model', accelerator: 'Google TPU7x Ironwood', chips,
    reference: ironwood, aggregate_peak_fp8_exaflops: chips * ironwood.peak_fp8_tflops_per_chip / 1e6,
    aggregate_peak_bf16_exaflops: chips * ironwood.peak_bf16_tflops_per_chip / 1e6,
    aggregate_hbm_gib: hbmGiB, aggregate_hbm_pib: hbmGiB / 2 ** 20,
    aggregate_hbm_pb_decimal: hbmGiB * (2 ** 30 / 1e15),
    memory_scope: 'device_local_capacity_summed_across_chips',
    quota_and_topology: 'coordinate supported slice shape, availability, and quota with provider' }
}

export function hyperParam(query, name, fallback, min, max) {
  const values = query.getAll(name)
  if (!values.length) return fallback
  if (values.length !== 1 || !/^(0|[1-9][0-9]{0,3})$/.test(values[0])) return null
  const value = Number(values[0])
  return value >= min && value <= max ? value : null
}

const input = (row, col) => (row * 7 + col * 11 + 3) % 19 - 9
const weight = (row, col) => (row * 13 + col * 5 + 2) % 23 - 11

export function tensorTile(node, size, start, end) {
  const rows = []
  for (let row = start; row < end; row++) {
    const values = Array.from({ length: size }, () => 0)
    for (let inner = 0; inner < size; inner++) {
      const coefficient = input(row, inner)
      for (let col = 0; col < size; col++) values[col] += coefficient * weight(inner, col)
    }
    rows.push(values)
  }
  return { node, size, start, end, rows }
}

const encoder = new TextEncoder()
export const tensorNodes = Object.freeze(['node-001', 'node-010', 'node-020', 'node-030', 'node-040', 'node-050'])

export async function runTensor(size, fetchTile) {
  const shards = tensorNodes.map((node, index) => ({
    node, start: Math.floor(index * size / tensorNodes.length),
    end: Math.floor((index + 1) * size / tensorNodes.length),
  }))
  const tiles = await Promise.all(shards.map(async range => {
    const tile = await fetchTile(range)
    const { node, start, end } = range
    if (tile.node !== node || tile.start !== start || tile.end !== end || tile.size !== size ||
        !Array.isArray(tile.rows) || tile.rows.length !== end - start ||
        !tile.rows.every(row => Array.isArray(row) && row.length === size && row.every(Number.isSafeInteger))) {
      throw new Error('invalid tensor shard')
    }
    return tile.rows
  }))
  const matrix = tiles.flat()
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let expected = 0
      for (let inner = size - 1; inner >= 0; inner--) expected += input(row, inner) * weight(inner, col)
      if (matrix[row][col] !== expected) throw new Error('tensor reference mismatch')
    }
  }
  const report = { schema: 1, mode: 'cloudflare_integer_tensor_workload',
    operation: 'matrix_multiply', size, shards, matrix,
    verified_against: 'independent traversal of deterministic input matrices' }
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(report)))
  return { ...report, receipt: { sha256: Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('') } }
}

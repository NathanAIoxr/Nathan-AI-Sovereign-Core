const tiers = [
  { id: 'register-cache', layer: 'Registers, SRAM and processor caches', medium: 'on-die', role: 'Active operands and working set',
    qualification: 'Measure locality, cache misses and execution stalls', edge: 'Request-local working set' },
  { id: 'hbm4', layer: 'HBM4 accelerator memory', medium: 'volatile', role: 'Accelerator tensors and high-bandwidth working sets',
    reference: 'Micron HBM4 36 GB 12-high, 2,048 I/O, 2.8 TB/s vendor headline',
    qualification: 'Validate delivered accelerator bandwidth, ECC and thermal behavior', edge: 'Request-local working set analogy' },
  { id: 'dram', layer: 'DDR5 RDIMM or LPDDR5X SOCAMM2', medium: 'volatile', role: 'Host RAM or platform-specific low-power memory',
    reference: 'Micron catalogs DDR5-8000 RDIMMs and announced 256 GB SOCAMM2',
    qualification: 'Confirm board support, channel population, ECC and NUMA locality', edge: 'Durable Objects for coordinated state' },
  { id: 'cxl', layer: 'CXL Type 3 expansion', medium: 'device-dependent', role: 'Capacity expansion and warm memory tier',
    reference: 'CXL 3.x uses a 64 GT/s link rate at its highest mode',
    qualification: 'Verify firmware, topology, bandwidth and p99 remote-access latency', edge: 'Workers KV for stale-tolerant cache entries' },
  { id: 'nvme', layer: 'Enterprise NVMe TLC', medium: 'nonvolatile', role: 'Hot block storage and write-intensive working sets',
    reference: 'Micron 9550 Gen5 and 9650 Gen6, with 28,000 MB/s vendor peak for 9650',
    qualification: 'Measure steady-state IOPS, tail latency, endurance, power-loss protection and thermals', edge: 'D1 for indexed metadata' },
  { id: 'zns', layer: 'Zoned NVMe', medium: 'nonvolatile', role: 'Append-oriented datasets on qualified zoned devices',
    qualification: 'Confirm a ZNS namespace and test zone append, reset, recovery and application compatibility', edge: 'Immutable-key object layout where appropriate' },
  { id: 'qlc', layer: 'High-capacity QLC NVMe', medium: 'nonvolatile', role: 'High-density read-heavy or archive staging',
    qualification: 'Verify actual orderable SKU, sustained write floor, DWPD and usable provisioned capacity', edge: 'R2 for object payloads' },
  { id: 'hdd', layer: 'Enterprise magnetic HDD', medium: 'nonvolatile', role: 'Bulk retention with independent redundancy',
    reference: 'Seagate Exos M 30 TB is a reference for high-capacity HDD comparison',
    qualification: 'Measure rebuild and restore time, sequential bandwidth and failure-domain independence', edge: 'R2 copy with its own retention policy' },
  { id: 'offline', layer: 'Offline or independent archive', medium: 'nonvolatile', role: 'Disaster recovery and long retention',
    qualification: 'Test a restore against a trusted SHA-256 manifest and retain a separate copy', edge: 'Independent backup plus versioned manifest' },
]

const response = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
})

function readInteger(params, key, defaultValue, min, max) {
  const values = params.getAll(key)
  if (values.length === 0) return defaultValue
  if (values.length !== 1 || !/^(0|[1-9]\d{0,5})$/.test(values[0])) return null
  const value = Number(values[0])
  return value >= min && value <= max ? value : null
}

export function capacityPlan({ ramGiB, reserveGiB, pageMiB, drives, driveTB, parity, spareDrives }) {
  const ramMiB = ramGiB * 1024
  const reserveMiB = reserveGiB * 1024
  const designHotMiB = Math.floor(ramMiB * 85 / 100)
  const hotMiB = Math.floor(Math.min(designHotMiB, ramMiB - reserveMiB) / pageMiB) * pageMiB
  const activeDrives = drives - spareDrives
  return {
    memory: { installed_mib: ramMiB, hot_budget_mib: hotMiB, outside_hot_budget_mib: ramMiB - hotMiB,
      minimum_reserve_mib: reserveMiB, page_mib: pageMiB, modeled_page_count: hotMiB / pageMiB },
    storage: { drives, drive_tb_decimal: driveTB, spare_drives: spareDrives, equivalent_parity_drives: parity,
      raw_tb_decimal: drives * driveTB, modeled_data_tb_before_overhead: (activeDrives - parity) * driveTB },
    status: 'planning_estimate',
  }
}

export default {
  async fetch(request, env) {
    const { pathname, searchParams } = new URL(request.url)
    if (request.method !== 'GET') return response({ error: 'method_not_allowed' }, 405)
    if (pathname === '/health') {
      return response({ service: 'Nathan Tabor Way Memory and Storage', status: 'reachable',
        tier_count: tiers.length, stack_binding: Boolean(env.STACK) })
    }
    if (pathname === '/' || pathname === '/v1/tiers') {
      return response({ design: 'ZERO_BLOAT_DIRECT_SILICON_AND_EDGE',
        target: { hot_path_percent: 85, outside_hot_path_percent: 15 }, tiers })
    }
    if (pathname === '/v1/plan') {
      const limits = [
        ['ramGiB', 'ram_gib', 256, 1, 65536],
        ['reserveGiB', 'reserve_gib', 0, 0, 65536],
        ['pageMiB', 'page_mib', 2, 2, 1024],
        ['drives', 'drives', 8, 1, 128],
        ['driveTB', 'drive_tb', 30, 1, 1024],
        ['parity', 'parity', 2, 0, 127],
        ['spareDrives', 'spares', 1, 0, 127],
      ]
      const settings = Object.fromEntries(limits.map(([key, name, fallback, min, max]) =>
        [key, readInteger(searchParams, name, fallback, min, max)]))
      if (Object.values(settings).includes(null) || ![2, 1024].includes(settings.pageMiB) ||
          settings.reserveGiB >= settings.ramGiB || settings.parity + settings.spareDrives >= settings.drives) {
        return response({ error: 'invalid_plan_inputs' }, 400)
      }
      return response(capacityPlan(settings))
    }
    if (pathname === '/v1/stack') {
      if (!env.STACK) return response({ status: 'unbound' }, 503)
      try {
        const upstream = await env.STACK.fetch('https://sovereign-digital.internal/health')
        if (!upstream.ok) return response({ status: 'upstream_unavailable' }, 502)
        const body = await upstream.json()
        return response({ status: 'connected', upstream: body.service, upstream_status: body.status,
          upstream_durable_ledger: body.durable_ledger })
      } catch {
        return response({ status: 'upstream_unavailable' }, 502)
      }
    }
    return response({ error: 'not_found' }, 404)
  },
}

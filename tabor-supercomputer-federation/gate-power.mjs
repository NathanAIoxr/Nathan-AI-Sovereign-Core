const sequence = '1110000'
const motions = ['insert_one_into_zero', 'right_full_circle', 'right_full_circle',
  'left_full_circle', 'left_full_circle', 'left_full_circle', 'left_full_circle']
const encoder = new TextEncoder()

export const powerSources = [
  { id: 'grid-and-utility-contracts', role: 'firm import limit', source: 'https://www.eia.gov/electricity/930-content/about.html' },
  { id: 'nuclear', role: 'utility or separately contracted supply', source: 'https://pris.iaea.org/PRIS/' },
  { id: 'solar-wind-hydro-geothermal', role: 'credit only deliverable and independent supply', source: 'https://www.eia.gov/electricity/930-content/about.html' },
  { id: 'natural-gas-other-onsite', role: 'account for independent, deliverable generation and fuel' },
  { id: 'battery-ups', role: 'limited by usable MWh, discharge MW, and selected time window' },
]

export async function gateStatus(family, input) {
  if (typeof input !== 'string' || !/^[01]{7}$/.test(input)) return { error: 'expected_seven_bits' }
  const matched = input === sequence
  let familyPacket = 'unavailable'
  try {
    if (family) {
      const response = await family.fetch('https://family.internal/api/federation.bin')
      if (response.ok && response.body) {
        const reader = response.body.getReader()
        const header = new Uint8Array(7)
        let length = 0
        try {
          while (length < header.length) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = value.subarray(0, header.length - length)
            header.set(chunk, length)
            length += chunk.length
          }
        } finally {
          await reader.cancel()
        }
        if (length === 7 && [84, 70, 69, 68, 1, 7, 224].every((byte, i) => header[i] === byte)) {
          familyPacket = 'verified_tfed_v1_gate_header'
        }
      } else await response.body?.cancel()
    }
  } catch {
    // The local model can still evaluate the sequence while the peer is unavailable.
  }
  const data = { schema: 1, mode: 'digital_sequence_model', input, required_sequence: sequence,
    actions: motions, matched, state: matched ? 'open' : 'closed', family_packet: familyPacket,
    external_control_actions: 0 }
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)))
  return { ...data, receipt: { sha256: Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('') } }
}

const powerInputs = [
  ['utility_mw', 0, 0, 100000], ['onsite_mw', 0, 0, 100000], ['stored_mwh', 0, 0, 100000],
  ['discharge_mw', 0, 0, 100000], ['hours', 4, 0.1, 8760], ['pue', 1.2, 1, 5],
  ['reserve_pct', 20, 0, 99], ['draw_kw', 1, 0.001, 100000],
]

export function powerPlan(query) {
  const entries = powerInputs.map(([key, fallback, low, high]) => {
    const values = query.getAll(key)
    if (!values.length) return [key, fallback]
    if (values.length !== 1 || !/^\d{1,6}(?:\.\d{1,3})?$/.test(values[0])) return [key, null]
    const value = Number(values[0])
    return [key, value >= low && value <= high ? value : null]
  })
  const inputs = Object.fromEntries(entries)
  if (entries.some(([, value]) => value === null)) return { error: 'invalid_power_plan_inputs' }
  const battery = Math.min(inputs.stored_mwh / inputs.hours, inputs.discharge_mw)
  const facility = inputs.utility_mw + inputs.onsite_mw + battery
  const it = facility * (1 - inputs.reserve_pct / 100) / inputs.pue
  return { schema: 1, mode: 'modeled_power_budget', inputs,
    credited_storage_mw_for_window: battery, facility_mw_before_reserve: facility, modeled_available_it_mw: it,
    modeled_workload_slots: Math.floor(it * 1000 / inputs.draw_kw),
    source_rules: 'Enter only independently deliverable capacity. Exclude duplicated utility mix and storage charged from capacity already counted for this modeled window.',
    live_grid_readings: 'not_connected', external_control_actions: 0 }
}

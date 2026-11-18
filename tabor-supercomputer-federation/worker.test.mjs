import assert from 'node:assert/strict'
import { createHash, createHmac } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import worker, { capacityPlan, matrixDemo, SupercomputerNode } from './worker.mjs'

test('capacity models one system and the full fleet', () => {
  const one = capacityPlan(1)
  assert.equal(one.per_system.installed_drives, 20)
  assert.equal(one.per_system.modeled_tb_after_holdback, 459)
  const fleet = capacityPlan(50)
  assert.equal(fleet.target_total_tb, 22500)
  assert.deepEqual(fleet.fleet, { installed_drives: 1000, raw_tb: 30000, modeled_tb_after_holdback: 22950 })
  assert.equal(capacityPlan(1000).target_total_tb, 450000)
  assert.throws(() => capacityPlan(1001), RangeError)
})

test('bounded Matrix kernel returns a known product', () => {
  assert.deepEqual(matrixDemo(2), { mode: 'synthetic_matrix_kernel', operation: 'A_times_transpose_A',
    size: 2, checksum: 369, first_row: [65, 46] })
})

test('private provisioning writes independent databases and leaves public reads stable', async () => {
  const nodes = new Map()
  const token = 't'.repeat(48)
  const env = { PROVISION_TOKEN: token, NODES: { getByName(id) {
    if (!nodes.has(id)) {
      const db = new DatabaseSync(':memory:')
      const sql = { exec(query, ...bindings) {
        const stmt = db.prepare(query)
        if (query.startsWith('SELECT')) return { toArray: () => stmt.all(...bindings) }
        return stmt.run(...bindings)
      } }
      nodes.set(id, new SupercomputerNode({ storage: { sql } }))
    }
    const node = nodes.get(id)
    return { fetch: (url, options) => node.fetch(new Request(url, options)) }
  } } }
  const call = (path, method = 'GET', key = '') => worker.fetch(new Request('https://test.invalid' + path, {
    method, headers: key ? { Authorization: 'Bearer ' + key } : {},
  }), env)

  assert.equal((await call('/v1/nodes/node-001')).status, 404)
  assert.equal((await call('/v1/provision', 'POST')).status, 401)
  assert.equal((await call('/v1/provision?start=1&limit=1', 'POST', token)).status, 200)
  assert.equal((await call('/v1/provision?start=1&limit=1', 'POST', token)).status, 200)
  assert.equal((await call('/v1/nodes/node-002')).status, 404)
  assert.equal((await call('/v1/provision?start=50&limit=1', 'POST', token)).status, 200)
  const first = await (await call('/v1/nodes/node-001')).json()
  const last = await (await call('/v1/nodes/node-050')).json()
  assert.equal(first.id, 'node-001')
  assert.equal(first.compute_role, 'federation_lead')
  assert.equal(last.id, 'node-050')
  assert.equal(last.physical_host_attachment, 'unverified')
  const local = await (await call('/v1/nodes/node-050/matrix-demo')).json()
  assert.deepEqual(local, { node: 'node-050', workload: matrixDemo(8) })
  assert.equal((await call('/v1/nodes/node-051')).status, 404)
  const manifest = await (await call('/v1/export')).json()
  assert.equal(new Set(manifest.nodes.map(node => node.id)).size, 1000)
  assert.equal(manifest.nodes.at(-1).id, 'node-1000')
  assert.equal((await call('/v1/nodes/node-1001')).status, 404)
  assert.equal((await call('/v1/nodes/node-051/digital')).status, 404)
})

test('digital allocation, modeled improvement, and evidence receipts run inside a persisted node', async () => {
  const allocation = await (await worker.fetch(new Request('https://test.invalid/v1/digital'), {})).json()
  assert.equal(allocation.total_seats, 1000)
  assert.equal(allocation.allocation.at(-1).last_seat, 'seat-1000')
  const db = new DatabaseSync(':memory:')
  const sql = { exec(query, ...bindings) {
    const stmt = db.prepare(query)
    return query.startsWith('SELECT') ? { toArray: () => stmt.all(...bindings) } : stmt.run(...bindings)
  } }
  const instance = new SupercomputerNode({ storage: { sql } })
  await instance.fetch(new Request('https://node.internal/node-050', { method: 'POST' }))
  const env = { NODES: { getByName(id) {
    assert.equal(id, 'node-050')
    return { fetch: (url, options) => instance.fetch(new Request(url, options)) }
  } } }
  const request = suffix => worker.fetch(new Request('https://test.invalid/v1/nodes/node-050/' + suffix), env)
  const node = await (await request('digital')).json()
  assert.deepEqual([node.seats[0], node.seats.at(-1)], ['seat-0981', 'seat-1000'])
  const loaded = await (await request('moment?seat=seat-1000&profile=loaded')).json()
  const tuned = await (await request('moment?seat=seat-1000&profile=tuned')).json()
  assert.ok(tuned.seats[0].modeled_rtt_ms.p95 < loaded.seats[0].modeled_rtt_ms.p95)
  assert.deepEqual(tuned.seats[0].modeled_input_to_display_ms, loaded.seats[0].modeled_input_to_display_ms)
  assert.equal((await request('moment?seat=seat-0001')).status, 400)
  assert.equal((await request('moment?profile=tuned&profile=loaded')).status, 400)
  const lab = await (await request('lisssarrr?exercise=backup-restore')).json()
  assert.equal(lab.external_actions, 0)
  assert.equal(lab.result, 'fixture_recovery_verified')
  const blocked = await (await request('lisssarrr?exercise=backup-restore&recovery_source=missing')).json()
  assert.equal(blocked.result, 'fixture_recovery_blocked')
  assert.equal(blocked.checks.recovered, false)
  for (const { receipt, ...body } of [loaded, tuned, lab, blocked]) {
    assert.equal(receipt.sha256, createHash('sha256').update(JSON.stringify(body)).digest('hex'))
  }
  db.close()
})

test('Ironwood capacity and six-shard tensor receipts are checked independently', async () => {
  const { ironwoodPlan, runTensor, tensorTile } = await import('./hypercomputer.mjs')
  const plan = ironwoodPlan(9216)
  assert.equal(plan.aggregate_peak_fp8_exaflops, 42.522624)
  assert.equal(plan.aggregate_peak_bf16_exaflops, 21.261312)
  assert.equal(plan.aggregate_hbm_gib, 1769472)
  assert.equal(plan.aggregate_hbm_pib, 1.6875)
  assert.throws(() => ironwoodPlan(9217), RangeError)
  const report = await runTensor(13, ({ node, start, end }) => tensorTile(node, 13, start, end))
  assert.equal(new Set(report.shards.map(item => item.node)).size, 6)
  assert.equal(report.matrix.length, 13)
  const { receipt, ...body } = report
  assert.equal(receipt.sha256, createHash('sha256').update(JSON.stringify(body)).digest('hex'))
  await assert.rejects(runTensor(13, ({ node, start, end }) => {
    const tile = tensorTile(node, 13, start, end)
    tile.rows[0][0] += 1
    return tile
  }), /tensor reference mismatch/)
  const bad = await worker.fetch(new Request('https://test.invalid/v1/hypercomputer/plan?chips=9999'), {})
  assert.equal(bad.status, 400)
})

test('One into Zero checks the exact sequence and power planning credits bounded storage', async () => {
  const { gateStatus, powerPlan } = await import('./gate-power.mjs')
  const packet = new Uint8Array([84, 70, 69, 68, 1, 7, 224])
  const family = { fetch: async () => new Response(packet) }
  const opened = await gateStatus(family, '1110000')
  assert.equal(opened.state, 'open')
  assert.equal(opened.family_packet, 'verified_tfed_v1_gate_header')
  const { receipt, ...body } = opened
  assert.equal(receipt.sha256, createHash('sha256').update(JSON.stringify(body)).digest('hex'))
  assert.equal((await gateStatus(family, '1101000')).state, 'closed')
  assert.equal((await gateStatus(family, '111')).error, 'expected_seven_bits')
  const model = powerPlan(new URLSearchParams('utility_mw=10&onsite_mw=2&stored_mwh=4&discharge_mw=2'))
  assert.equal(model.credited_storage_mw_for_window, 1)
  assert.equal(model.modeled_workload_slots, 8666)
  assert.equal(powerPlan(new URLSearchParams('utility_mw=8&utility_mw=9')).error, 'invalid_power_plan_inputs')
})

test('ONE task fleet persists independent receipts and counts the full 1,000 assignments once', async () => {
  const anchors = ['pi', 'phi', 'pi-phi']
  const input = Array.from({ length: 20 }, (_, i) => ({
    slug: 'seed-' + (i + 1), title: 'π and φ', kind: 'test_fixture',
    summary: 'The fixture preserves √5, quotes “…” and complete UTF-8.',
    target_slug: i ? 'seed-1' : null, math_anchor: anchors[i % anchors.length],
  }))
  const token = 'z'.repeat(48)
  const instances = new Map()
  const databases = []
  const roadCalls = []
  const roadKey = 'k'.repeat(48)
  const env = {
    FLEET_TASK_TOKEN: token,
    SOVEREIGN_ROAD_KEY: roadKey,
    SOVEREIGN_BOX_SEEDS_A: JSON.stringify(input.slice(0, 10)),
    SOVEREIGN_BOX_SEEDS_B: JSON.stringify(input.slice(10)),
    NODES: {
      getByName(id) {
        if (!instances.has(id)) {
          const db = new DatabaseSync(':memory:')
          databases.push(db)
          const sql = { exec(query, ...bindings) {
            const statement = db.prepare(query)
            return query.startsWith('SELECT') ? { toArray: () => statement.all(...bindings) } : statement.run(...bindings)
          } }
          instances.set(id, new SupercomputerNode({ storage: { sql } }, env))
        }
        const instance = instances.get(id)
        return { fetch(url, options) {
          if (url.endsWith('/sovereign-road')) roadCalls.push(id)
          return instance.fetch(new Request(url, options))
        } }
      },
    },
  }
  const call = (path, method = 'GET', credential = '') => worker.fetch(new Request('https://test.invalid' + path, {
    method, headers: credential ? { Authorization: 'Bearer ' + credential } : {},
  }), env)
  try {
    assert.equal((await call('/v1/tasks/run', 'POST')).status, 401)
    assert.equal((await call('/v1/tasks/run', 'GET')).status, 404)
    assert.equal((await call('/v1/tasks/run?start=1001', 'POST', token)).status, 400)
    assert.equal((await call('/v1/tasks/run?limit=26', 'POST', token)).status, 400)
    assert.equal((await call('/v1/nodes/node-1000/assigned-task')).status, 404)
    assert.equal((await (await call('/v1/tasks')).json()).verified, 0)
    const receipts = []
    for (let start = 1; start <= 1000; start += 25) {
      const response = await call('/v1/tasks/run?start=' + start, 'POST', token)
      assert.equal(response.status, 200)
      receipts.push(...(await response.json()).results)
    }
    assert.equal(new Set(receipts.map(item => item.task_id)).size, 1000)
    assert.equal(new Set(receipts.map(item => item.receipt)).size, 1000)
    assert.equal(new Set(receipts.map(item => item.record_index)).size, 160)
    assert.equal(instances.size, 1001)
    const { receipt, ...body } = receipts.at(-1)
    assert.equal(receipt, createHash('sha256').update(JSON.stringify(body)).digest('hex'))
    assert.deepEqual(await (await call('/v1/nodes/node-1000/assigned-task')).json(), receipts.at(-1))
    assert.deepEqual((await (await call('/v1/tasks/run?start=1', 'POST', token)).json()).results, receipts.slice(0, 25))
    const fleet = await (await call('/v1/tasks')).json()
    assert.deepEqual([fleet.assigned, fleet.verified, fleet.pending], [1000, 1000, 0])
    assert.deepEqual(fleet.families.map(family => family.verified), Array(10).fill(100))
    assert.ok(receipts.every(item => item.local_records === 160))
    assert.equal(new Set(receipts.map(item => item.snapshot_sha256)).size, 1)

    delete env.SOVEREIGN_BOX_SEEDS_A
    delete env.SOVEREIGN_BOX_SEEDS_B
    const node = 'node-1000'
    const packet = { road_origin: node, target_slug: 'seed-1', hex_seal: '0xFF01' }
    const road = (value, { time = Date.now(), signAs = node, signed = true } = {}) => {
      const body = JSON.stringify(value)
      const key = createHmac('sha256', roadKey).update('sovereign-road-v1/' + signAs).digest()
      const signature = createHmac('sha256', key).update(String(time) + '\n' + body).digest('hex')
      const headers = signed ? { 'X-Sovereign-Timestamp': String(time), 'X-Sovereign-Signature': signature } : {}
      return worker.fetch(new Request('https://test.invalid/v1/nodes/' + node + '/sovereign-road', {
        method: 'POST', headers, body,
      }), env)
    }
    assert.equal((await road(packet, { signed: false })).status, 403)
    assert.equal((await road(packet, { time: Date.now() - 301000 })).status, 403)
    assert.equal((await road(packet, { signAs: 'node-001' })).status, 403)
    assert.equal((await road({ ...packet, road_origin: 'node-001' })).status, 403)
    assert.equal((await road({ ...packet, hex_seal: '0xFF01_EXTRA' })).status, 403)
    assert.equal((await road({ ...packet, payload: 'x'.repeat(3000) })).status, 403)
    assert.deepEqual(roadCalls, [])
    assert.equal((await road({ ...packet, hex_seal: '0xFF02' })).status, 403)
    const admitted = await road(packet)
    assert.equal(admitted.status, 200)
    const result = await admitted.json()
    assert.equal(result.code, 1)
    assert.equal(result.destination, 'sovereign://node-1000/act/seed-1')
    assert.equal(result.record.title, 'π and φ')
    assert.deepEqual(roadCalls, [node, node])
  } finally {
    databases.forEach(db => db.close())
  }
})

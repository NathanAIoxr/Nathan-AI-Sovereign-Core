import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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
  assert.throws(() => capacityPlan(51), RangeError)
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
  assert.equal((await call('/v1/provision?start=50', 'POST', token)).status, 200)
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
  assert.equal(new Set(manifest.nodes.map(node => node.id)).size, 50)
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

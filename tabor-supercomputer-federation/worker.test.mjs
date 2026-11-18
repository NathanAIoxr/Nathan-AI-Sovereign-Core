import assert from 'node:assert/strict'
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

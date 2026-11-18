import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import worker, { hashFixture, simulate, RunLedger } from './worker.mjs'

test('SHA-256d matches an independent implementation', async () => {
  const header = Buffer.from('SOVEREIGN-DIGITAL-STACK'.padEnd(80, '0'))
  header.writeUInt32LE(7, 76)
  const first = createHash('sha256').update(header).digest()
  assert.equal((await hashFixture(8)).last_digest, createHash('sha256').update(first).digest('hex'))
  await assert.rejects(hashFixture(65), RangeError)
})

test('simulation preserves inputs, classifications and deterministic archive digest', async () => {
  const run = await simulate(4, 10)
  const repeat = await simulate(4, 10)
  assert.deepEqual(run.outputs, repeat.outputs)
  assert.equal(run.outputs.compute.placements[1].node, null)
  assert.ok(run.outputs.orbital.period_minutes > 94 && run.outputs.orbital.period_minutes < 97)
  assert.ok(Math.abs(run.outputs.wireless.path_loss_db - 120.04) < 0.1)
  assert.equal(run.outputs.robotics.remaining_spares, 0)
  assert.ok(run.outputs.frontier.fiber_index_1_468_ms > run.outputs.frontier.vacuum_floor_ms)
  const { archive, ...outputs } = run.outputs
  assert.equal(archive.sha256, createHash('sha256')
    .update(JSON.stringify({ schema: 1, inputs: run.inputs, outputs })).digest('hex'))
})

test('public demo and protected replayable run lifecycle', async () => {
  const data = new Map()
  let transaction = Promise.resolve()
  const storage = {
    async get(key) { return data.get(key) },
    async put(key, value) { data.set(key, value) },
    transaction(fn) {
      const pending = transaction.then(() => fn(storage))
      transaction = pending.catch(() => {})
      return pending
    },
  }
  const ledger = new RunLedger({ storage })
  const token = 'z'.repeat(64)
  const env = { RUN_TOKEN: token, RUNS: { getByName: () => ({
    fetch: (url, options) => ledger.fetch(new Request(url, options)),
  }) } }
  const run = '/v1/runs/90fb47ab-7d01-4e69-8928-d17dcdc639ec'
  function call(path, method = 'GET', secret = token, source = env) {
    return worker.fetch(new Request('https://worker.invalid' + path, {
      method, headers: { Authorization: 'Bearer ' + secret },
    }), source)
  }
  assert.equal((await call('/v1/demo', 'GET', '', {})).status, 200)
  assert.equal((await call(run, 'POST', 'incorrect')).status, 401)
  assert.equal((await call(run + '?samples=65', 'POST')).status, 400)
  assert.equal((await call(run + '?samples=4&samples=5', 'POST')).status, 400)
  assert.equal((await call(run)).status, 404)
  const pair = await Promise.all([call(run + '?samples=4', 'POST'), call(run + '?samples=4', 'POST')])
  assert.deepEqual(pair.map(response => response.status).sort(), [200, 201])
  const [first, replay] = await Promise.all(pair.map(response => response.json()))
  assert.deepEqual(first, replay)
  assert.deepEqual(await (await call(run)).json(), first)
  assert.equal((await call(run + '?samples=5', 'POST')).status, 409)
})

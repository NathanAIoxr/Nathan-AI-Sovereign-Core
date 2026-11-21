import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { admit, dailyLimit, extractEmbedding, putReceipt, seal, taskName, validJob } from './pipeline.mjs'

function localStorage() {
  const state = new Map()
  return { state, storage: { transaction: fn => fn({
    get: key => state.get(key),
    put: (key, value) => typeof key === 'object'
      ? Object.entries(key).forEach(([name, item]) => state.set(name, item)) : state.set(key, value),
  }) } }
}

test('admission is idempotent, bounded and uses UTC day buckets', async () => {
  const { storage } = localStorage()
  for (let index = 0; index < dailyLimit; index++) {
    assert.deepEqual(await admit(storage, 'test-run-' + index, '2026-11-18'), { admitted: true, replay: false })
  }
  assert.deepEqual(await admit(storage, 'test-run-over', '2026-11-18'),
    { admitted: false, reason: 'daily_pipeline_limit' })
  assert.deepEqual(await admit(storage, 'test-run-0', '2026-11-18'), { admitted: true, replay: true })
  assert.deepEqual(await admit(storage, 'test-run-0', '2026-11-19'), { admitted: false, reason: 'prior_day_job' })
  assert.deepEqual(await admit(storage, 'test-run-over', '2026-11-19'), { admitted: true, replay: false })
})

test('fixed inputs and evidence records are validated', async () => {
  const { storage, state } = localStorage()
  assert.ok(validJob({ id: 'proof-run-1', task: taskName }))
  assert.ok(!validJob({ id: 'proof-run-1', task: 'unknown' }))
  assert.ok(!validJob({ id: 'invalid/id', task: taskName }))
  const embedding = new Array(384).fill(0.25)
  assert.deepEqual(extractEmbedding({ data: [embedding] }), embedding)
  assert.throws(() => extractEmbedding({ data: [[0.1]] }), /invalid_embedding/)
  assert.equal(await putReceipt(storage, 'proof-run-1', {}), false)
  await admit(storage, 'proof-run-1', '2026-11-18')
  const payload = { status: 'verified' }
  const receipt = await seal(payload)
  assert.equal(receipt.sha256, createHash('sha256').update(JSON.stringify(payload)).digest('hex'))
  assert.equal(await putReceipt(storage, 'proof-run-1', receipt), true)
  await putReceipt(storage, 'proof-run-1', { different: true })
  assert.deepEqual(state.get('run:proof-run-1').receipt, receipt)
})

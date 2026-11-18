import assert from 'node:assert/strict'
import { test } from 'node:test'
import { admit, computeRequest, computeTask, dailyInferenceLimit, dailyLimit, extractEmbedding, failJob,
  putReceipt, reserveInference, seal, taskName, validJob, verifyCompute } from './pipeline.mjs'

function ledger(initial = {}) {
  const contents = new Map(Object.entries(initial))
  const store = {
    async get(key) { return contents.get(key) },
    async put(key, value) {
      const entries = typeof key === 'string' ? [[key, value]] : Object.entries(key)
      for (const [name, entry] of entries) contents.set(name, entry)
    },
  }
  let tail = Promise.resolve()
  return { ...store, transaction(fn) {
    const next = tail.then(() => fn(store))
    tail = next.catch(() => {})
    return next
  } }
}

test('the ledger preserves fixture receipts and bounds concurrent jobs and model calls', async () => {
  const day = '2026-11-18'
  const nextDay = '2026-11-19'
  const oldReceipt = { job: 'verify-old', task: taskName }
  const storage = ledger({ 'run:verify-old': { day, status: 'completed', receipt: oldReceipt } })
  assert.deepEqual(await admit(storage, 'verify-old', nextDay), { admitted: true, replay: true, receipt: oldReceipt })
  assert.deepEqual(await admit(storage, 'verify-old', nextDay, computeTask), { admitted: false, reason: 'job_id_conflict' })
  const ids = Array.from({ length: dailyLimit + 1 }, (_, i) => 'compute-' + i)
  const outcomes = await Promise.all(ids.map(id => admit(storage, id, day, computeTask)))
  assert.equal(outcomes.filter(row => row.admitted).length, dailyLimit)
  assert.deepEqual(outcomes.at(-1), { admitted: false, reason: 'daily_pipeline_limit' })
  const attempts = await Promise.all(ids.slice(0, dailyLimit).flatMap(id =>
    ['generation', 'embedding'].map(stage => reserveInference(storage, id, stage, nextDay))))
  assert.equal(attempts.filter(Boolean).length, dailyInferenceLimit)
  assert.equal(await reserveInference(storage, ids[0], 'embedding', day), false)
  assert.equal((await admit(storage, ids.at(-1), nextDay, computeTask)).admitted, true)
  assert.equal(await reserveInference(storage, ids.at(-1), 'generation', nextDay), false)
  assert.equal(await putReceipt(storage, ids[0], { task: taskName, job: ids[0] }), false)
  assert.equal(await putReceipt(storage, ids[0], { task: computeTask, job: ids[0] }), true)
  assert.equal(await failJob(storage, ids[0], computeTask), false)
  assert.equal(await failJob(storage, ids[1], computeTask), true)
  assert.deepEqual(await admit(storage, ids[1], nextDay, computeTask), { admitted: false, reason: 'job_failed' })
})

test('the workload verifier checks a sealed fabric result and rejects mismatches', async () => {
  const shardCount = 131072
  const shards = Array.from({ length: 16 }, (_, index) => ({
    index, count: shardCount, global_offset: shardCount * index, operations: 2 * shardCount,
    invocation: 'invocation-' + index, checksum: Math.floor(computeRequest.checksum / 16),
  }))
  shards[0].checksum += computeRequest.checksum % 16
  const receipt = { ...computeRequest, profile: 'fabric', kernel: 'fp64-dot-lcg32-v1', shards,
    run_id: 'fabric-run', replay_verified: true, comparable_hpl: false }
  const envelope = { receipt, sha256: (await seal(receipt)).sha256 }
  assert.deepEqual(await verifyCompute(envelope), { ...computeRequest, profile: 'fabric',
    run_id: 'fabric-run', receipt_sha256: envelope.sha256, comparable_hpl: false })
  assert.equal(validJob({ id: 'job-abcdef', task: computeTask }), true)
  assert.equal(validJob({ id: 'evil.sh', task: computeTask }), false)
  assert.equal(validJob({ id: 'job-abcdef', task: 'unsupported' }), false)
  await assert.rejects(verifyCompute({ ...envelope, sha256: 'tampered' }), /invalid_fp64_receipt/)
  const duplicate = { ...receipt, shards: shards.map(shard => ({ ...shard, invocation: 'duplicate' })) }
  await assert.rejects(verifyCompute({ receipt: duplicate, sha256: (await seal(duplicate)).sha256 }), /invalid_fp64_receipt/)
  assert.equal(extractEmbedding({ data: [Array(384).fill(0.5)] }).length, 384)
  assert.throws(() => extractEmbedding({ data: [[0.5]] }), /invalid_embedding/)
})

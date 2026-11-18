export const dailyLimit = 12
export const taskName = 'federation-memory-check'
export const computeTask = 'federation-fp64-check'
export const dailyInferenceLimit = dailyLimit * 2
export const computeVectorId = 'federation-fp64-check-v1'
export const computeNamespace = 'fp64-receipts'
export const computeRequest = {
  seed: 73, terms: 2097152, operations: 4194304, shard_count: 16, checksum: 549043171266,
}
export const vectorId = 'federation-memory-check-v1'
export const embeddingModel = '@cf/baai/bge-small-en-v1.5'
export const generationModel = '@cf/meta/llama-3.1-8b-instruct-fast'
const runId = /^[a-z0-9][a-z0-9-]{7,47}$/
const encoder = new TextEncoder()

export const fixture = 'Tabor Supercomputer Federation verification record: admitted jobs use a durable coordination ledger, a queue, a workflow, and verified semantic memory.'
export function validId(id) {
  return typeof id === 'string' && runId.test(id)
}
export function validJob(job) {
  return job && validId(job.id) && [taskName, computeTask].includes(job.task)
}

export async function admit(storage, id, day, task = taskName) {
  return storage.transaction(async txn => {
    const prior = await txn.get('run:' + id)
    if (prior && (prior.task ?? taskName) !== task) return { admitted: false, reason: 'job_id_conflict' }
    if (prior?.status === 'completed') return { admitted: true, replay: true, receipt: prior.receipt }
    if (prior?.status === 'failed') return { admitted: false, reason: 'job_failed' }
    if (prior) return { admitted: true, replay: true }
    const key = 'day:' + day
    const used = (await txn.get(key)) ?? 0
    if (used >= dailyLimit) return { admitted: false, reason: 'daily_pipeline_limit' }
    await txn.put({ [key]: used + 1, ['run:' + id]: { day, task, status: 'admitted' } })
    return { admitted: true, replay: false }
  })
}

export async function reserveInference(storage, id, stage, day) {
  if (!['generation', 'embedding'].includes(stage)) return false
  return storage.transaction(async txn => {
    const job = await txn.get('run:' + id)
    const key = 'inference-run:' + id + ':' + stage
    if (job?.status !== 'admitted' || await txn.get(key)) return false
    const dayKey = 'inference-day:' + day
    const used = (await txn.get(dayKey)) ?? 0
    if (used >= dailyInferenceLimit) return false
    await txn.put({ [dayKey]: used + 1, [key]: day })
    return true
  })
}

export async function putReceipt(storage, id, receipt) {
  return storage.transaction(async txn => {
    const key = 'run:' + id
    const current = await txn.get(key)
    if (!current || current.status === 'failed' || (current.task ?? taskName) !== receipt.task || receipt.job !== id) return false
    if (current.status !== 'completed') await txn.put(key, { ...current, status: 'completed', receipt })
    return true
  })
}

export async function failJob(storage, id, task) {
  return storage.transaction(async txn => {
    const key = 'run:' + id
    const job = await txn.get(key)
    if (job?.status !== 'admitted' || (job.task ?? taskName) !== task) return false
    await txn.put(key, { ...job, status: 'failed' })
    return true
  })
}

export function extractEmbedding(result) {
  const vector = result?.data?.[0]
  if (!Array.isArray(vector) || vector.length !== 384 || !vector.every(Number.isFinite)) {
    throw new Error('invalid_embedding')
  }
  return vector
}

export async function seal(report) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(report)))
  return { ...report, sha256: Array.from(new Uint8Array(hash), x => x.toString(16).padStart(2, '0')).join('') }
}

export async function verifyCompute(envelope) {
  const receipt = envelope?.receipt
  if (!receipt || receipt.profile !== 'fabric' || receipt.kernel !== 'fp64-dot-lcg32-v1' ||
      receipt.replay_verified !== true || receipt.comparable_hpl !== false ||
      Object.entries(computeRequest).some(([key, value]) => receipt[key] !== value)) {
    throw new Error('unexpected_fp64_receipt')
  }
  const shards = receipt.shards
  if (!Array.isArray(shards) || shards.length !== computeRequest.shard_count ||
      new Set(shards.map(item => item?.invocation)).size !== shards.length ||
      !shards.every((item, index) => item && item.index === index && item.count === 131072 &&
        item.global_offset === index * item.count && item.operations === item.count * 2 &&
        Number.isSafeInteger(item.checksum) && item.checksum >= 0 &&
        typeof item.invocation === 'string' && item.invocation.length > 0) ||
      shards.reduce((sum, item) => sum + item.checksum, 0) !== receipt.checksum ||
      (await seal(receipt)).sha256 !== envelope.sha256) {
    throw new Error('invalid_fp64_receipt')
  }
  return { ...computeRequest, profile: receipt.profile, run_id: receipt.run_id,
    receipt_sha256: envelope.sha256, comparable_hpl: false }
}


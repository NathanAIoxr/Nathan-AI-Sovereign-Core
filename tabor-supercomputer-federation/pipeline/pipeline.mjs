export const dailyLimit = 12
export const taskName = 'federation-memory-check'
export const vectorId = 'federation-memory-check-v1'
export const embeddingModel = '@cf/baai/bge-small-en-v1.5'
export const generationModel = '@cf/meta/llama-3.1-8b-instruct-fast'
const runId = /^[a-z0-9][a-z0-9-]{7,47}$/
const encoder = new TextEncoder()

export const fixture = 'Tabor Supercomputer Federation verification record: admitted jobs use a durable coordination ledger, a queue, a workflow, and verified semantic memory.'
export function validJob(job) {
  return job && typeof job.id === 'string' && runId.test(job.id) && job.task === taskName
}

export async function admit(storage, id, day) {
  return storage.transaction(async txn => {
    const prior = await txn.get('run:' + id)
    if (prior?.status === 'completed') return { admitted: true, replay: true, receipt: prior.receipt }
    if (prior) return prior.day === day ? { admitted: true, replay: true }
      : { admitted: false, reason: 'prior_day_job' }
    const key = 'day:' + day
    const used = (await txn.get(key)) ?? 0
    if (used >= dailyLimit) return { admitted: false, reason: 'daily_pipeline_limit' }
    await txn.put({ [key]: used + 1, ['run:' + id]: { day, status: 'admitted' } })
    return { admitted: true, replay: false }
  })
}

export async function putReceipt(storage, id, receipt) {
  return storage.transaction(async txn => {
    const key = 'run:' + id
    const current = await txn.get(key)
    if (!current) return false
    if (current.status !== 'completed') await txn.put(key, { ...current, status: 'completed', receipt })
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

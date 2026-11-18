import { WorkflowEntrypoint } from 'cloudflare:workers'
import { admit, computeNamespace, computeRequest, computeTask, computeVectorId, dailyInferenceLimit, dailyLimit,
  embeddingModel, extractEmbedding, failJob, fixture, generationModel, putReceipt, reserveInference, seal,
  taskName, validId, validJob, vectorId, verifyCompute } from './pipeline.mjs'

const response = (data, status = 200) => Response.json(data, { status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
const once = { retries: { limit: 0, delay: '1 second' }, timeout: '1 minute' }
const retry = { retries: { limit: 3, delay: '5 seconds', backoff: 'constant' }, timeout: '30 seconds' }
const coordinator = env => env.COORDINATOR.getByName('federation-pipeline')
const today = () => new Date().toISOString().slice(0, 10)
const coord = (env, op, data) => coordinator(env).fetch('https://coordinator.internal/' + op, {
  method: 'POST', body: JSON.stringify(data),
})
async function grantFor(env, job) {
  const result = await coord(env, 'admit', job)
  if (!result.ok) throw new Error('coordinator_unavailable')
  return result.json()
}
async function reserve(env, job, stage) {
  const result = await coord(env, 'infer', { ...job, stage })
  if (!result.ok || !(await result.json()).allowed) throw new Error('inference_already_attempted_or_limited')
}

export class PipelineCoordinator {
  constructor(ctx) { this.storage = ctx.storage }
  async fetch(request) {
    const op = new URL(request.url).pathname
    if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)
    const job = await request.json()
    if (op === '/receipt' && validId(job?.id)) {
      const saved = await this.storage.get('run:' + job.id)
      return saved?.receipt ? response(saved.receipt)
        : response({ status: saved?.status ?? 'unknown' }, saved?.status === 'failed' ? 422 : saved ? 202 : 404)
    }
    if (!validJob(job)) return response({ error: 'invalid_job' }, 400)
    if (op === '/admit') return response(await admit(this.storage, job.id, today(), job.task))
    if (op === '/infer') return response({ allowed: await reserveInference(this.storage, job.id, job.stage, today()) })
    if (op === '/fail') return response({ stored: await failJob(this.storage, job.id, job.task) })
    if (op === '/complete' && job.receipt) return response({ stored: await putReceipt(this.storage, job.id, job.receipt) })
    return response({ error: 'unknown_operation' }, 404)
  }
}

export class FederationPipeline extends WorkflowEntrypoint {
  async run(event, step) {
    const job = event.payload
    if (!validJob(job) || event.instanceId !== job.id) return { status: 'rejected_input' }
    const grant = await step.do('admit durable job', retry, () => grantFor(this.env, job))
    if (!grant.admitted) return { status: 'held', reason: grant.reason }
    if (grant.receipt) return grant.receipt

    try {
      const fleet = await step.do('verify federation link', retry, async () => {
        const check = await this.env.FLEET.fetch('https://federation.internal/health')
        if (!check.ok) throw new Error('federation_unavailable')
        const health = await check.json()
        if (!health.database_binding || !Number.isInteger(health.fleet_slots) || health.fleet_slots < 1) {
          throw new Error('unexpected_federation_health')
        }
        return { service: health.service, fleet_slots: health.fleet_slots }
      })
      const compute = job.task === computeTask ? await step.do('perform and verify FP64 workload', retry, async () => {
        const params = new URLSearchParams({ profile: 'fabric', seed: computeRequest.seed })
        const result = await this.env.CORE.fetch('https://sovereign.internal/api/fp64/run?' + params)
        if (!result.ok) throw new Error('fp64_worker_unavailable')
        return verifyCompute(await result.json())
      }) : null
      const subject = compute ? 'Tabor Federation verified FP64 receipt. Seed 73; 2097152 terms; ' +
        '4194304 operations; 16 shards; exact replay checksum 549043171266.' : fixture
      const indexedId = compute ? computeVectorId : vectorId
      const ns = compute ? { namespace: computeNamespace } : {}
      const statusNote = await step.do('generate bounded status note', once, async () => {
        await reserve(this.env, job, 'generation')
        const result = await this.env.AI.run(generationModel, {
          messages: [{ role: 'user', content: 'Summarize this verification record in one short sentence. ' + subject }],
          max_tokens: 48, temperature: 0,
        })
        if (typeof result?.response !== 'string' || !result.response.trim()) throw new Error('missing_status_note')
        return result.response.trim().slice(0, 500)
      })
      const vector = await step.do('embed approved fixture', once, async () => {
        await reserve(this.env, job, 'embedding')
        return extractEmbedding(await this.env.AI.run(embeddingModel, { text: [subject] }))
      })
      const write = await step.do('upsert fixed memory record', retry, async () => {
        const result = await this.env.MEMORY.upsert([{ id: indexedId, ...ns, values: vector, metadata: { kind: job.task } }])
        if (!result.mutationId) throw new Error('missing_vector_mutation')
        return { mutation_id: result.mutationId }
      })
      const match = await step.do('verify indexed semantic match', {
        retries: { limit: 10, delay: '15 seconds', backoff: 'constant' }, timeout: '45 seconds',
      }, async () => {
        const result = await this.env.MEMORY.query(vector, { topK: 1, ...ns })
        const hit = result.matches?.[0]
        if (!hit) throw new Error('vector_not_visible')
        if (hit.id !== indexedId || !Number.isFinite(hit.score) || hit.score < 0.99) {
          throw new Error('semantic_match_not_verified')
        }
        return { id: hit.id, score: hit.score, dimensions: vector.length }
      })
      return await step.do('record verification receipt', retry, async () => {
        const receipt = await seal({ status: 'verified', job: job.id, task: job.task, fleet, status_note: statusNote,
          ...(compute ? { compute } : {}), memory: { ...write, ...match, ...ns } })
        const result = await coord(this.env, 'complete', { ...job, receipt })
        if (!result.ok || !(await result.json()).stored) throw new Error('receipt_not_stored')
        return receipt
      })
    } catch (error) {
      await step.do('record workflow failure', retry, async () => {
        const result = await coord(this.env, 'fail', job)
        if (!result.ok) throw new Error('failure_not_recorded')
      })
      throw error
    }
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    if (request.method !== 'GET') return response({ error: 'not_found' }, 404)
    const receiptId = path.match(/^\/api\/receipts\/([^/]+)$/)?.[1]
    if (validId(receiptId)) return coord(env, 'receipt', { id: receiptId })
    if (path !== '/health') return response({ error: 'not_found' }, 404)
    return response({ service: 'Tabor Federation Pipeline', intake: 'authenticated_cloudflare_queue',
      daily_unique_run_limit: dailyLimit, daily_ai_invocation_limit: dailyInferenceLimit,
      supported_tasks: [taskName, computeTask], recurring_trigger: false,
      bindings: { coordinator: Boolean(env.COORDINATOR), workflow: Boolean(env.PIPELINE),
        workers_ai: Boolean(env.AI), vectorize: Boolean(env.MEMORY), supercomputer_federation: Boolean(env.FLEET),
        fp64_core: Boolean(env.CORE) } })
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      if (!validJob(message.body)) {
        message.ack()
        continue
      }
      try {
        const { id, task } = message.body
        const grant = await grantFor(env, { id, task })
        if (!grant.admitted || grant.receipt) {
          message.ack()
          continue
        }
        try {
          await env.PIPELINE.create({ id, params: { id, task } })
        } catch (createError) {
          const existing = await env.PIPELINE.get(message.body.id)
          const status = await existing.status()
          if (!status?.status || status.status === 'unknown') throw createError
        }
        message.ack()
      } catch {
        message.retry()
      }
    }
  },
}


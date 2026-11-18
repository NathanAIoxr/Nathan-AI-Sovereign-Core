import { WorkflowEntrypoint } from 'cloudflare:workers'
import { admit, dailyLimit, embeddingModel, extractEmbedding, fixture, generationModel,
  putReceipt, seal, taskName, validJob, vectorId } from './pipeline.mjs'

const response = (data, status = 200) => Response.json(data, { status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
const once = { retries: { limit: 0, delay: '1 second' }, timeout: '1 minute' }
const retry = { retries: { limit: 3, delay: '5 seconds', backoff: 'constant' }, timeout: '30 seconds' }
const coordinator = env => env.COORDINATOR.getByName('federation-pipeline')

export class PipelineCoordinator {
  constructor(ctx) { this.storage = ctx.storage }
  async fetch(request) {
    const op = new URL(request.url).pathname
    if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)
    const job = await request.json()
    if (!validJob(job)) return response({ error: 'invalid_job' }, 400)
    if (op === '/admit') return response(await admit(this.storage, job.id, new Date().toISOString().slice(0, 10)))
    if (op === '/complete' && job.receipt) return response({ stored: await putReceipt(this.storage, job.id, job.receipt) })
    return response({ error: 'unknown_operation' }, 404)
  }
}

export class FederationPipeline extends WorkflowEntrypoint {
  async run(event, step) {
    const job = event.payload
    if (!validJob(job) || event.instanceId !== job.id) return { status: 'rejected_input' }
    const grant = await step.do('admit durable job', retry, async () => {
      const result = await coordinator(this.env).fetch('https://coordinator.internal/admit', {
        method: 'POST', body: JSON.stringify(job),
      })
      if (!result.ok) throw new Error('coordinator_unavailable')
      return result.json()
    })
    if (!grant.admitted) return { status: 'held', reason: grant.reason }
    if (grant.receipt) return grant.receipt

    const fleet = await step.do('verify federation link', retry, async () => {
      const check = await this.env.FLEET.fetch('https://federation.internal/health')
      if (!check.ok) throw new Error('federation_unavailable')
      const health = await check.json()
      if (!health.database_binding || health.fleet_slots !== 50) throw new Error('unexpected_federation_health')
      return { service: health.service, fleet_slots: health.fleet_slots }
    })
    const statusNote = await step.do('generate bounded status note', once, async () => {
      const result = await this.env.AI.run(generationModel, {
        messages: [{ role: 'user', content: 'Summarize this test fixture in one short sentence. ' + fixture }],
        max_tokens: 48, temperature: 0,
      })
      if (typeof result?.response !== 'string' || !result.response.trim()) throw new Error('missing_status_note')
      return result.response.trim().slice(0, 500)
    })
    const vector = await step.do('embed approved fixture', once, async () => {
      return extractEmbedding(await this.env.AI.run(embeddingModel, { text: [fixture] }))
    })
    const write = await step.do('upsert fixed memory record', retry, async () => {
      const result = await this.env.MEMORY.upsert([{ id: vectorId, values: vector, metadata: { kind: taskName } }])
      if (!result.mutationId) throw new Error('missing_vector_mutation')
      return { mutation_id: result.mutationId }
    })
    const match = await step.do('verify indexed semantic match', {
      retries: { limit: 10, delay: '15 seconds', backoff: 'constant' }, timeout: '45 seconds',
    }, async () => {
      const result = await this.env.MEMORY.query(vector, { topK: 1 })
      const hit = result.matches?.[0]
      if (!hit) throw new Error('vector_not_visible')
      if (hit.id !== vectorId || !Number.isFinite(hit.score) || hit.score < 0.99) {
        throw new Error('semantic_match_not_verified')
      }
      return { id: hit.id, score: hit.score, dimensions: vector.length }
    })
    return step.do('record verification receipt', retry, async () => {
      const receipt = await seal({ status: 'verified', job: job.id, task: taskName, fleet, status_note: statusNote,
        memory: { ...write, ...match } })
      const result = await coordinator(this.env).fetch('https://coordinator.internal/complete', {
        method: 'POST', body: JSON.stringify({ ...job, receipt }),
      })
      if (!result.ok || !(await result.json()).stored) throw new Error('receipt_not_stored')
      return receipt
    })
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' || new URL(request.url).pathname !== '/health') {
      return response({ error: 'not_found' }, 404)
    }
    return response({ service: 'Tabor Federation Pipeline', intake: 'authenticated_cloudflare_queue',
      daily_unique_run_limit: dailyLimit, recurring_trigger: false,
      bindings: { coordinator: Boolean(env.COORDINATOR), workflow: Boolean(env.PIPELINE),
        workers_ai: Boolean(env.AI), vectorize: Boolean(env.MEMORY), supercomputer_federation: Boolean(env.FLEET) } })
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      if (!validJob(message.body)) {
        message.ack()
        continue
      }
      try {
        try {
          await env.PIPELINE.create({ id: message.body.id, params: message.body })
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

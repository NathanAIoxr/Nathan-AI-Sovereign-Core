import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { DatabaseSync } from 'node:sqlite'
import { test } from 'node:test'
import { buildManifest, buildReplica, digest, intervalMs, maxAttempts, replicas, verifyReplicas } from './workloads.mjs'

const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (specifier !== 'cloudflare:workers') return next(specifier, context)
    return {
      url: 'data:text/javascript,export class DurableObject {constructor(ctx,env){this.ctx=ctx;this.env=env}}',
      shortCircuit: true,
    }
  },
})
const { default: worker, ComputeCoordinator, ComputeReplica } = await import('./worker.mjs')
hooks.deregister()

function context(t) {
  const database = new DatabaseSync(':memory:')
  t.after(() => database.close())
  return { storage: {
    sql: {
      exec(query, ...params) {
        const rows = database.prepare(query).all(...params)
        return { toArray: () => rows, one: () => rows[0] }
      },
    },
    transactionSync(action) {
      database.exec('BEGIN')
      try {
        const result = action()
        database.exec('COMMIT')
        return result
      } catch (error) {
        database.exec('ROLLBACK')
        throw error
      }
    },
  } }
}

function runtime(t) {
  const env = { OPERATOR_TOKEN: 'local-test-secret-do-not-deploy' }
  const state = context(t)
  const copies = Object.fromEntries(replicas.map(name => [name, new ComputeReplica(context(t), env)]))
  let control = new ComputeCoordinator(state, env)
  env.COORDINATOR = { getByName: () => control }
  env.REPLICAS = { getByName: name => copies[name] }
  return { env, copies, state, coordinator: () => control, restart: () => { control = new ComputeCoordinator(state, env) } }
}

const url = path => new URL(path, 'https://super-heroine.example')
const currentSlot = () => Math.floor(Date.now() / intervalMs) * intervalMs

test('three separately computed results agree and altered data is rejected even with a new hash', async () => {
  const manifest = buildManifest(currentSlot())
  const copies = await Promise.all(replicas.map(() => buildReplica(manifest)))
  assert.deepEqual(copies[0].results[1].probabilities, [0.5, 0, 0, 0.5])
  assert.equal((await verifyReplicas(manifest, copies)).verified, true)
  copies[1].results[0].values[0][0]++
  copies[1].sha256 = await digest({ manifest, results: copies[1].results })
  assert.equal((await verifyReplicas(manifest, copies)).verified, false)
})

test('duplicate cron events claim once and persisted results survive a coordinator restart', async t => {
  const runtimeState = runtime(t)
  const { env, copies } = runtimeState
  const slot = currentSlot()
  const event = { scheduledTime: slot }
  await Promise.all([worker.scheduled(event, env), worker.scheduled(event, env)])
  runtimeState.restart()
  const status = await (await worker.fetch(new Request(url('/v1/status')), env)).json()
  assert.equal(status.verified_cycles, 1)
  assert.equal(status.recent[0].attempts, 1)
  assert.deepEqual(Object.keys(status.recent[0].receipt.copies), replicas)
  assert.ok(replicas.every(name => copies[name].stored(slot).sha256 === status.recent[0].receipt.sha256))
  const receipt = await worker.fetch(new Request(url('/v1/receipts/cycle-' + slot)), env)
  assert.equal((await receipt.json()).status, 'verified')
  delete copies.primary
  const result = await worker.fetch(new Request(url('/v1/results/cycle-' + slot)), env)
  assert.equal((await result.json()).sha256, status.recent[0].receipt.sha256)
})

test('a failed copy resumes after the retry delay and other scheduled generations still run', async t => {
  const { env, copies, state, coordinator } = runtime(t)
  const slot = currentSlot() - intervalMs
  const record = copies['duplicate-2']
  record.run = async () => { throw new Error('temporary outage') }
  await worker.scheduled({ scheduledTime: slot }, env)
  assert.equal(coordinator().receipt(slot).status, 'pending')
  assert.deepEqual(coordinator().receipt(slot).evidence.unavailable, ['duplicate-2'])
  state.storage.sql.exec('UPDATE cycles SET lease_until = 0').toArray()
  record.run = ComputeReplica.prototype.run.bind(record)
  await worker.scheduled({ scheduledTime: slot + intervalMs }, env)
  const status = coordinator().status()
  assert.equal(status.verified_cycles, 2)
  assert.equal(status.recent.find(item => item.id === 'cycle-' + slot).attempts, 2)
})

test('a permanently failing generation stops retrying while the scheduler continues', async t => {
  const { env, copies, state, coordinator } = runtime(t)
  const slot = currentSlot() - intervalMs
  copies.primary.run = async () => { throw new Error('outage') }
  for (let attempt = 0; attempt < maxAttempts + 1; attempt++) {
    await worker.scheduled({ scheduledTime: slot }, env)
    state.storage.sql.exec('UPDATE cycles SET lease_until = 0').toArray()
  }
  assert.equal(coordinator().status().failed_cycles, 1)
  assert.equal(coordinator().receipt(slot).evidence.attempt, maxAttempts)
  copies.primary.run = ComputeReplica.prototype.run.bind(copies.primary)
  await worker.scheduled({ scheduledTime: slot + intervalMs }, env)
  assert.equal(coordinator().status().verified_cycles, 1)
})

test('public traffic can read status and cannot start work without the operator secret', async t => {
  const { env, coordinator } = runtime(t)
  const tick = secret => worker.fetch(new Request(url('/v1/operator/tick'), {
    method: 'POST', headers: { authorization: 'Bearer ' + secret },
  }), env)
  assert.equal((await tick('incorrect')).status, 401)
  assert.equal(coordinator().status().recent.length, 0)
  assert.equal((await tick(env.OPERATOR_TOKEN)).status, 200)
  assert.equal(coordinator().status().verified_cycles, 1)
  assert.equal((await worker.fetch(new Request(url('/')), env)).status, 200)
})

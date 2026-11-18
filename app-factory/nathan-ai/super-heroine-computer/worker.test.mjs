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
const { default: worker, ComputeCoordinator, ComputeReplica, ReceiptArchive } = await import('./worker.mjs')
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
  const archiveState = context(t)
  const archive = new ReceiptArchive(archiveState, env)
  const enableArchive = () => { env.ARCHIVE = { getByName: () => archive } }
  return { env, copies, state, archiveState, archive, enableArchive,
    coordinator: () => control, restart: () => { control = new ComputeCoordinator(state, env) } }
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

test('a scheduled tick archives new and prior runs, and the archive serves them on its own', async t => {
  const { env, copies, state, enableArchive } = runtime(t)
  const slot = currentSlot()
  await worker.scheduled({ scheduledTime: slot - intervalMs }, env)
  enableArchive()
  await Promise.all([worker.scheduled({ scheduledTime: slot }, env), worker.scheduled({ scheduledTime: slot }, env)])
  const get = path => worker.fetch(new Request(url(path)), env)
  const original = await (await get('/v1/status')).json()
  assert.equal(original.archived_cycles, 2)
  assert.equal(original.archive_retention_days, 90)
  assert.ok(original.recent.every(row => row.archived))
  const id = 'cycle-' + (slot - intervalMs)
  const archive = await (await get('/v1/archives/' + id)).json()
  assert.equal(archive.archive_sha256, await digest({ receipt: archive.receipt, result: archive.result }))
  for (const name of replicas) copies[name].stored = () => null
  assert.deepEqual(await (await get('/v1/results/' + id)).json(), archive.result)
  state.storage.sql.exec('DELETE FROM cycles WHERE slot = ?', slot - intervalMs)
  assert.deepEqual(await (await get('/v1/receipts/' + id)).json(), { status: 'verified', evidence: archive.receipt })
  env.COORDINATOR.getByName = () => { throw new Error('simulated coordinator outage') }
  assert.deepEqual(await (await get('/v1/results/' + id)).json(), archive.result)
})

test('archive failures retry, and a corrupt stored artifact is never returned', async t => {
  const { env, state, archive, archiveState, coordinator, enableArchive } = runtime(t)
  const slot = currentSlot()
  enableArchive()
  const store = archive.store.bind(archive)
  archive.store = () => { throw new Error('simulated archive outage') }
  await worker.scheduled({ scheduledTime: slot }, env)
  assert.equal(coordinator().status().verified_cycles, 1)
  assert.equal(coordinator().status().archived_cycles, 0)
  state.storage.sql.exec('UPDATE archive_index SET retry_at = 0')
  archive.store = store
  await worker.scheduled({ scheduledTime: slot }, env)
  assert.equal(coordinator().status().archived_cycles, 1)
  const stored = await archive.read(slot)
  stored.result.results[0].values[0][0]++
  archiveState.storage.sql.exec('UPDATE archived_cycles SET record = ? WHERE slot = ?', JSON.stringify(stored), slot)
  const response = await worker.fetch(new Request(url('/v1/archives/cycle-' + slot)), env)
  assert.equal(response.status, 503)
})

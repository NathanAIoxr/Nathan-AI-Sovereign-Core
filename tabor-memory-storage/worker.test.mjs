import assert from 'node:assert/strict'
import test from 'node:test'
import worker from './worker.mjs'

const call = (path, env = {}) => worker.fetch(new Request('https://test.invalid' + path), env)

test('hot budget honors both reserve and page geometry', async () => {
  const { memory, storage } = await (await call('/v1/plan?ram_gib=256&page_mib=1024')).json()
  assert.equal(memory.modeled_page_count, 217)
  assert.equal(memory.outside_hot_budget_mib, 39 * 1024)
  assert.equal(storage.modeled_data_tb_before_overhead, 150)
  const constrained = await (await call('/v1/plan?reserve_gib=64')).json()
  assert.equal(constrained.memory.hot_budget_mib, 192 * 1024)
  const tiny = await (await call('/v1/plan?ram_gib=1&page_mib=1024')).json()
  assert.equal(tiny.memory.modeled_page_count, 0)
})

test('catalog and invalid configurations', async () => {
  const catalog = await (await call('/v1/tiers')).json()
  assert.equal(new Set(catalog.tiers.map(tier => tier.id)).size, 9)
  for (const query of ['ram_gib=1&reserve_gib=1', 'page_mib=512', 'drives=2', 'drives=8&drives=9']) {
    assert.equal((await call('/v1/plan?' + query)).status, 400)
  }
})

test('Sovereign Digital Stack health comes from a service binding', async () => {
  const linked = await call('/v1/stack', { STACK: { fetch(url) {
    assert.equal(new URL(url).pathname, '/health')
    return Response.json({ service: 'Sovereign Digital Stack', status: 'reachable', durable_ledger: true })
  } } })
  assert.equal((await linked.json()).status, 'connected')
  assert.equal((await call('/v1/stack')).status, 503)
  assert.equal((await call('/v1/stack', { STACK: { fetch: () => new Response(null, { status: 503 }) } })).status, 502)
})

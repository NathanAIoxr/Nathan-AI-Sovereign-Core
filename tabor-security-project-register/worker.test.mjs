import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import worker, { runFixture } from './worker.mjs'

test('catalog preserves project identity and attribution status', async () => {
  const r = await worker.fetch(new Request('https://test.invalid/api/projects'))
  const { projects } = await r.json()
  assert.equal(projects.length, 7)
  assert.equal(projects[0].title, 'DIRTY_OLE_BASTARD_Protocol (Financial Reclamation)')
  assert.equal(projects.find(x => x.id === 'gotv').source_status, 'original_source_and_ownership_not_verified')
  assert.equal(projects.find(x => x.id === 'november-collection').individual_entries_verified, false)
})

test('known fixtures are inert and independently verifiable', async () => {
  const [odb, supply, recovery] = await Promise.all(['odb', 'supply-chain', 'recovery'].map(runFixture))
  assert.equal(odb.evidence.symbolic_units, 34)
  assert.equal(odb.evidence.money_moved, false)
  assert.equal(supply.evidence.trust_decision, 'hold_for_review')
  assert.equal(supply.evidence.clean_control, 'matches_manifest')
  assert.equal(recovery.evidence.restored_copy_matches, true)
  assert.equal(recovery.evidence.altered_copy_matches, false)
  for (const { receipt, ...payload } of [odb, supply, recovery]) {
    assert.equal(payload.external_actions, 0)
    assert.equal(receipt.sha256, createHash('sha256').update(JSON.stringify(payload)).digest('hex'))
  }
})

test('public service accepts only reads of fixed content', async () => {
  assert.equal((await worker.fetch(new Request('https://test.invalid/api/fixtures/unknown'))).status, 404)
  assert.equal((await worker.fetch(new Request('https://test.invalid/api/fixtures/odb', { method: 'POST' }))).status, 405)
})

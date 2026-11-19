import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { auditProject } from './staging/audit.mjs';
import { recordArtifact, sha256 } from './packages/provenance-ledger/index.js';
import { ingestTelemetry, readBody } from './packages/voice-telemetry/index.js';
import { switchboard } from './packages/nervous-system/switchboard.js';
import gate from './packages/shared/holding-gate.js';

function fixture() {
  const db = new DatabaseSync(':memory:');
  for (const file of ['0001_init_schema.sql', '0002_sovereign_schema.sql', '0002_sovereign_schema.sql']) {
    db.exec(readFileSync(new URL('./migrations/' + file, import.meta.url), 'utf8'));
  }
  db.prepare("INSERT INTO zones_registry (project_id,title,kind,source_path,source_commit) VALUES ('pilot','Pilot','app','test',?)")
    .run('a'.repeat(40));
  return {
    query: async (sql, params) => db.prepare(sql).all(...params),
    prepare: sql => ({ bind: (...args) => ({
      first: async () => db.prepare(sql).get(...args),
      run: async () => ({ meta: db.prepare(sql).run(...args) }),
    }) }),
  };
}

test('concurrent provenance writes deduplicate and produce a verifiable chain', async () => {
  const db = fixture();
  const values = new Map();
  for (const word of ['first', 'second', 'third']) {
    const bytes = new TextEncoder().encode(word);
    values.set(await sha256(bytes), bytes);
  }
  const jobs = [...values, ...values].map(([hash, bytes]) => recordArtifact(db, 'pilot', hash, bytes.length));
  const records = await Promise.all(jobs);
  assert.equal(new Set(records.map(row => row.sequence)).size, 3);
  const adapters = { query: db.query, readArtifact: async digest => values.get(digest) };
  const receipt = await auditProject(adapters, 'pilot', 'test-1');
  assert.equal(receipt.count, 3);
  assert.match(receipt.root, /^[a-f0-9]{64}$/);
  await db.query("DELETE FROM provenance_ledger WHERE project_id = 'pilot' AND sequence = 3", []);
  await assert.rejects(auditProject(adapters, 'pilot', 'test-2'), /Previously audited/);
});

test('request bodies are bounded and telemetry retries preserve the first event', async () => {
  const env = { ZONES: fixture() };
  const input = value => new Request('https://example.test', {
    method: 'POST', headers: { 'Idempotency-Key': 'event-1' }, body: JSON.stringify({ value }),
  });
  assert.equal((await ingestTelemetry(input(1), env, 'pilot')).eventId, 'event-1');
  assert.equal((await ingestTelemetry(input(1), env, 'pilot')).eventId, 'event-1');
  assert.deepEqual(await ingestTelemetry(input(2), env, 'pilot'), { conflict: true });
  await assert.rejects(readBody(input(3), 2), RangeError);
});

test('the switchboard scopes jobs to its authenticated project and rejects unknown tools', async () => {
  const jobs = [];
  const env = { AUDIT_QUEUE: { send: async job => jobs.push(job) } };
  const zone = { project_id: 'pilot', zone_status: 'ACTIVE', live: false };
  const invoke = name => switchboard({ jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name, arguments: { projectId: 'other' } } }, zone, env);
  assert.equal((await invoke('arbitrary_command')).error.code, -32602);
  const reply = await invoke('queue_integrity_audit');
  assert.equal(reply.result.structuredContent.projectId, 'pilot');
  assert.equal(jobs[0].projectId, 'pilot');
});

test('public staging shows holding pages and exposes no private operations', async () => {
  const root = 'https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/sovereign-staging';
  for (const slug of ['website-core', 'book-series', 'apps', 'games']) {
    const page = await gate.fetch(new Request(root + '/' + slug), {});
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Staging · Holding/);
  }
  assert.equal((await gate.fetch(new Request(root + '/source.txt'), {})).status, 404);
  assert.equal((await gate.fetch(new Request(root + '/sovereign/mcp', { method: 'POST' }), {})).status, 405);
});

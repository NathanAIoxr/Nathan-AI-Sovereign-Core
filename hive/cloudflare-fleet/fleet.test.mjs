import assert from 'node:assert/strict';
import test from 'node:test';
import {buildDeployment} from './deployment.mjs';
import {COMPANIONS, SLOTS, WORKLOADS} from './fleet-plan.mjs';
import {probe} from './probe.mjs';

test('every deployment has exactly one supervisor in five bounded cohorts', () => {
  const {controller, companions} = buildDeployment({firstControllerDeployment: true});
  const deployed = [...WORKLOADS.map(item => item.service), ...companions.map(item => item.name), controller.name];
  assert.equal(deployed.length, 64);
  assert.equal(new Set(deployed).size, 64);
  assert.equal(COMPANIONS.length, 31);
  assert.deepEqual(new Set(SLOTS.map(slot => slot.worker)), new Set(deployed));
  assert.equal(new Set(SLOTS.map(slot => slot.id)).size, 64);
  for (let cohort = 0; cohort < 5; cohort++) {
    assert.ok(SLOTS.filter(slot => slot.cohort === cohort).length <= 13);
  }
  assert.ok(companions.every(script => script.enabled === false));
  const bindings = new Set(controller.metadata.bindings.map(binding => binding.name));
  assert.equal(bindings.size, controller.metadata.bindings.length);
  for (const slot of SLOTS) {
    const name = slot.mode === 'primary' || slot.worker === controller.name ? slot.targetBinding : slot.binding;
    assert.ok(bindings.has(name), name);
  }
  assert.deepEqual(controller.metadata.migrations.new_sqlite_classes, ['Supervisor', 'FleetSummary']);
  assert.equal(buildDeployment().controller.metadata.migrations, undefined);
});

test('the companion checks the expected response contract and never follows redirects', async () => {
  const workload = WORKLOADS.find(item => item.service === 'hook-and-ring');
  const target = {fetch(request) {
    assert.equal(request.method, 'GET');
    assert.equal(request.redirect, 'manual');
    assert.equal(request.url, 'https://hook-and-ring.nathantaboract.workers.dev/api/status');
    return Response.json({ok: true});
  }};
  assert.equal((await probe(workload, target, true)).outcome, 'healthy');
  target.fetch = () => new Response('unrelated content');
  assert.equal((await probe(workload, target, true)).reason, 'unexpected_content_type');
  target.fetch = () => Response.redirect('https://example.com/', 302);
  assert.equal((await probe(workload, target, true)).outcome, 'failed');
  target.fetch = () => new Response(null, {status: 503});
  assert.equal((await probe(workload, target, true)).status, 503);
});

test('known Access and private responses are recorded as protected', async () => {
  const library = WORKLOADS.find(item => item.service === 'nathan-tabor-library');
  const login = {fetch: () => Response.redirect('https://nathantaboract.cloudflareaccess.com/cdn-cgi/access/login/nathan-tabor-library.nathantaboract.workers.dev', 302)};
  assert.equal((await probe(library, login, true)).outcome, 'protected');
  const runner = WORKLOADS.find(item => item.service === 'nathan-ai-repair-sandbox');
  const target = {fetch: () => new Response('Private runner', {status: 404})};
  assert.equal((await probe(runner, target, true)).outcome, 'protected');
  target.fetch = () => new Response('generic missing page', {status: 404});
  assert.equal((await probe(runner, target, true)).outcome, 'failed');
});

test('the scheduled handoff is checked by its receipt instead of an HTTP call', async () => {
  const handoff = WORKLOADS.find(item => item.service === 'nathan-ai-handoff-bee');
  const now = 1_800_000_000_000;
  let ran = now / 1000 - 120;
  const db = {prepare(sql) {
    assert.equal(sql, 'SELECT max(scheduled_at) AS ran FROM repair_handoff_runs');
    return {first: async () => ({ran})};
  }};
  assert.equal((await probe(handoff, db, false, now)).reason, 'fresh_receipt');
  ran = now / 1000 - 1200;
  assert.equal((await probe(handoff, db, true, now)).reason, 'stale_receipt');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from './isolated/health.js';

const projectId = 'sovereign-apps';
const alias = projectId + '.test';

function bindings(override = {}) {
  return {
    PROJECT_ID: projectId,
    STAGING_ALIAS: alias,
    ZONE_DB: { prepare: () => ({ bind: id => ({ first: async () => ({ project_id: id, launch_status: 'HOLDING' }) }) }) },
    ZONE_CONFIG: { get: async () => 'HOLDING' },
    ZONE_ASSETS: { get: async () => ({ json: async () => ({ projectId, alias, mode: 'HOLDING' }) }) },
    ZONE_JOBS: {},
    ZONE_STATE: {},
    ...override,
  };
}

test('the holding Worker verifies only its own complete sandbox', async () => {
  const health = new Request('https://' + alias + '/health');
  const response = await worker.fetch(health, bindings());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { projectId, mode: 'HOLDING', ready: true });
  const otherZone = { get: async () => ({ json: async () => ({ projectId: 'sovereign-games', alias, mode: 'HOLDING' }) }) };
  assert.equal((await worker.fetch(health, bindings({ ZONE_ASSETS: otherZone }))).status, 503);
  assert.equal((await worker.fetch(health, bindings({ ZONE_CONFIG: { get: async () => 'LIVE' } }))).status, 503);
});

test('a wrong hostname or non-health path stays inaccessible before reading bindings', async () => {
  for (const path of ['https://sovereign-games.test/health', 'https://' + alias + '/artifact']) {
    assert.equal((await worker.fetch(new Request(path), { STAGING_ALIAS: alias })).status, 404);
  }
});

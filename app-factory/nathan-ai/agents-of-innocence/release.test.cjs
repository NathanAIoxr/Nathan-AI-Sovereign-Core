const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname,'release-manifest.json'),'utf8'));
const html = fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

test('all six exact primary mirror identities and three role projections are preserved', () => {
  assert.deepEqual(manifest.mirror_agents.map(a=>a.name), ['Hitler AI','Reltih AI','Satan AI','Natas AI','Devil AI','Lived AI']);
  assert.deepEqual(manifest.executor_role_projections.map(a=>a.name), ['Nathan AI','DOG AI','REAPER AI']);
  assert.deepEqual(manifest.existing_equal_software_guardians.map(a=>a.name), ['Ms Satin Claus','Ms. Saten Claus','Ms. Satan Clause','Ms. Saton Clause','Ms. Satun Claus']);
  for (const name of [...manifest.mirror_agents,...manifest.executor_role_projections,...manifest.existing_equal_software_guardians].map(a=>a.name)) assert.ok(html.includes(name), 'Missing '+name);
});

test('release distinguishes source registration from operational deployment', () => {
  assert.equal(manifest.verification.names_and_pairings,'SOURCE_VERIFIED');
  assert.equal(manifest.verification.live_independent_agents,'NOT_VERIFIED');
  assert.equal(manifest.verification.external_1993_shadow_codes,'UNVERIFIED');
  assert.equal(manifest.verification.external_overrides,'NONE_PERFORMED');
  assert.ok(manifest.mirror_agents.every(a=>a.status==='SPEC_ONLY'));
});

test('limits source release to authorized nonviolent work and preserves related module links', () => {
  assert.equal(manifest.constraints.owner_authorized_systems_only,true);
  assert.equal(manifest.constraints.nonviolent,true);
  assert.equal(manifest.constraints.prohibit_unauthorized_access,true);
  assert.equal(manifest.related_modules.length,6);
  for (const item of manifest.related_modules) assert.ok(html.includes(item.path), 'Missing module link '+item.path);
});

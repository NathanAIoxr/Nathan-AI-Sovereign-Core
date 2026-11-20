import {test} from 'node:test';
import assert from 'node:assert/strict';
import {githubCandidates,cloudflareCandidates,validManifest,VAULT} from './readers.mjs';

test('GitHub candidates require a recorded project, allowed path, and a Git object',()=>{
  const path='standalone-apps/taborboy/app.json';
  const good={workspace_id:'pages-taborboy',source_ref:path};
  const bad={workspace_id:'other',source_ref:'standalone-apps/../../app.json'};
  const ref='a'.repeat(40);
  assert.equal(validManifest(bad.source_ref),false);
  assert.deepEqual(githubCandidates([good],new Map(),ref),[]);
  const suggestions=githubCandidates([good,bad],new Map([[path,'b'.repeat(40)],[bad.source_ref,'b'.repeat(40)]]),ref);
  assert.equal(suggestions.length,1);
  assert.equal(suggestions[0].workspace_id,good.workspace_id);
  assert.equal(suggestions[0].evidence.commit,ref);
});

test('Cloudflare proposals require an exact holding record and verification evidence',async()=>{
  const joined=[
    {workspace_id:'pages-taborboy',source_table:'release_fleet_jobs_v1',source_id:'website:taborboy'},
    {workspace_id:'other',source_table:'release_fleet_jobs_v1',source_id:'website:other'},
    {workspace_id:'feature-1',source_table:'sovereign_app_unit_feature_v1',source_id:'app-0001'}
  ];
  const releases=[
    {id:'website:taborboy',status:'verified',stage:'production',receipts:1},
    {id:'website:other',status:'verified',stage:'station-live',receipts:1},
    {id:'website:absent',status:'verified',stage:'production',receipts:1}
  ];
  const features=[{id:'app-0001',state:'verified',has_receipt:0}];
  const result=await cloudflareCandidates(async(db,query)=>{
    assert.match(query,/^SELECT/);
    return {results:db===VAULT?joined:query.includes('release_fleet_jobs_v1')?releases:features};
  });
  assert.deepEqual(result.candidates.map(r=>r.workspace_id),['pages-taborboy']);
  assert.equal(result.rowsRead,7);
});

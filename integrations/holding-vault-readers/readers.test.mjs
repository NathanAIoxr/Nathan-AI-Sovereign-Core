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

test('reader service requires the specific signed main-branch workflow identity',async()=>{
  const {authenticate}=await import('./reader-service.mjs');
  const algorithm={name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'};
  const key=await crypto.subtle.generateKey(algorithm,true,['sign','verify']);
  const jwk={...await crypto.subtle.exportKey('jwk',key.publicKey),kid:'test'};
  const load=async()=>Response.json({keys:[jwk]});
  const repo='NathanAIoxr/Nathan-AI-Sovereign-Core';
  const now=Math.floor(Date.now()/1000);
  const claims={iss:'https://token.actions.githubusercontent.com',aud:'https://tabor-bridge.nathantaboract.workers.dev/vault-reader-jobs/',repository_id:'1038249626',repository:repo,workflow_ref:repo+'/.github/workflows/holding-vault-reader-bots.yml@refs/heads/main',ref:'refs/heads/main',event_name:'schedule',run_id:'123',run_attempt:'1',sha:'a'.repeat(40),nbf:now-5,exp:now+300};
  async function signed(overrides={}) {
    const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
    const msg=encode({alg:'RS256',kid:'test'})+'.'+encode({...claims,...overrides});
    const sig=await crypto.subtle.sign(algorithm,key.privateKey,new TextEncoder().encode(msg));
    return new Request('https://test.test/github',{headers:{Authorization:'Bearer '+msg+'.'+Buffer.from(sig).toString('base64url')}});
  }
  assert.equal((await authenticate(await signed(),load)).run_id,'123');
  assert.equal(await authenticate(await signed({repository_id:'42'}),load),null);
  assert.equal(await authenticate(await signed({event_name:'pull_request'}),load),null);
  assert.equal(await authenticate(await signed({workflow_ref:repo+'/.github/workflows/other.yml@refs/heads/main'}),load),null);
  assert.equal(await authenticate(await signed({aud:'https://other.test'}),load),null);
  assert.equal(await authenticate(await signed({exp:now-1}),load),null);
});

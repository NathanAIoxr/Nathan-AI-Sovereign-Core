import {scanD1, scanStorage} from './trace-cloudflare.mjs';
import {storageReferences} from './trace-references.mjs';
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

test('Git provenance batches wait for a complete receipt and keep cycles as source links', async () => {
  const {DatabaseSync} = await import('node:sqlite');
  const {readFileSync} = await import('node:fs');
  const {graphJob} = await import('./provenance.mjs');
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE zones_registry (workspace_id TEXT PRIMARY KEY); CREATE TABLE zone_components (workspace_id TEXT, source_table TEXT, source_id TEXT, source_ref TEXT);');
  db.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
  const binding={
    prepare:(sql)=>({bind:(...values)=>{
      const args=Object.fromEntries(values.map((value,i)=>['?'+(i+1),value]));
      const stmt=db.prepare(sql);
      const invoke=(method)=>/\?\d/.test(sql)?stmt[method](args):stmt[method](...values);
      return {first:()=>invoke('get'),run:()=>({meta:invoke('run')})};
    }}),
    batch:async statements=>{
      for(const statement of statements)statement.run();
    }
  };
  const commit='a'.repeat(40);
  const call=(body)=>graphJob(new Request('https://test.invalid/github-tree',body?{
    method:'POST',body:JSON.stringify(body)
  }:{}),binding,commit,(body,status=200)=>Response.json(body,{status}));
  const first='folder/a.md', second='folder/b.md';
  const rows=[['folder','directory','b'.repeat(40),null,null,''],
    ...[first,second].map(path=>[path,'references-found','c'.repeat(40),'d'.repeat(64),10,'folder'])];
  assert.equal((await call({kind:'nodes',rows})).status,200);
  assert.equal((await call({kind:'finish',entries:3,links:2})).status,409);
  assert.equal((await call({kind:'edges',rows:[[first,second],[second,first]]})).status,200);
  assert.equal((await call({kind:'finish',entries:3,links:2})).status,200);
  assert.deepEqual(await (await call()).json(),{complete:true,entries:3});
  assert.equal(db.prepare("SELECT COUNT(*) n FROM zone_reader_provenance_edges WHERE relation='embedded reference'").get().n,2);
  db.close();
});

test('D1 scans successive pages through a stable order and emits hashes and references', async () => {
  const requests = [];
  const rows = [{id:1, source_ref:'app-factory/nathan-ai/example/app.json'},{id:2, source_ref:''}];
  const request = async ({body}) => {
    requests.push(body);
    const results = body.sql.includes('pragma_table_info') ? [{name:'id',pk:1}] :
      rows.slice(body.params[1], body.params[1] + body.params[0]);
    return {success:true,result:[{success:true,results}]};
  };
  const db = '2744aea4-b218-41e9-ab21-a04f25c10475';
  const first = await scanD1(request,'account',db,'table"name',{limit:1});
  assert.equal(first.next, 1);
  assert.equal(first.records[0].links[0], 'github-path:app-factory/nathan-ai/example/app.json');
  assert.match(requests[1].sql, /FROM "table""name" ORDER BY "id"/);
  const last = await scanD1(request,'account',db,'table"name',{offset:first.next,limit:2});
  assert.equal(last.next, null);
  assert.match(last.records[0].sha256, /^[a-f0-9]{64}$/);
});

test('KV reports missing values without labelling them as leaves', async () => {
  const request = async ({method}) => method === 'GET' ? {
    success:true,result:[{name:'a'},{name:'b'}],result_info:{cursor:'next'}
  } : {success:true,result:{values:{a:'https://example.com/tree?token=redacted'}}};
  const result = await scanStorage(request,'account',{kind:'kv',id:'namespace'});
  assert.equal(result.next, 'next');
  assert.deepEqual(result.records.map(record => record.state), ['references-found','read-error']);
  assert.deepEqual(result.records[0].links, ['https://example.com/tree']);
  assert.deepEqual(storageReferences('{"snapshot":"{\\"source_ref\\":\\"zones/example/site.html\\"}"}'), ['github-path:zones/example/site.html']);
});

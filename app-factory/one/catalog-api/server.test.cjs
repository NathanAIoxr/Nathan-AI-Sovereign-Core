'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {createHandler, PUBLIC_FIELDS}=require('./server.cjs');
const TOKEN='OwnerOnly-9bC5-JfT2-H7x4-NzL3-VmA8-gQv5-2026';
const PAT='pat_mock_fixture_only_1234567890';
const BASE='app00zqqUnAe8uo4k';
const TABLE='tblT3yoboygCIC82a';
const fixtures=[{
  id:'recRYjtRn3mJ5iCla',
  fields:{
    Name:'ONE — The Last App','Canonical ID':'ONE-CORE',
    Department:'ONE / Core', Kind:'App','Build Status':'Prototype',
    'Source URL':'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core',
    'Summary & Next Step':'Internal owner-only notes — MUST NEVER LEAK',
    'Private Contact':'secret@example.invalid'
  }
}];
async function withServer(run,fetchImpl=async()=>({ok:true,json:async()=>({records:fixtures,offset:'itrNEXT001'})})){
 const server=http.createServer(createHandler({
   apiToken:TOKEN,airtableToken:PAT,baseId:BASE,tableId:TABLE,fetchImpl
 }));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {await run('http://127.0.0.1:'+server.address().port);}
 finally {await new Promise(resolve=>server.close(resolve));}
}
const auth={Authorization:'Bearer '+TOKEN};
test('fails closed without credentials and rejects weak credentials',()=>{
 assert.throws(()=>createHandler({apiToken:'test',airtableToken:PAT,baseId:BASE,tableId:TABLE}));
 assert.throws(()=>createHandler({apiToken:TOKEN,airtableToken:'',baseId:BASE,tableId:TABLE}));
 assert.throws(()=>createHandler({apiToken:TOKEN,airtableToken:PAT,baseId:'invalid',tableId:TABLE}));
});
test('health is informational, catalog data needs authentication',async()=>withServer(async url=>{
 let r=await fetch(url+'/healthz');assert.equal(r.status,200);
 assert.equal((await r.json()).synced,false);
 r=await fetch(url+'/v1/catalog');assert.equal(r.status,401);
 r=await fetch(url+'/v1/catalog',{headers:{Authorization:'Bearer incorrect'}});
 assert.equal(r.status,401);
}));
test('authenticator returns only allowlisted source pointers and bounded pagination',async()=>{
 let called=false;
 await withServer(async url=>{
  const r=await fetch(url+'/v1/catalog?limit=10&offset=itrA', {headers:auth});
  assert.equal(r.status,200);
  const data=await r.json();
  assert.equal(data.items.length,1);
  assert.equal(data.items[0].canonical_id,'ONE-CORE');
  assert.equal(data.items[0].status,'Prototype');
  assert.equal(data.next_offset,'itrNEXT001');
  assert.ok(!JSON.stringify(data).includes('secret@example.invalid'));
  assert.ok(!JSON.stringify(data).includes('Internal owner-only notes'));
  assert.deepEqual(Object.keys(data.items[0]),[
    'record_id','canonical_id','name','department','kind','status','source_url'
  ]);
  assert.ok(called);
 },async (url,opts)=>{
  called=true;const u=new URL(url);
  assert.equal(u.hostname,'api.airtable.com');
  assert.equal(u.protocol,'https:');
  assert.equal(u.searchParams.get('pageSize'),'10');
  assert.equal(u.searchParams.get('offset'),'itrA');
  assert.deepEqual(u.searchParams.getAll('fields[]'),PUBLIC_FIELDS);
  assert.equal(opts.headers.Authorization,'Bearer '+PAT);
  assert.equal(opts.redirect,'error');
  return {ok:true,json:async()=>({records:fixtures,offset:'itrNEXT001'})};
 });
});
test('rejects writes, invalid queries and browser origins without making upstream calls',async()=>{
 let calls=0;
 await withServer(async url=>{
  for(const [route,opts,status] of [
   ['/v1/catalog',{method:'POST',headers:auth},405],
   ['/v1/catalog?limit=999',{headers:auth},400],
   ['/v1/catalog?offset=bad%2Fpath',{headers:auth},400],
   ['/v1/catalog?offset=itrA&offset=itrB',{headers:auth},400],
   ['/v1/catalog?filter=private',{headers:auth},400],
   ['/v1/catalog',{headers:{...auth,Origin:'https://evil.invalid'}},403],
   ['/v1/other',{headers:auth},404]
  ]){const r=await fetch(url+route,opts);assert.equal(r.status,status);}
  assert.equal(calls,0);
 },async()=>{calls++;return {ok:true,json:async()=>({records:[]})}});
});
test('upstream failure never leaks provider diagnostics',async()=>withServer(async url=>{
 const r=await fetch(url+'/v1/catalog',{headers:auth});
 assert.equal(r.status,502);
 assert.deepEqual(await r.json(),{error:'catalog_upstream_unavailable'});
},async()=>({ok:false,status:403,text:async()=>JSON.stringify({authorization:PAT})})));
test('response forbids cache, browser origins and credential-bearing logging',async()=>withServer(async url=>{
 const r=await fetch(url+'/v1/catalog',{headers:auth});
 assert.equal(r.headers.get('access-control-allow-origin'),null);
 assert.match(r.headers.get('cache-control'),/no-store/);
 assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 assert.ok(!(await r.text()).includes(PAT));
}));

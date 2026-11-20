import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
await import('../build.mjs');
const {default:worker}=await import('../dist/worker.mjs');
const {default:dispatch}=await import('../dist/dispatch.mjs');
const root='https://staging.example.test';

function setup() {
  const database=new DatabaseSync(':memory:');
  const files=new Map();
  const wait=[];
  const env={DB:{prepare(sql) {
    return {bind(...params){
      const statement=database.prepare(sql);
      return {all:async()=>({results:statement.all(...params)}),first:async()=>statement.get(...params),
        run:async()=>({meta:statement.run(...params)})};
    }};
  }}, AUDIO:{
    async put(key,body,{httpMetadata}) {
      files.set(key,{body,writeHttpMetadata:headers=>headers.set('Content-Type',httpMetadata.contentType)});
    },
    async get(key){return files.get(key);},
    async delete(key){files.delete(key);}
  }};
  const ctx={waitUntil(promise){wait.push(promise);}};
  return {env,ctx,database,wait};
}
test('app flow keeps exact wording and audio private and enforces both publish checks',async()=>{
  const {env,ctx,database,wait}=setup();
  database.exec(await readFile(new URL('../migrations/0001_library.sql',import.meta.url),'utf8'));
  const hit=(path,options)=>worker.fetch(new Request(root+path,options),env,ctx);
  const bootstrap=await hit('/api/bootstrap');
  assert.equal(bootstrap.status,200);
  const cookie=bootstrap.headers.get('set-cookie').split(';')[0];
  const {seed}=await bootstrap.json();
  const post=(path,body,kind='application/json')=>hit(path,{method:'POST',
    headers:{Cookie:cookie,Origin:root,'Content-Type':kind},body:kind==='application/json'?JSON.stringify(body):body});
  const original='  One,   two.\n';
  const capture=await post('/api/entries',{...seed,title:'Acceptance check',transcript:original,phonetic:'One — /wʌn/'});
  assert.equal(capture.status,200);
  const {entry}=await capture.json();
  assert.equal((await post('/api/entries',{...entry,revision:0})).status,409);
  assert.equal((await post('/api/entries',{...entry,transcript:'Changed'})).status,409);
  assert.equal((await post('/api/entries',{...entry,publish:true,shareApproved:true})).status,422);
  const publication=await post('/api/entries',{...entry,protect:1,publish:true,shareApproved:true});
  assert.equal(publication.status,200);
  const {entry:published}=await publication.json();
  const publicUrl='/api/catalog?q=Acceptance%20check';
  const visible=(await (await hit(publicUrl)).json()).entries;
  assert.equal(visible.length,1);
  assert.equal(visible[0].transcript,undefined);
  const own=(await (await hit('/api/bootstrap',{headers:{Cookie:cookie}})).json()).entries;
  assert.equal(own[0].transcript,original);
  const other=await hit('/api/bootstrap');
  const otherCookie=other.headers.get('set-cookie').split(';')[0];
  assert.deepEqual((await other.json()).entries,[]);
  const audio=Uint8Array.from([82,73,70,70,36,0,0,0,87,65,86,69]);
  const recorded=await post('/api/audio',audio,'audio/wav');
  assert.equal(recorded.status,201);
  const {id}=await recorded.json();
  const retrieved=await hit('/api/audio/'+id,{headers:{Cookie:cookie}});
  assert.equal(retrieved.headers.get('content-type'),'audio/wav');
  assert.deepEqual(new Uint8Array(await retrieved.arrayBuffer()),audio);
  assert.equal((await hit('/api/audio/'+id,{headers:{Cookie:otherCookie}})).status,404);
  assert.equal((await post('/api/entries',{...published,publish:false})).status,200);
  assert.deepEqual((await (await hit(publicUrl)).json()).entries,[]);
  await Promise.all(wait);
  database.close();
});

test('dispatch preserves holding page and closes unsigned workspace access',async()=>{
  const result=await dispatch.fetch(new Request(root+'/'),{},{});
  assert.match(await result.text(),/COMING SOON/);
  const status=await dispatch.fetch(new Request(root+'/healthz'),{},{});
  assert.equal((await status.json()).status,'ok');
  const workspace=await dispatch.fetch(new Request(root+'/workspace/'),{},{});
  assert.equal(workspace.status,403);
});

test('a signed Access identity can open the scoped staging workspace',async(t)=>{
  const issuer='https://access.example.test';
  const audience='academy-stage';
  const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,
    publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const key={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'academy-test'};
  t.mock.method(globalThis,'fetch',async(url)=>{
    assert.equal(url,issuer+'/cdn-cgi/access/certs');
    return Response.json({keys:[key]});
  });
  const encode=(part)=>Buffer.from(JSON.stringify(part)).toString('base64url');
  const header=encode({alg:'RS256',kid:key.kid});
  const payload=encode({iss:issuer,aud:[audience],exp:Math.floor(Date.now()/1000)+60,email:'owner@example.test'});
  const signed=header+'.'+payload;
  const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(signed));
  const token=signed+'.'+Buffer.from(signature).toString('base64url');
  const response=await dispatch.fetch(new Request(root+'/workspace/',{headers:{'Cf-Access-Jwt-Assertion':token}}),
    {ACCESS_ISSUER:issuer,ACCESS_AUDIENCE:audience},{});
  assert.equal(response.status,200);
  assert.match(await response.text(),/Hop In Chatbox/i);
  const wrongAudience=await dispatch.fetch(new Request(root+'/workspace/',{headers:{'Cf-Access-Jwt-Assertion':token}}),
    {ACCESS_ISSUER:issuer,ACCESS_AUDIENCE:'wrong-project'},{});
  assert.equal(wrongAudience.status,403);
});

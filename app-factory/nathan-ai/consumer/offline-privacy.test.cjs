'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const C=require('./engine.js');
const products=JSON.parse(fs.readFileSync(path.join(__dirname,'products.json'),'utf8'));
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'data-practices.json'),'utf8'));
const sw=fs.readFileSync(path.join(__dirname,'sw.js'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

test('every consumer source product has specific data provenance and clear unverified gaps',()=>{
 assert.equal(C.verifyDataPractices(data,products).records,12);
 assert.deepEqual(data.records.map(x=>x.id).sort(),products.products.map(x=>x.id).sort());
 for(const r of data.records){
  assert.ok(fs.existsSync(path.resolve(__dirname,'../../../..',r.evidencePath)),r.evidencePath);
  assert.ok(r.ownerAction.length>15);
  assert.match(r.evidenceLevel,/review|document/);
 }
 assert.match(C.dataPracticesFor(data,'health').remoteActivity,/HIPAA/);
 assert.match(C.dataPracticesFor(data,'offloader').deviceStorage,/encrypted/i);
});
test('privacy records are fail-closed for unknown IDs, duplicates and forged evidence links',()=>{
 const copy=structuredClone(data);copy.records[0].evidencePath='../../private.json';
 assert.throws(()=>C.verifyDataPractices(copy,products),/Unsafe original-source/);
 const extra=structuredClone(data);extra.records[0].id='unknown';
 assert.throws(()=>C.verifyDataPractices(extra,products),/Unknown or duplicate/);
 const duplicate=structuredClone(data);duplicate.records[1].id=duplicate.records[0].id;
 assert.throws(()=>C.verifyDataPractices(duplicate,products),/Unknown or duplicate/);
 const missing=structuredClone(data);missing.records.pop();
 assert.throws(()=>C.verifyDataPractices(missing,products),/Some consumer products/);
});
test('offline is explicit opt-in with remove function and no private data or cross-app cache',()=>{
 assert.match(html,/id="enableOffline"/);
 assert.match(html,/id="removeOffline"/);
 assert.match(app,/enabled.addEventListener\('click'/);
 assert.match(app,/removed.addEventListener\('click'/);
 assert.match(app,/navigator\.serviceWorker\.register\('\.\/sw\.js'/);
 assert.doesNotMatch(app,/navigator\.serviceWorker\.register\([^)]*\)\s*;/);
 assert.ok(!sw.includes('caches.addAll(data)'));
 assert.doesNotMatch(sw,/offloader|health|eyeprints|one\/|localStorage|postMessage|sync/);
});
test('service worker restricts interception to public consumer directory and allows offline fallback',async()=>{
 const calls={},handlers={},stored=new Map();
 const scope='https://demo.invalid/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/consumer/';
 const cache={
  addAll:async resources=>{for(const r of resources)stored.set(r.url,new Response('cached '+r.url,{status:200}))},
  match:async req=>stored.get(req.url)||undefined,
  put:async(req,response)=>{stored.set(req.url,response)}
 };
 const ctx={URL,Request,Response,caches:{
  open:async name=>cache,keys:async()=>['nathan-consumer-public-previous']
 },self:{registration:{scope},addEventListener:(name,fn)=>handlers[name]=fn,
   skipWaiting:async()=>{},clients:{claim:async()=>{}}}};
 ctx.caches.delete=async()=>true;
 ctx.fetch=async req=>new Response('fresh',{status:200});
 vm.runInNewContext(sw,ctx,{timeout:3000});
 assert.ok(handlers.install&&handlers.activate&&handlers.fetch);
 let install;
 handlers.install({waitUntil:p=>{install=p}});await install;
 assert.equal(stored.size,8,'Only 8 known public files are pre-cached');
 for(const u of stored.keys()){assert.ok(u.startsWith(scope));assert.ok(!u.includes('/offloader/'));}
 let response;
 const dispatch=request=>{
  let p;handlers.fetch({request,respondWith:x=>p=x});return p;
 };
 assert.equal(dispatch(new Request('https://other.invalid/private')),undefined);
 assert.equal(dispatch(new Request('https://demo.invalid/Nathan-AI-Sovereign-Core/app-factory/one/health/index.html')),undefined);
 assert.equal(dispatch(new Request(scope+'private.zip')),undefined);
 assert.equal(dispatch(new Request(scope+'products.json?private=1')),undefined);
 assert.equal(dispatch(new Request(scope+'products.json',{method:'POST'})),undefined);
 response=await dispatch(new Request(scope+'products.json'));
 assert.equal(await response.text(),'fresh');
 ctx.fetch=async()=>{throw Error('offline')};
 response=await dispatch(new Request(scope+'products.json'));
 assert.match(await response.text(),/cached/);
 response=await dispatch(new Request(scope+'index.html'));
 assert.match(await response.text(),/cached/);
});

'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {mkdtempSync,rmSync}=require('node:fs'),{tmpdir}=require('node:os'),path=require('node:path');
const {createApp}=require('./server.cjs');
const TOKEN='integration-owner-secret-with-strong-length';
async function run(server){await new Promise(r=>server.listen(0,'127.0.0.1',r));return 'http://'+server.allowedHost}
async function stop(s){await new Promise((r,j)=>s.close(e=>e?j(e):r()))}
test('database theme, manifest and records survive restart; app scopes and authentication are enforced',async()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'one-shell-'));let server=createApp({dbPath:path.join(dir,'test.sqlite'),token:TOKEN});
 try{
  let base=await run(server),cookie='';
  const req=async(route,method='GET',body,headers={})=>{const r=await fetch(base+route,{method,headers:{...cookie?{Cookie:cookie}:{},...body?{'Content-Type':'application/json'}:{},...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),headers:r.headers}};
  assert.equal((await req('/api/bootstrap')).status,401);
  assert.equal((await req('/api/session','POST',{token:'wrong'})).status,401);
  const login=await req('/api/session','POST',{token:TOKEN});assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);cookie=login.headers.get('set-cookie').split(';')[0];
  let boot=await req('/api/bootstrap');assert.equal(boot.data.mode,'sqlite');let a=boot.data.apps.find(a=>a.id==='god');
  assert.equal((await req('/api/apps/god','PUT',{...a,appearance:{...a.appearance,skin:'parchment'}},{Origin:'https://evil.example'})).status,403);
  assert.equal((await req('/api/apps/god','PUT',{...a,appearance:{skin:'injected'}})).status,400);
  a=(await req('/api/apps/god','PUT',{...a,appearance:{...a.appearance,skin:'parchment'}})).data;assert.equal(a.appearance.skin,'parchment');
  const record=await req('/api/apps/god/records','POST',{title:'Persistence test',notes:'<script>plain text</script>',complete:false});assert.equal(record.status,201,JSON.stringify(record.data));
  assert.equal((await req('/api/apps/world/records/'+record.data.id,'DELETE')).status,404);
  assert.equal((await req('/api/apps/god/records','POST',{unknown:'bad'})).status,400);
  assert.equal((await req('/api/apps/god','PUT',{...a,fields:[{key:'other',label:'Other',type:'text'}]})).status,400);
  assert.equal((await req('/api/apps','POST',{...a,id:'custom',name:'Custom'})).status,201);
  assert.equal((await req('/api/apps','POST',{...a,id:'bad',entry:'../../private.html'})).status,400);
  await stop(server);server=createApp({dbPath:path.join(dir,'test.sqlite'),token:TOKEN});base=await run(server);cookie='';
  assert.equal((await req('/api/bootstrap')).status,401);const again=await req('/api/session','POST',{token:TOKEN});cookie=again.headers.get('set-cookie').split(';')[0];
  assert.equal((await req('/api/apps/god')).data.appearance.skin,'parchment');assert.equal((await req('/api/apps/god/records')).data.items[0].data.title,'Persistence test');assert.equal((await req('/api/apps/world/records')).data.items.length,0);
  assert.equal((await req('/api/apps/god/records/'+record.data.id,'PUT',{title:'Edited'})).status,200);
  assert.equal((await req('/api/apps/god/records/'+record.data.id,'DELETE')).status,200);
  assert.equal((await req('/api/session','DELETE')).status,200);assert.equal((await req('/api/bootstrap')).status,401);
  assert.equal((await req('/app-factory/app-shell/server.cjs')).status,404);
  const index=await fetch(base+'/');assert.equal(index.status,200);assert.match(index.headers.get('content-security-policy'),/script-src 'self';/);
  const original=await fetch(base+'/app-factory/sites/godtabor/god.html');assert.equal(original.status,200);
  const status=await new Promise(resolve=>{require('node:http').get(base+'/healthz',{headers:{Host:'evil.example'}},r=>{r.resume();resolve(r.statusCode)})});assert.equal(status,403);
 }finally{await stop(server);rmSync(dir,{recursive:true,force:true})}
});

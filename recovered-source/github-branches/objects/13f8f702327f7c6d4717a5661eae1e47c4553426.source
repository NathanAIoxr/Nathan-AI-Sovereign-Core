'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createHash}=require('node:crypto');
const {makeHandler,MAGIC,LIMIT}=require('./server.cjs');
const TOKEN='Wrz-4A3a9z-qvEHd9ayHwAMJpbFxGwOj_U3uKLOv';
const digest=b=>createHash('sha256').update(b).digest('hex');
async function serverRun(action){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'one-lean-test-'));
 const server=http.createServer(makeHandler({token:TOKEN,dir,origins:['https://nathanaioxr.github.io']}));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port;
 try{await action({url,dir})}finally{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true})}
}
const auth={Authorization:'Bearer '+TOKEN};
test('exact ciphertext upload, digest receipt, list and restore backward roundtrip',async()=>serverRun(async({url})=>{
 const bytes=Buffer.concat([MAGIC,Buffer.from('☃️ archive with source integrity and encrypted payload test')]);const sha=digest(bytes);
 const put=async()=>fetch(url+'/v1/backups',{method:'POST',headers:{...auth,'Content-Type':'application/octet-stream','X-ONE-SHA256':sha},body:bytes});
 let r=await put();assert.equal(r.status,201);const first=await r.json();assert.deepEqual({status:first.status,bytes:first.bytes,sha256:first.sha256}, {status:'cloud_verified',bytes:bytes.length,sha256:sha});assert.equal(first.backup_verified,false);
 r=await put();assert.equal((await r.json()).already_existed,true);
 r=await fetch(url+'/v1/backups',{headers:auth});assert.equal(r.status,200);const list=await r.json();assert.equal(list.items.length,1);assert.equal(list.items[0].sha256,sha);
 r=await fetch(url+'/v1/backups/'+sha,{headers:auth});assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
 r=await fetch(url+'/v1/backups/'+sha.slice(0,63)+'0',{headers:auth});assert.equal(r.status,404);
}));
test('unauthorized reads and writes rejected; origin boundary enforced',async()=>serverRun(async({url})=>{
 const bytes=Buffer.concat([MAGIC,Buffer.from('private')]);const sha=digest(bytes);
 for(const request of [{},{headers:{Authorization:'Bearer wrong'}},{headers:{...auth,Origin:'https://malicious.example'}}]){
  const r=await fetch(url+'/v1/backups',{...request});assert.notEqual(r.status,200);
 }
 let r=await fetch(url+'/v1/backups',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-ONE-SHA256':sha},body:bytes});assert.equal(r.status,401);
 r=await fetch(url+'/healthz');assert.equal((await r.json()).backup_verified,false);
}));
test('wrong hash, unsealed file and wrong content type fail closed',async()=>serverRun(async({url,dir})=>{
 const bytes=Buffer.concat([MAGIC,Buffer.from('protected')]);const sha=digest(bytes);
 let r=await fetch(url+'/v1/backups',{method:'POST',headers:{...auth,'Content-Type':'application/octet-stream','X-ONE-SHA256':'0'.repeat(64)},body:bytes});assert.equal(r.status,422);
 r=await fetch(url+'/v1/backups',{method:'POST',headers:{...auth,'Content-Type':'application/octet-stream','X-ONE-SHA256':digest(Buffer.from('wrong'))},body:Buffer.from('wrong')});assert.equal(r.status,422);
 r=await fetch(url+'/v1/backups',{method:'POST',headers:{...auth,'Content-Type':'text/plain','X-ONE-SHA256':sha},body:bytes});assert.equal(r.status,415);
 assert.equal(LIMIT,140*1024*1024);
 r=await fetch(url+'/v1/backups',{headers:auth});assert.equal((await r.json()).items.length,0);
 const leftovers=await fs.readdir(path.join(dir,'backups'));assert.equal(leftovers.length,0);
}));
test('CORS permission only for intended client; no data leaked in cross-origin response',async()=>serverRun(async({url})=>{
 const r=await fetch(url+'/v1/backups',{method:'OPTIONS',headers:{Origin:'https://nathanaioxr.github.io','Access-Control-Request-Headers':'authorization,content-type,x-one-sha256'}});assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),'https://nathanaioxr.github.io');
 const denied=await fetch(url+'/v1/backups',{method:'OPTIONS',headers:{Origin:'https://evil.invalid'}});assert.equal(denied.status,403);assert.equal(denied.headers.get('access-control-allow-origin'),null);
}));
test('reject weak deploy secret',()=>assert.throws(()=>makeHandler({token:'replace-this-token',dir:'/data'})));

test('ONE iPhone UI contains wired cloud actions and valid inline JavaScript',async()=>{
 const vm=require('node:vm');
 const page=await fs.readFile(path.join(__dirname,'../offloader/index.html'),'utf8');
 for(const id of ['cloudURL','cloudKey','cloudPush','cloudList','cloudItems'])assert.match(page,new RegExp('id="'+id+'"'));
 const start=page.lastIndexOf('<script>'),end=page.lastIndexOf('</script>');assert.ok(end>start);const scripts=[page.slice(start+8,end)];
 assert.ok(scripts.length);for(const script of scripts)assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(page,/voiceSaving=true/);assert.match(page,/if\(recorder\?\.state==='recording'\|\|voiceSaving\)/);
});

test('declared oversized upload is rejected before any data is written',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'one-oversize-'));
 try{
  const handler=makeHandler({token:TOKEN,dir});
  let status;
  const req={method:'POST',url:'/v1/backups',headers:{authorization:'Bearer '+TOKEN,'content-type':'application/octet-stream','x-one-sha256':'0'.repeat(64),'content-length':String(LIMIT+1)}};
  const res={setHeader(){},writeHead(n){status=n},end(){}};
  await handler(req,res);assert.equal(status,413);
  await assert.rejects(()=>fs.stat(path.join(dir,'backups')),e=>e.code==='ENOENT');
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});

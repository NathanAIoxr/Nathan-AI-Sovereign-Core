'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const core=require('./engine.js'),backup=require('../../vault-backup.js');
function fakeIndexedDb(){
 const stores=new Map();
 return {open(){const req={};queueMicrotask(()=>{
 const db={objectStoreNames:{contains:n=>stores.has(n)},createObjectStore:(n)=>{stores.set(n,new Map())},close:()=>{},transaction:(n)=>{const tx={};tx.objectStore=()=>{const store=stores.get(n);return {
 get:k=>action(()=>store.get(k)),
 getAll:()=>action(()=>Array.from(store.values())),
 put:item=>action(()=>{store.set(item.id||item.name,item);return item.id||item.name}),
 delete:k=>action(()=>store.delete(k))
 }};function action(fn){const r={};queueMicrotask(()=>{try{r.result=fn();r.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())}catch(e){r.error=e;r.onerror?.();tx.onerror?.()}});return r}return tx}};
 req.result=db;req.onupgradeneeded?.();req.onsuccess?.()});return req}};
}
test('original-byte encrypted vault, backup, restore, and deliberate deletion',async()=>{
 globalThis.indexedDB=fakeIndexedDb();
 const vault=await core.Vault.open('sealing my complete originals with a secret');
 const input=new TextEncoder().encode('Exact, original, unchanged. 🎄');
 const meta=await vault.save(input,{title:'First original',project:'4T Clover',provider:'ChatGPT',coverage:'selected-content',name:'source.txt',mime:'text/plain',searchText:'Exact'});
 assert.equal(meta.size,input.length);assert.equal((await vault.list()).length,1);
 const fetched=await vault.original(meta.id);
 assert.deepEqual(Array.from(fetched.bytes),Array.from(input));assert.equal(meta.sha256,await core.sha256(input));
 const exported=await vault.exportBackup(backup);
 assert.equal(exported.count,1);assert.equal(new TextDecoder().decode(exported.bytes.slice(0,7)),'ONEVLT1');
 await assert.rejects(()=>vault.restoreBackup(exported.bytes,'wrong backup secret',backup),/Backup passphrase invalid/);
 await vault.erase(meta.id);assert.equal((await vault.list()).length,0);
 const r=await vault.restoreBackup(exported.bytes,'sealing my complete originals with a secret',backup);
 assert.equal(r.added,1);assert.equal((await vault.list()).length,1);
 const twice=await vault.restoreBackup(exported.bytes,'sealing my complete originals with a secret',backup);assert.equal(twice.skipped,1);
 vault.close();
 await assert.rejects(()=>core.Vault.open('a different password invalid'),/Incorrect passphrase/);
});
test('provider JSON indexing keeps original data; HTML never executes',()=>{
 const original=[{title:'My original chat',mapping:{a:{message:{create_time:1,author:{role:'user'},content:{parts:['First unchanged line']}}},b:{message:{create_time:2,author:{role:'assistant'},content:{parts:['Second unchanged line']}}}}}];
 const bytes=new TextEncoder().encode(JSON.stringify(original));
 const index=core.plainText(bytes,'conversations.json','application/json');
 assert.match(index,/user: First unchanged line/);assert.match(index,/assistant: Second unchanged line/);
 const html=new TextEncoder().encode('<script>alert(1)</script><h1>Welcome</h1>');
 assert.equal(core.plainText(html,'export.html','text/html').includes('alert(1)'),false);
 assert.equal(core.plainText(new Uint8Array([1,2,3]),'image.png','image/png'),'');
 assert.equal(core.safeMeta({title:'X'.repeat(1000)}).title.length,200);
});

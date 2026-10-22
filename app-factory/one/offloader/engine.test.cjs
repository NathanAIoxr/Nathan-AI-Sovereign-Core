'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const core=require('./engine.js'),backup=require('../../vault-backup.js');
function fakeIndexedDb(){
 const stores=new Map();
 globalThis.__oneAuditStores=stores;
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

test('reverse and upside-down Unicode input is byte-identical after retrieval',async()=>{
 globalThis.indexedDB=fakeIndexedDb();
 const v=await core.Vault.open('test passphrase for the mirror matrix');
 const sources=['STOMP, STOMP, CLAP, REST','ɐ q ɔ p ǝ ∀ Ɔ ɥ','🚂oOo🚂 🐲🦄 🎄','עברית العربية 日本語','a\\u0000b\\n<svg onload=alert(1)>',''];
 for(const value of sources){const bytes=new TextEncoder().encode(value);const saved=await v.save(bytes,{title:'mirror',name:'mirror.txt',mime:'text/plain',searchText:value});const result=await v.original(saved.id);assert.deepEqual(Array.from(result.bytes),Array.from(bytes));}
 const all=await v.list();
 for(const m of all.slice().reverse()){const result=await v.original(m.id);assert.equal(await core.sha256(result.bytes),m.sha256)}
 assert.equal(all.length,sources.length);v.close();
});
test('tampered ciphertext, tampered metadata, and wrong key fail closed',async()=>{
 globalThis.indexedDB=fakeIndexedDb();
 const v=await core.Vault.open('tamper proof audit passphrase');
 const saved=await v.save(new TextEncoder().encode('protect every original'),{title:'protected',name:'protected.txt',mime:'text/plain'});
 const rows=globalThis.__oneAuditStores.get('items'),row=rows.get(saved.id);
 const copy=new Uint8Array(row.original.data);copy[0]^=1;row.original.data=copy;
 await assert.rejects(()=>v.original(saved.id),/operation-specific|decrypt|OperationError|authentication|failed/i);
 // Corrupt metadata independently; listing must not silently omit the record.
 row.metadata.data=new Uint8Array(row.metadata.data);row.metadata.data[0]^=1;
 await assert.rejects(()=>v.list(),/operation-specific|decrypt|OperationError|authentication|failed/i);
 v.close();
 await assert.rejects(()=>core.Vault.open('incorrect tamper passphrase'),/Incorrect passphrase/);
});
test('oversized original rejected and encrypted backup alteration rejected',async()=>{
 globalThis.indexedDB=fakeIndexedDb();const pass='backup review passphrase secure';const v=await core.Vault.open(pass);
 await assert.rejects(()=>v.save(new Uint8Array(core.MAX_FILE+1)),/24 MB/);
 const src=new TextEncoder().encode('kept');const m=await v.save(src,{title:'a',name:'a.txt',mime:'text/plain'});
 const b=await v.exportBackup(backup);const changed=new Uint8Array(b.bytes);changed[changed.length-1]^=1;
 await assert.rejects(()=>v.restoreBackup(changed,pass,backup),/Backup passphrase invalid or backup damaged/);
 assert.deepEqual(Array.from((await v.original(m.id)).bytes),Array.from(src));
 v.close();
});
test('restore safely preserves collision with different original bytes',async()=>{
 globalThis.indexedDB=fakeIndexedDb();const pass='backward recovery passphrase';const v=await core.Vault.open(pass);
 const saved=await v.save(new TextEncoder().encode('First'),{title:'one',name:'one.txt',mime:'text/plain'});
 const b=await v.exportBackup(backup);await v.erase(saved.id);
 await v.save(new TextEncoder().encode('Second'),{title:'other',name:'other.txt',mime:'text/plain'},saved.id);
 const result=await v.restoreBackup(b.bytes,pass,backup);assert.equal(result.added,1);
 const list=await v.list();assert.equal(list.length,2);const texts=[];
 for(const m of list){texts.push(new TextDecoder().decode((await v.original(m.id)).bytes))}
 assert.deepEqual(texts.sort(),['First','Second']);
 v.close();
});

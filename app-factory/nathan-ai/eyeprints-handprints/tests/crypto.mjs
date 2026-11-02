import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const memory=new Map();
function openDB(){
  return {close(){},createObjectStore(){},transaction(_name,_mode){
    const tx={oncomplete:null,onerror:null,objectStore(){
      return {get(key){const req={};queueMicrotask(()=>{req.result=memory.get(key);req.onsuccess?.()});queueMicrotask(()=>tx.oncomplete?.());return req;},
      put(value,key){memory.set(key,structuredClone(value));queueMicrotask(()=>tx.oncomplete?.());},
      delete(key){memory.delete(key);queueMicrotask(()=>tx.oncomplete?.());}};
    }};return tx;}};
}
globalThis.indexedDB={open(){const req={};queueMicrotask(()=>{req.result=openDB();req.onupgradeneeded?.();req.onsuccess?.();});return req;}};
const V=await import('../vault.js');
assert.equal(await V.exists(),false);
await V.create('my local testing passphrase is long');
assert.equal(await V.exists(),true);
V.state().profiles.push({id:'profileA',name:'Nathan Test Person'});
await V.save();
const backup=await V.exportEncrypted();
assert.ok(backup.includes('handprints.encrypted.v3'));
assert.ok(!backup.includes('Nathan Test Person'));
V.lock();
await assert.rejects(V.unlock('not the right passphrase'));
await V.unlock('my local testing passphrase is long');
assert.equal(V.state().profiles[0].name,'Nathan Test Person');
await V.importEncrypted(backup);
await V.unlock('my local testing passphrase is long');
assert.equal(V.state().profiles[0].id,'profileA');
const hash=await V.digest(new TextEncoder().encode('abc'));
assert.equal(hash,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
await V.deleteVault();
assert.equal(await V.exists(),false);
console.log('PASS: vault create, AES-GCM save, encrypted backup confidentiality, wrong-passphrase rejection, reload, restore, SHA-256 and delete');

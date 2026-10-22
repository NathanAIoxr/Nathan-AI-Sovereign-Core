/* ONE / SEALED VOICE BOX — encrypted local AI offloader.
 * Browser IndexedDB is device-local. No cloud or third-party history access is claimed.
 * Every original is encrypted separately (AES-256-GCM) and SHA-256 checked on retrieval.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ONEOffloader=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const DB_NAME='tabor-one-sealed-offloader-v1', DB_VERSION=1;
const enc=new TextEncoder(),dec=new TextDecoder();
const MAX_FILE=24*1024*1024, MAX_INDEX=180000;
const MAGIC=new Uint8Array([79,78,69,86,76,84,49,0]); // ONEVLT1\0
const AAD_BACKUP=enc.encode('ONE-SEALED-BACKUP-V1');
const hex=u=>Array.from(u).map(x=>x.toString(16).padStart(2,'0')).join('');
function webcrypto(){if(!globalThis.crypto?.subtle||!globalThis.crypto?.getRandomValues)throw Error('Secure Web Crypto required: open on HTTPS');return globalThis.crypto}
function randomBytes(n){const b=new Uint8Array(n);webcrypto().getRandomValues(b);return b}
function id(){return globalThis.crypto?.randomUUID?.()||'one-'+hex(randomBytes(16))}
function asBytes(x){return x instanceof Uint8Array?x:x instanceof ArrayBuffer?new Uint8Array(x):null}
async function sha256(bytes){return hex(new Uint8Array(await webcrypto().subtle.digest('SHA-256',bytes)))}
async function keyFromPassphrase(pass,salt){if(typeof pass!=='string'||pass.length<12)throw Error('Use a passphrase of at least 12 characters');const k=await webcrypto().subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return webcrypto().subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function seal(key,bytes,aad){const iv=randomBytes(12);const data=await webcrypto().subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,bytes);return {iv:Array.from(iv),data}}
async function unseal(key,pack,aad){return new Uint8Array(await webcrypto().subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(pack.iv),additionalData:aad},key,pack.data))}
function openDB(){return new Promise((res,rej)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('settings'))d.createObjectStore('settings',{keyPath:'name'});if(!d.objectStoreNames.contains('items'))d.createObjectStore('items',{keyPath:'id'})};req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);req.onblocked=()=>rej(Error('Close other ONE tabs and retry'))})}
function request(db,store,mode,verb,arg){return new Promise((res,rej)=>{const tx=db.transaction(store,mode),r=tx.objectStore(store)[verb](arg);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);tx.onabort=()=>rej(tx.error||Error('Storage transaction aborted'))})}
function put(db,store,item){return request(db,store,'readwrite','put',item)}
function get(db,store,k){return request(db,store,'readonly','get',k)}
function all(db,store){return request(db,store,'readonly','getAll')}
function remove(db,store,k){return request(db,store,'readwrite','delete',k)}
function plainText(bytes,name,type){const t=String(type||'').toLowerCase(),n=String(name||'').toLowerCase();if(!(/text\/|json|xml|javascript|yaml|csv/.test(t)||/\.(txt|md|json|jsonl|csv|html|htm|xml|yaml|yml|js|ts|py|css|sql|log)$/i.test(n)))return '';
 const raw=dec.decode(bytes.slice(0,Math.min(bytes.length,2*1024*1024)));
 if(n.endsWith('.html')||n.endsWith('.htm'))return raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').slice(0,MAX_INDEX);
 if(n.endsWith('.json')&&raw.length<1500000){try{const parsed=JSON.parse(raw);
  // Only an index. The exact provider export is retained unchanged.
  if(Array.isArray(parsed)&&parsed.some(x=>x&&x.mapping)){let lines=[];for(const thread of parsed){lines.push(String(thread.title||''));const nodes=Object.values(thread.mapping||{}).filter(x=>x?.message).sort((a,b)=>(a.message.create_time||0)-(b.message.create_time||0));for(const node of nodes){const m=node.message,parts=m.content?.parts||[];const txt=parts.filter(p=>typeof p==='string').join(' ');if(txt)lines.push(String(m.author?.role||'speaker')+': '+txt)}if(lines.join('\n').length>MAX_INDEX)break}return lines.join('\n').slice(0,MAX_INDEX)}
  if(Array.isArray(parsed)&&parsed.some(x=>x&&x.chat_messages)){const lines=[];for(const thread of parsed){lines.push(String(thread.name||''));for(const m of thread.chat_messages||[]){lines.push(String(m.sender||'speaker')+': '+String(m.text||''))}}return lines.join('\n').slice(0,MAX_INDEX)}
  return JSON.stringify(parsed).slice(0,MAX_INDEX);
 }catch(e){/* malformed JSON remains preserved verbatim */}}
 return raw.slice(0,MAX_INDEX);
}
function safeMeta(raw){const v=(x,max)=>String(x??'').trim().slice(0,max);return {title:v(raw.title,200)||'Untitled original',project:v(raw.project,160)||'Unassigned',provider:v(raw.provider,80)||'Other',coverage:v(raw.coverage,50)||'selected-content',name:v(raw.name,240)||'original.bin',mime:v(raw.mime,120)||'application/octet-stream',searchText:v(raw.searchText,MAX_INDEX),origin:v(raw.origin,500),createdAt:v(raw.createdAt,40)||new Date().toISOString()}}
class Vault{
 constructor(db,key,salt){this.db=db;this.key=key;this.salt=salt}
 static async open(pass){const db=await openDB();try{let cfg=await get(db,'settings','vault');if(!cfg){if(pass.length<12)throw Error('New vault passphrase must contain at least 12 characters');const salt=randomBytes(16),key=await keyFromPassphrase(pass,salt);const proof=await seal(key,enc.encode('ONE-VOICE-LOCK-VERIFIER'),enc.encode('vault'));cfg={name:'vault',salt:Array.from(salt),proof};await put(db,'settings',cfg);return new Vault(db,key,salt)}
  const salt=new Uint8Array(cfg.salt),key=await keyFromPassphrase(pass,salt);const proof=await unseal(key,cfg.proof,enc.encode('vault'));if(dec.decode(proof)!=='ONE-VOICE-LOCK-VERIFIER')throw Error('Passphrase verification failed');return new Vault(db,key,salt)}
  catch(e){db.close();throw Error(e.name==='OperationError'?'Incorrect passphrase':e.message)}}
 close(){this.key=null;this.db.close()}
 assertOpen(){if(!this.key)throw Error('Vault is locked')}
 async save(raw,meta={},wantedId){this.assertOpen();const bytes=asBytes(raw);if(!bytes)throw Error('Expected original bytes');if(bytes.length>MAX_FILE)throw Error('A single item exceeds the 24 MB iPhone intake limit; retain it externally and import a smaller group');const uid=wantedId||id();const digest=await sha256(bytes),m={...safeMeta(meta),id:uid,sha256:digest,size:bytes.length};const b=await seal(this.key,bytes,enc.encode(uid+':original'));const a=await seal(this.key,enc.encode(JSON.stringify(m)),enc.encode(uid+':metadata'));await put(this.db,'items',{id:uid,original:b,metadata:a});return m}
 async meta(row){this.assertOpen();const bytes=await unseal(this.key,row.metadata,enc.encode(row.id+':metadata'));const m=JSON.parse(dec.decode(bytes));if(m.id!==row.id)throw Error('Metadata identity mismatch');return m}
 async list(){this.assertOpen();const rows=await all(this.db,'items'),items=[];for(const r of rows)items.push(await this.meta(r));return items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
 async original(uid){this.assertOpen();const r=await get(this.db,'items',uid);if(!r)throw Error('Original not found');const m=await this.meta(r),bytes=await unseal(this.key,r.original,enc.encode(uid+':original'));if(bytes.length!==m.size||await sha256(bytes)!==m.sha256)throw Error('Original SHA-256 verification FAILED');return {meta:m,bytes}}
 async erase(uid){this.assertOpen();if(!(await get(this.db,'items',uid)))throw Error('No such record');await remove(this.db,'items',uid)}
 async exportBackup(backup){this.assertOpen();if(!backup?.create)throw Error('Vault backup engine unavailable');const items=[];for(const m of await this.list()){const r=await this.original(m.id);items.push({record:{...r.meta,name:r.meta.name||r.meta.title},bytes:r.bytes})}if(!items.length)throw Error('No originals to export');const zipped=await backup.create(items);const sealed=await seal(this.key,zipped.bytes,AAD_BACKUP);const out=new Uint8Array(MAGIC.length+16+12+sealed.data.byteLength);out.set(MAGIC,0);out.set(this.salt,8);out.set(sealed.iv,24);out.set(new Uint8Array(sealed.data),36);return {bytes:out,count:items.length}}
 async restoreBackup(input,pass,backup){this.assertOpen();const bytes=asBytes(input);if(!bytes||bytes.length<52||!MAGIC.every((x,i)=>bytes[i]===x))throw Error('Not a ONE encrypted backup');const key=await keyFromPassphrase(pass,bytes.slice(8,24));let zip;try{zip=await unseal(key,{iv:Array.from(bytes.slice(24,36)),data:bytes.slice(36)},AAD_BACKUP)}catch(e){throw Error('Backup passphrase invalid or backup damaged')}if(!backup?.parse)throw Error('Backup reader unavailable');const archive=await backup.parse(zip);let added=0,skipped=0;for(const x of archive.items){const exists=await get(this.db,'items',x.record.id);if(exists){const old=await this.meta(exists);if(old.sha256===x.record.sha256){skipped++;continue}}
 const old=x.record;const newId=exists?id():old.id;await this.save(x.bytes,{...old,origin:exists?'Restored identity collision: '+old.id+' | '+(old.origin||''):old.origin},newId);added++}return {added,skipped,total:archive.items.length}}
}
return Object.freeze({Vault,sha256,plainText,safeMeta,MAX_FILE,MAX_INDEX,keyFromPassphrase});
});

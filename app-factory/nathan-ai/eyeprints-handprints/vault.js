/* EYEPRINTS × HANDPRINTS — encrypted local-first record store. No network operations. */
const DATABASE = 'eyeprints-handprints-v3';
const STORE = 'records';
const KEY = 'vault';
const ITERATIONS = 310000;
let sessionKey = null;
let session = null;

function dbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DATABASE, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function getRecord() {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
async function putRecord(record) {
  const db = await dbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record, KEY);
    tx.oncomplete = () => {db.close(); resolve();};
    tx.onerror = () => {db.close(); reject(tx.error);};
  });
}
function bytesToBase64(bytes) {
  let str=''; for (let i=0;i<bytes.length;i+=8192) str+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(str);
}
function base64ToBytes(encoded) {
  const s = atob(encoded); const out = new Uint8Array(s.length);
  for (let i=0;i<s.length;i++) out[i] = s.charCodeAt(i);
  return out;
}
async function derive(passphrase, salt) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(data, key) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('EYEPRINTS-HANDPRINTS:v3')},key,plaintext);
  return {iv:bytesToBase64(iv),data:bytesToBase64(new Uint8Array(ciphertext))};
}
async function unseal(payload,key) {
  const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(payload.iv),additionalData:new TextEncoder().encode('EYEPRINTS-HANDPRINTS:v3')},key,base64ToBytes(payload.data));
  return JSON.parse(new TextDecoder().decode(bytes));
}
function initialState() {
  return {schema:'eyeprints.handprints.v3',profiles:[],scans:[],ledger:[],documents:[],audit:[],researchNotes:[],created:new Date().toISOString()};
}
export async function exists() {return !!(await getRecord());}
export async function create(passphrase) {
  if (!crypto?.subtle) throw new Error('A secure context is needed for encrypted storage: use HTTPS or localhost.');
  if (typeof passphrase!=='string'||passphrase.length<12) throw new Error('Use a passphrase with at least 12 characters.');
  if (await getRecord()) throw new Error('A vault already exists. Unlock or import a backup.');
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const k=await derive(passphrase,salt);const state=initialState();
  const payload=await seal(state,k);
  await putRecord({schema:'handprints.encrypted.v3',kdf:'PBKDF2-SHA256',iterations:ITERATIONS,salt:bytesToBase64(salt),payload});
  sessionKey=k;session=state;return state;
}
export async function unlock(passphrase) {
  const record=await getRecord();if(!record)throw new Error('Create a vault first.');
  if(record.schema!=='handprints.encrypted.v3')throw new Error('Unsupported encrypted vault version.');
  const k=await derive(passphrase,base64ToBytes(record.salt));
  let data;try{data=await unseal(record.payload,k);}catch{throw new Error('Incorrect passphrase or damaged vault.');}
  if(data.schema!=='eyeprints.handprints.v3')throw new Error('Unsupported data version.');
  sessionKey=k;session=data;return session;
}
export function lock() {sessionKey=null;session=null;}
export function state() {if(!session)throw new Error('Unlock the vault first.');return session;}
export function isUnlocked(){return !!session;}
let saveQueue=Promise.resolve();
export async function save() {
  if(!sessionKey||!session)throw new Error('Vault is locked.');
  // Queue saves; keep a serialized point-in-time snapshot for each encryption.
  const snapshot=structuredClone(session), k=sessionKey;
  saveQueue=saveQueue.catch(()=>{}).then(async()=>{
    const old=await getRecord();
    if(!old||old.schema!=='handprints.encrypted.v3') throw new Error('Vault missing.');
    await putRecord({...old,payload:await seal(snapshot,k)});
  });
  return saveQueue;
}
export async function exportEncrypted() {
  await saveQueue;
  const record=await getRecord();
  if(!record) throw new Error('No saved vault.');
  return JSON.stringify({format:'EYEPRINTS_HANDPRINTS_ENCRYPTED_BACKUP',exported:new Date().toISOString(),record},null,2);
}
export async function importEncrypted(raw) {
  await saveQueue;
  const parsed=JSON.parse(raw);
  if(parsed.format!=='EYEPRINTS_HANDPRINTS_ENCRYPTED_BACKUP'||parsed.record?.schema!=='handprints.encrypted.v3')throw new Error('Not a supported encrypted backup.');
  const r=parsed.record;
  if(!r.salt||!r.payload?.iv||!r.payload?.data||r.iterations!==ITERATIONS)throw new Error('Backup data is incomplete or unsupported.');
  // Check base64 decoding, basic ciphertext limits; authentication occurs at unlock.
  if(r.payload.data.length>100000000)throw new Error('Backup exceeds this version’s safety limit.');
  base64ToBytes(r.salt);base64ToBytes(r.payload.iv);
  lock(); await putRecord(r);
}
export async function deleteVault() {
  await saveQueue;
  lock();const db=await dbOpen();await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(KEY);
    tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
  });db.close();
}
export async function digest(buffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))).map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function newId(){return crypto.randomUUID();}

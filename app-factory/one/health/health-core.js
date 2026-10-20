/* ONE — Health & Recovery, author Nathan Tabor.
 * Private, local-first browser module; NO health source files, PHI, API keys, or provider access in this repository.
 * Original bytes are encrypted BEFORE IndexedDB persistence. Password never persisted.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ONEHealth=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const DB='one-health-private-v1', FILE_LIMIT=100*1024*1024, TOTAL_LIMIT=155*1024*1024, COUNT_LIMIT=500;
const ALLOWED=/\.(?:png|jpg|jpeg|webp|pdf|txt|md|docx|csv|json)$/i;
const enc=new TextEncoder(),dec=new TextDecoder();
function bytes(v){return v instanceof Uint8Array?v:new Uint8Array(v);}
function crc32(a){let c=-1;for(const b of a){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xEDB88320:0);}return(c^-1)>>>0;}
function safePath(path){const p=String(path||'');if(!p||p.startsWith('/')||p.includes('\\')||/[\u0000-\u001f]/.test(p)||p.split('/').some(x=>x==='..'||x==='.')||p.length>800)return null;return p;}
function fileName(path){const p=safePath(path);return p?p.slice(p.lastIndexOf('/')+1):null;}
function category(name){const s=String(name).toLowerCase();if(/bath|tub|soak|essential.oil|salt|vinegar|water.temperature/.test(s))return 'Bath Systems';if(/spine|neck|cervical|surgery|pain|muscle|health|medical|recovery|chronolog|md:|be an md|cocaine/.test(s))return 'Health & Recovery';if(/trauma|healing|whole|new creature|reset/.test(s))return 'Healing & Reflections';if(/catalog|registry|index|manifest|project|engineering/.test(s))return 'Technical & Source Indexes';return 'Unsorted';}
function permitted(name){return Boolean(name&&ALLOWED.test(name));}
function read16(a,p){return a[p]|(a[p+1]<<8);}
function read32(a,p){return (a[p]|(a[p+1]<<8)|(a[p+2]<<16)|(a[p+3]<<24))>>>0;}
async function expand(raw,maxBytes){if(typeof DecompressionStream!=='function')throw Error('This browser cannot expand ZIP deflate safely. Extract the ZIP locally and select its files or folder.');const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));const reader=stream.getReader();const chunks=[];let length=0;try{for(;;){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>maxBytes)throw Error('ZIP member exceeds safe uncompressed size');chunks.push(value);}}catch(err){await reader.cancel().catch(()=>{});throw err;}const all=new Uint8Array(length);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}return all;}
async function readZip(input){
 const a=bytes(input);if(a.length>160*1024*1024)throw Error('ZIP archive is over the current import limit');
 let end=-1;for(let i=a.length-22;i>=Math.max(0,a.length-65557);i--){if(read32(a,i)===0x06054b50){end=i;break;}}
 if(end<0)throw Error('ZIP end-of-directory not found');
 const count=read16(a,end+10),centralSize=read32(a,end+12),central=read32(a,end+16);
 if(count>COUNT_LIMIT||read16(a,end+8)!==count||central+centralSize>end)throw Error('Unsupported ZIP directory');
 let p=central,total=0;const found=[];const paths=new Set();
 for(let i=0;i<count;i++){
  if(p+46>a.length||read32(a,p)!==0x02014b50)throw Error('Invalid ZIP entry header');
  const flags=read16(a,p+8),method=read16(a,p+10),expectedCrc=read32(a,p+16),compressed=read32(a,p+20),size=read32(a,p+24);
  const nl=read16(a,p+28),extra=read16(a,p+30),comment=read16(a,p+32),at=read32(a,p+42);
  if(p+46+nl+extra+comment>a.length||flags&1||size>FILE_LIMIT||compressed>FILE_LIMIT||at+30>a.length)throw Error('Unsafe ZIP entry');
  const path=dec.decode(a.slice(p+46,p+46+nl));p+=46+nl+extra+comment;
  if(path.endsWith('/'))continue;
  const name=fileName(path);if(!name||paths.has(path))throw Error('Unsafe or duplicate ZIP path');paths.add(path);
  if(!permitted(name))continue;
  total+=size;if(total>TOTAL_LIMIT)throw Error('Uncompressed import exceeds 155 MB');
  if(read32(a,at)!==0x04034b50||read16(a,at+8)!==method)throw Error('Invalid ZIP local file header');
  const start=at+30+read16(a,at+26)+read16(a,at+28);
  if(start+compressed>a.length)throw Error('Truncated ZIP entry');
  const raw=a.slice(start,start+compressed);
  const output=method===0?raw:method===8?await expand(raw,size):null;
  if(!output||output.length!==size||crc32(output)!==expectedCrc)throw Error('ZIP member failed integrity checks: '+name);
  found.push({name,path,content:output});
 }
 return found;
}
async function shaHex(a){const d=await crypto.subtle.digest('SHA-256',bytes(a));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function asArray(v){return Array.from(new Uint8Array(v));}
async function derive(pass,salt){return crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(salt),iterations:310000,hash:'SHA-256'},await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']),{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function seal(key,raw){const iv=crypto.getRandomValues(new Uint8Array(12));const value=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes(raw));return {iv:asArray(iv),cipher:value};}
async function unseal(key,packed){const val=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(packed.iv)},key,packed.cipher);return new Uint8Array(val);}
function reqResult(request){return new Promise((ok,no)=>{request.onsuccess=()=>ok(request.result);request.onerror=()=>no(request.error||Error('Local database failed'));});}
class PrivateHealthVault {
 constructor(){this.db=null;this.key=null;}
 async open(){if(!crypto?.subtle||!rootIndexedDB())throw Error('Secure WebCrypto and IndexedDB are required');this.db=await new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore('settings');r.result.createObjectStore('records',{keyPath:'id'});};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});return this;}
 _store(name,mode='readonly'){if(!this.db)throw Error('Private vault not open');return this.db.transaction(name,mode).objectStore(name);}
 async _get(name,id){return reqResult(this._store(name).get(id));}
 async _put(name,v,id){const store=this._store(name,'readwrite');return reqResult(id===undefined?store.put(v):store.put(v,id));}
 async _all(){return reqResult(this._store('records').getAll());}
 async exists(){return Boolean(await this._get('settings','check'));}
 async setup(pass){if(await this.exists())throw Error('A private vault already exists. Unlock it instead.');if(typeof pass!=='string'||pass.length<12)throw Error('Use a private passphrase of at least 12 characters');const salt=crypto.getRandomValues(new Uint8Array(16));const key=await derive(pass,salt),check=await seal(key,enc.encode('ONE_HEALTH_PRIVATE_V1'));await this._put('settings',asArray(salt),'salt');await this._put('settings',check,'check');this.key=key;return true;}
 async unlock(pass){if(!await this.exists())throw Error('Create the private vault first');const salt=await this._get('settings','salt'),check=await this._get('settings','check');try{const key=await derive(pass,new Uint8Array(salt));if(dec.decode(await unseal(key,check))!=='ONE_HEALTH_PRIVATE_V1')throw Error();this.key=key;return true;}catch{throw Error('Unable to unlock. Check the passphrase.');}}
 lock(){this.key=null;}
 _require(){if(!this.key)throw Error('Unlock the private vault first');}
 async list(){this._require();const records=await this._all(),out=[];for(const x of records){try{out.push(JSON.parse(dec.decode(await unseal(this.key,x.meta))));}catch{throw Error('An encrypted record could not be authenticated');}}return out.sort((a,b)=>(b.addedAt||'').localeCompare(a.addedAt||''));}
 async addFile(name,raw,path){this._require();const n=fileName(name),p=safePath(path||name);if(!n||!p||!permitted(n))throw Error('Unsupported file or unsafe path');const content=bytes(raw);if(content.length>FILE_LIMIT)throw Error('File too large');const digest=await shaHex(content);if(await this._get('records',digest))return {duplicate:true,id:digest};const meta={id:digest,kind:'original',name:n,path:p,category:category(p),size:content.length,sha256:digest,addedAt:new Date().toISOString(),sourceType:'user_imported_original',claimStatus:'source_not_independently_verified'};const item={id:digest,meta:await seal(this.key,enc.encode(JSON.stringify(meta))),data:await seal(this.key,content)};await this._put('records',item);return {duplicate:false,id:digest};}
 async addEntry(kind,title,description,date){this._require();if(!['recovery_note','bath_formula','timeline'].includes(kind))throw Error('Invalid note type');if(!String(title).trim()||String(title).length>180||String(description).length>5000)throw Error('Title or note exceeds limits');const id='entry-'+crypto.randomUUID();const meta={id,kind,name:String(title).trim(),description:String(description),date:String(date||''),category:kind==='bath_formula'?'Bath Systems':'Health & Recovery',addedAt:new Date().toISOString(),sourceType:'user_created',claimStatus:'personal_account_not_clinically_verified'};await this._put('records',{id,meta:await seal(this.key,enc.encode(JSON.stringify(meta))),data:await seal(this.key,new Uint8Array(0))});return {id};}
 async importBackupEntry(given,raw){
 this._require();if(!given||typeof given!=='object')throw Error('Invalid backup entry');
 const content=bytes(raw),kind=given.kind;
 let meta,id;
 if(kind==='original'){
   const n=fileName(given.name),p=safePath(given.path||given.name);if(!n||!p||!permitted(n)||content.length>FILE_LIMIT)throw Error('Invalid original in backup');
   id=await shaHex(content);if(given.sha256!==id||given.size!==content.length)throw Error('Backup source digest mismatch');
   meta={id,kind:'original',name:n,path:p,category:category(p),size:content.length,sha256:id,addedAt:String(given.addedAt||new Date().toISOString()).slice(0,40),sourceType:'user_imported_original',claimStatus:'source_not_independently_verified'};
 }else if(['recovery_note','bath_formula','timeline'].includes(kind)){
   if(content.length!==0||typeof given.name!=='string'||given.name.length>180||typeof given.description!=='string'||given.description.length>5000)throw Error('Invalid authored note in backup');
   id=typeof given.id==='string'&&/^entry-[0-9a-f-]{36}$/.test(given.id)?given.id:'entry-'+crypto.randomUUID();
   meta={id,kind,name:given.name,description:given.description,date:String(given.date||'').slice(0,10),category:kind==='bath_formula'?'Bath Systems':'Health & Recovery',addedAt:String(given.addedAt||new Date().toISOString()).slice(0,40),sourceType:'user_created',claimStatus:'personal_account_not_clinically_verified'};
 }else throw Error('Unrecognized health backup entry');
 if(await this._get('records',id))return {duplicate:true,id};
 await this._put('records',{id,meta:await seal(this.key,enc.encode(JSON.stringify(meta))),data:await seal(this.key,content)});return {duplicate:false,id};
 }
 async read(id){this._require();const item=await this._get('records',id);if(!item)throw Error('Record missing');return {meta:JSON.parse(dec.decode(await unseal(this.key,item.meta))),content:await unseal(this.key,item.data)};}
 async updateCategory(id,value){this._require();const allowed=['Bath Systems','Health & Recovery','Healing & Reflections','Technical & Source Indexes','Unsorted'];if(!allowed.includes(value))throw Error('Unknown category');const item=await this._get('records',id);if(!item)throw Error('Record missing');const meta=JSON.parse(dec.decode(await unseal(this.key,item.meta)));meta.category=value;item.meta=await seal(this.key,enc.encode(JSON.stringify(meta)));await this._put('records',item);}
 async clear(){this._require();await reqResult(this._store('records','readwrite').clear());}
}
function rootIndexedDB(){return typeof indexedDB!=='undefined';}
return Object.freeze({PrivateHealthVault,readZip,fileName,safePath,category,permitted,shaHex,crc32,FILE_LIMIT,TOTAL_LIMIT});
});
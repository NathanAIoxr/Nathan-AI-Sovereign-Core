/* Universal Creator Vault original-byte portable ZIP backup.
 * Self-contained ZIP-store writer/reader, CRC32 + SHA-256 + anti-zip-bomb limits.
 * No network; backups must be manually saved to a secure owner-controlled location.
 */
(function(root,factory){'use strict';const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.TaborVaultBackup=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const enc=new TextEncoder(),dec=new TextDecoder();
const MAX_TOTAL=140*1024*1024,MAX_FILES=5000,MAX_FILE=120*1024*1024;
function shaHex(bytes){if(!globalThis.crypto?.subtle)throw Error('Cryptographic SHA-256 unavailable');return crypto.subtle.digest('SHA-256',bytes).then(arr=>[...new Uint8Array(arr)].map(x=>x.toString(16).padStart(2,'0')).join(''))}
function crc32(bytes){let c=-1;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^-1)>>>0}
function write16(a,i,v){a[i]=v&255;a[i+1]=(v>>>8)&255}
function write32(a,i,v){write16(a,i,v);write16(a,i+2,v>>>16)}
function read16(a,i){return a[i]|(a[i+1]<<8)}
function read32(a,i){return (a[i]|a[i+1]<<8|a[i+2]<<16|(a[i+3]<<24))>>>0}
function toBytes(value){if(value instanceof Uint8Array)return value;if(value instanceof ArrayBuffer)return new Uint8Array(value);throw Error('Expected original binary bytes')}
function zipStored(entries){
 if(!Array.isArray(entries)||entries.length>MAX_FILES)throw Error('Too many files for a portable backup');
 let count=0;const all=[];for(const e of entries){if(!/^(manifest\.json|files\/[0-9]{5}\.bin)$/.test(e.name))throw Error('Unsafe backup entry name');const data=toBytes(e.bytes),name=enc.encode(e.name);if(data.length>MAX_FILE)throw Error('Original too large for this single mobile backup');count+=data.length+name.length+110;if(count>MAX_TOTAL)throw Error('Archive exceeds 140 MB device-safe limit: export fewer originals');all.push({name,data,n:name.length,crc:crc32(data)})}
 const result=new Uint8Array(count+256);let p=0;const central=[];
 for(const e of all){const at=p;write32(result,p,0x04034b50);write16(result,p+4,20);write16(result,p+6,0x0800);write16(result,p+8,0);write32(result,p+14,e.crc);write32(result,p+18,e.data.length);write32(result,p+22,e.data.length);write16(result,p+26,e.n);write16(result,p+28,0);p+=30;result.set(e.name,p);p+=e.n;result.set(e.data,p);p+=e.data.length;central.push({...e,at})}
 const dirStart=p;for(const e of central){write32(result,p,0x02014b50);write16(result,p+4,20);write16(result,p+6,20);write16(result,p+8,0x0800);write16(result,p+10,0);write32(result,p+16,e.crc);write32(result,p+20,e.data.length);write32(result,p+24,e.data.length);write16(result,p+28,e.n);write32(result,p+42,e.at);p+=46;result.set(e.name,p);p+=e.n}
 const dirSize=p-dirStart;write32(result,p,0x06054b50);write16(result,p+8,central.length);write16(result,p+10,central.length);write32(result,p+12,dirSize);write32(result,p+16,dirStart);p+=22;return result.slice(0,p);
}
function unzipStored(bytes){
 const a=toBytes(bytes);if(a.length>MAX_TOTAL+1024)throw Error('Backup too large');let offset=-1;for(let i=a.length-22;i>=Math.max(0,a.length-65557);i--)if(read32(a,i)===0x06054b50){offset=i;break}if(offset<0)throw Error('ZIP end marker missing');
 const n=read16(a,offset+10),dir=read32(a,offset+16);if(n>MAX_FILES)throw Error('Too many ZIP files');let p=dir,total=0;const found=new Map();
 for(let i=0;i<n;i++){if(p+46>a.length||read32(a,p)!==0x02014b50)throw Error('Corrupt central directory');const flags=read16(a,p+8),method=read16(a,p+10),crc=read32(a,p+16),len=read32(a,p+20),size=read32(a,p+24),nl=read16(a,p+28),extra=read16(a,p+30),comment=read16(a,p+32),pos=read32(a,p+42);
 if(method!==0||flags&1||len!==size||size>MAX_FILE||pos+30>a.length)throw Error('Unsupported or unsafe ZIP member');if(p+46+nl+extra+comment>a.length)throw Error('Bad member index');const name=dec.decode(a.subarray(p+46,p+46+nl));if(!/^(manifest\.json|files\/[0-9]{5}\.bin)$/.test(name)||found.has(name))throw Error('Unexpected or duplicate backup filename');const localNameLen=read16(a,pos+26),localExtra=read16(a,pos+28),dataStart=pos+30+localNameLen+localExtra;if(dataStart+size>a.length||read32(a,pos)!==0x04034b50)throw Error('Corrupt member');const actualName=dec.decode(a.subarray(pos+30,pos+30+localNameLen));if(actualName!==name)throw Error('Conflicting local member name');const data=a.slice(dataStart,dataStart+size);if(crc32(data)!==crc)throw Error('Corrupt ZIP CRC');total+=size;if(total>MAX_TOTAL)throw Error('ZIP exceeds maximum unpack size');found.set(name,data);p+=46+nl+extra+comment}
 return found;
}
async function create(items){
 if(!Array.isArray(items)||!items.length||items.length>MAX_FILES-1)throw Error('Select 1 to 4999 complete originals to back up');
 const manifest={schema:'tabor123.vault-full-backup.v1',createdAt:new Date().toISOString(),count:items.length,records:[]};
 const entries=[];let total=0;
 for(let i=0;i<items.length;i++){
  const x=items[i],r=x?.record;if(!r||typeof r.id!=='string'||!r.id||typeof r.name!=='string')throw Error('Record metadata missing');
  let raw=toBytes(x.bytes);if(raw.length>MAX_FILE)throw Error('Cannot back up oversized original '+r.name);
  total+=raw.length;if(total>MAX_TOTAL-1024*1024)throw Error('Selected originals exceed mobile ZIP limit. Export smaller groups.');
  const digest=await shaHex(raw),member='files/'+String(i+1).padStart(5,'0')+'.bin';const known=r.sha256;
  if(known&&known!==digest)throw Error('Stored original digest mismatch: '+r.name);
  const saved={...r,sha256:digest};manifest.records.push({meta:saved,member,sha256:digest,bytes:raw.length});entries.push({name:member,bytes:raw});
 }
 const json=enc.encode(JSON.stringify(manifest));entries.unshift({name:'manifest.json',bytes:json});
 return {bytes:zipStored(entries),manifest};
}
async function parse(zip){
 const members=unzipStored(zip);const manifestBytes=members.get('manifest.json');if(!manifestBytes||manifestBytes.byteLength>8*1024*1024)throw Error('Missing or oversized backup manifest');
 const manifest=JSON.parse(dec.decode(manifestBytes));if(manifest.schema!=='tabor123.vault-full-backup.v1'||!Array.isArray(manifest.records)||manifest.count!==manifest.records.length||members.size!==manifest.records.length+1)throw Error('Backup manifest inconsistent');
 const extracted=[];const ids=new Set(),used=new Set();
 for(const x of manifest.records){if(!x||typeof x.meta?.id!=='string'||ids.has(x.meta.id)||used.has(x.member)||!/^files\/[0-9]{5}\.bin$/.test(x.member))throw Error('Duplicate or malformed original identity');ids.add(x.meta.id);used.add(x.member);
 const bytes=members.get(x.member);if(!bytes||bytes.length!==x.bytes||x.bytes<0)throw Error('Original byte length missing or mismatched');const digest=await shaHex(bytes);if(digest!==x.sha256||x.meta.sha256!==digest)throw Error('Original SHA-256 mismatch for '+x.meta.name);extracted.push({record:x.meta,bytes})}
 return {manifest,items:extracted};
}
function planBatches(records,capBytes=95*1024*1024){
 if(!Array.isArray(records)||!Number.isSafeInteger(capBytes)||capBytes<=0||capBytes>120*1024*1024)throw Error('Invalid backup group capacity');
 const groups=[];let current=[],size=0;
 for(const r of records){
  if(!r||typeof r.id!=='string'||!Number.isSafeInteger(r.size)||r.size<0)throw Error('Invalid original record size');
  if(r.size>capBytes)throw Error('One original exceeds this mobile backup limit: '+r.name+' ('+r.size+' bytes). Download it individually and verify its own checksum.');
  if(current.length&&(size+r.size>capBytes||current.length>=1000)){groups.push(current);current=[];size=0}
  current.push(r);size+=r.size;
 }
 if(current.length)groups.push(current);
 return groups;
}
return Object.freeze({create,parse,zipStored,unzipStored,crc32,MAX_TOTAL,planBatches});
});
/* Nathan AI / ONE 007 — opt-in, additive local install.
 * No network, no publication, no deletion or replacement of existing records.
 */
(function(root,factory){"use strict";const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.ONE007Installer=api;})(typeof globalThis==="object"?globalThis:null,function(){"use strict";
const DB="tabor-one-private-master-library-v1";
function plan(pack,hash,filename){
 if(!pack||pack.schema!=="one.library.private-pack.v1"||pack.privacy!=="OWNER ONLY"||pack.publication_permission!=="NOT GRANTED"||!Array.isArray(pack.records))throw new TypeError("Unpublished private ONE pack required");
 if(typeof hash!=="string"||!/^[a-f0-9]{64}$/.test(hash))throw new TypeError("SHA-256 fingerprint required");
 if(pack.records.length>30000)throw new RangeError("Oversized index");
 const seen=new Set();
 const records=pack.records.map((raw,i)=>{
   if(!raw||typeof raw.key!=="string"||!raw.key||typeof raw.title!=="string")throw new TypeError("Bad source row");
   if(seen.has(raw.key))throw new TypeError("Duplicate original key");
   seen.add(raw.key);
   const str=(v,max=160)=>String(v??"").slice(0,max);
   const shelf=/^(101|201|301|401|501|601|701|801|901)$/.test(String(raw.shelf||""))?String(raw.shelf):"101";
   const originalId=str(raw.key,220);
   return {id:hash+":source:"+originalId,sourceId:hash,originalId,title:str(raw.title,500),description:str(raw.summary??raw.description??raw.note??"",3000),section:str(raw.section??raw.family??raw.collection??"",450),shelf,shelfAssignment:raw.shelf?"supplied or pre-existing index":"editorial discovery only",kind:"source",stage:str(raw.status??raw.record_stage??raw.status_original??"unverified",240),privacy:str(raw.privacy??"private imported source",120),provenance:str(raw.source??raw.source_name??filename,350),fullText:typeof raw.content==="string"?raw.content:null,original:raw};
 });
 return {sourceId:hash,records};
}
function database(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{const d=req.result;for(const name of ["records","sources"])if(!d.objectStoreNames.contains(name))d.createObjectStore(name,{keyPath:"id"})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function install(file,pack){
 if(!file||typeof file.arrayBuffer!=="function")throw new TypeError("Select the original JSON file first");
 if(!globalThis.crypto?.subtle||!globalThis.indexedDB)throw new Error("Use HTTPS in Nathan AI to install browser-local records");
 const bytes=await file.arrayBuffer();
 if(bytes.byteLength>16000000)throw new RangeError("File too large");
 const digest=await crypto.subtle.digest("SHA-256",bytes);
 const hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");
 const planned=plan(pack,hash,file.name);
 const db=await database();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(["records","sources"],"readwrite"),records=tx.objectStore("records"),sources=tx.objectStore("sources");
  let added=0,skipped=0;
  // Both the original JSON Blob and every original metadata row remain recoverable.
  const checkSource=sources.get(hash);
  checkSource.onsuccess=()=>{
    if(!checkSource.result)sources.add({id:hash,name:file.name,size:bytes.byteLength,sha256:hash,importedAt:new Date().toISOString(),blob:new Blob([bytes],{type:"application/json"})});
    for(const row of planned.records){
      const get=records.get(row.id);
      get.onsuccess=()=>{if(get.result){skipped++}else{records.add(row);added++}};
    }
  };
  tx.oncomplete=()=>resolve({added,skipped,sourceHash:hash});
  tx.onerror=()=>reject(tx.error||new Error("Local install failed"));
  tx.onabort=()=>reject(tx.error||new Error("Local install aborted"));
 })}finally{db.close()}
}
return Object.freeze({plan,install});
});

"use strict";
// Browser-profile storage only. No network, analytics, or persistence outside IndexedDB.
// Acoustic metadata is NOT encrypted; optional raw audio is encrypted separately.
window.NathanVoiceStore = (() => {
  const dbName="nathan-voicebox-private-v1";
  function db() {
    return new Promise((resolve,reject)=>{
      const open=indexedDB.open(dbName,1);
      open.onupgradeneeded=()=>{
        const store=open.result;
        for(const name of ["profiles","languages","registry"])
          if(!store.objectStoreNames.contains(name))store.createObjectStore(name,{keyPath:"id"});
      };
      open.onsuccess=()=>resolve(open.result);
      open.onerror=()=>reject(open.error||Error("IndexedDB unavailable"));
    });
  }
  async function transaction(store,mode,action){
    const database=await db();
    return new Promise((resolve,reject)=>{
      const tx=database.transaction(store,mode);
      const request=action(tx.objectStore(store));
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||Error("Local database operation failed"));
      tx.oncomplete=()=>database.close();
      tx.onabort=()=>database.close();
    });
  }
  return {
    put:(store,obj)=>transaction(store,"readwrite",s=>s.put(obj)),
    get:(store,id)=>transaction(store,"readonly",s=>s.get(id)),
    all:(store)=>transaction(store,"readonly",s=>s.getAll()),
    remove:(store,id)=>transaction(store,"readwrite",s=>s.delete(id)),
  };
})();

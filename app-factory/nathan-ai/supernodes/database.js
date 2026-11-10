/* 732m SUPERNODES — each logical ID owns a separate keyspace.
 * Physical storage is ONE browser-local IndexedDB, not 732m allocated DBs.
 */
(function(root,factory){
  "use strict";
  const api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.NathanSupernodeDatabase=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const DATABASE_NAME="nathan-ai.732m-supernodes.local.v1";
  const DATABASE_VERSION=1;
  const core=typeof module==="object"&&module.exports?require("./engine.js"):root.NathanSupernodes;
  function safeId(value){return core.id(value);}
  function copy(value){return value===undefined?null:JSON.parse(JSON.stringify(value));}
  function recordCheck(id,record){if(!record||record.nodeId!==id)throw Error("Cross-node record write rejected");}
  function memory(){
    const nodes=new Map(),knowledge=new Map(),incidents=new Map();
    const getMap=(parent,id)=>{if(!parent.has(id))parent.set(id,new Map());return parent.get(id);};
    return Object.freeze({
      kind:"IN_MEMORY_TEST_ADAPTER",
      async getNode(id){return copy(nodes.get(safeId(id)));},
      async putNode(node){core.validateNode(node);nodes.set(node.id,copy(node));return copy(node);},
      async addKnowledge(nodeId,record){
        const id=safeId(nodeId);recordCheck(id,record);
        const key="K"+(getMap(knowledge,id).size+1);
        const value={...copy(record),key};getMap(knowledge,id).set(key,value);return copy(value);
      },
      async addIncident(nodeId,record){
        const id=safeId(nodeId);recordCheck(id,record);
        const key="I"+(getMap(incidents,id).size+1);
        const value={...copy(record),key};getMap(incidents,id).set(key,value);return copy(value);
      },
      async updateIncident(nodeId,record){
        const id=safeId(nodeId);recordCheck(id,record);
        if(!record.key||!getMap(incidents,id).has(record.key))throw Error("Incident is not present in this node");
        getMap(incidents,id).set(record.key,copy(record));return copy(record);
      },
      async listKnowledge(id){return [...getMap(knowledge,safeId(id)).values()].map(copy);},
      async listIncidents(id){return [...getMap(incidents,safeId(id)).values()].map(copy);},
      async clearNode(id){id=safeId(id);nodes.delete(id);knowledge.delete(id);incidents.delete(id);return true;},
      async exportNode(id){id=safeId(id);return {node:await this.getNode(id),
        knowledge:await this.listKnowledge(id),incidents:await this.listIncidents(id)};}
    });
  }
  async function browser(){
    if(!root.indexedDB||!root.IDBKeyRange)throw Error("IndexedDB is unavailable; no node data were saved");
    const db=await new Promise((resolve,reject)=>{
      const req=root.indexedDB.open(DATABASE_NAME,DATABASE_VERSION);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains("nodes"))db.createObjectStore("nodes",{keyPath:"id"});
        for(const name of ["knowledge","incidents"]){
          if(!db.objectStoreNames.contains(name)){
            const store=db.createObjectStore(name,{keyPath:["nodeId","key"]});
            store.createIndex("byNode","nodeId",{unique:false});
          }
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||Error("Unable to open local database"));
    });
    function transaction(names,mode,work){
      return new Promise((resolve,reject)=>{
        let output=null;
        const tx=db.transaction(names,mode);
        tx.oncomplete=()=>resolve(copy(output));
        tx.onerror=()=>reject(tx.error||Error("Database transaction failed"));
        tx.onabort=()=>reject(tx.error||Error("Database transaction aborted"));
        try{work(tx,function(value){output=value;});}catch(error){tx.abort();reject(error);}
      });
    }
    function key(){if(!root.crypto||typeof root.crypto.randomUUID!=="function")
      throw Error("Secure local record identifiers unavailable");return root.crypto.randomUUID();}
    function list(storeName,id){
      id=safeId(id);
      return transaction([storeName],"readonly",(tx,done)=>{
        const req=tx.objectStore(storeName).index("byNode").getAll(root.IDBKeyRange.only(id));
        req.onsuccess=()=>done(req.result);
      });
    }
    async function getNode(id){
      id=safeId(id);
      return transaction(["nodes"],"readonly",(tx,done)=>{
        const req=tx.objectStore("nodes").get(id);
        req.onsuccess=()=>done(req.result||null);
      });
    }
    function putNode(node){
      core.validateNode(node);
      return transaction(["nodes"],"readwrite",(tx,done)=>{
        tx.objectStore("nodes").put(copy(node));done(node);
      });
    }
    function add(storeName,nodeId,record){
      const id=safeId(nodeId);recordCheck(id,record);
      return transaction([storeName],"readwrite",(tx,done)=>{
        const value={...copy(record),key:key()};
        tx.objectStore(storeName).add(value);done(value);
      });
    }
    function updateIncident(nodeId,record){
      const id=safeId(nodeId);recordCheck(id,record);
      if(typeof record.key!=="string"||!record.key)throw Error("An existing incident key is required");
      return transaction(["incidents"],"readwrite",(tx,done)=>{
        const store=tx.objectStore("incidents");
        const req=store.get([id,record.key]);
        req.onsuccess=()=>{
          if(!req.result){tx.abort();return;}
          store.put(copy(record));done(record);
        };
      });
    }
    function clearNode(value){
      const id=safeId(value);
      return transaction(["nodes","knowledge","incidents"],"readwrite",(tx,done)=>{
        tx.objectStore("nodes").delete(id);
        for(const name of ["knowledge","incidents"]){
          const store=tx.objectStore(name);
          const cursor=store.index("byNode").openKeyCursor(root.IDBKeyRange.only(id));
          cursor.onsuccess=()=>{const item=cursor.result;if(item){store.delete(item.primaryKey);item.continue();}};
        }
        done(true);
      });
    }
    return Object.freeze({
      kind:"BROWSER_LOCAL_INDEXEDDB",getNode,putNode,
      addKnowledge:(id,entry)=>add("knowledge",id,entry),
      addIncident:(id,entry)=>add("incidents",id,entry),
      updateIncident,listKnowledge:id=>list("knowledge",id),
      listIncidents:id=>list("incidents",id),clearNode,
      async exportNode(id){id=safeId(id);return {node:await getNode(id),
        knowledge:await list("knowledge",id),incidents:await list("incidents",id)};},
      close(){db.close();}
    });
  }
  return Object.freeze({DATABASE_NAME,DATABASE_VERSION,createMemoryDatabase:memory,openBrowserDatabase:browser});
});

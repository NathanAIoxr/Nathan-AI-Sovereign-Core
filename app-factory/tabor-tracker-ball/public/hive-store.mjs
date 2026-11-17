import {claimNext,makeBatch,settle} from "./hive-core.mjs";

const database="tabor-hive";
const collection="jobs";
let connection;
function open(){
  return connection??=new Promise((resolve,reject)=>{
    const request=indexedDB.open(database,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(collection,{keyPath:"key"});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function transact(operation, mode="readwrite") {
  const db=await open();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(collection,mode), store=tx.objectStore(collection);
    let value;
    const request=store.getAll();
    request.onsuccess=()=>{
      try{value=operation(request.result,store);}
      catch(error){tx.abort();reject(error);}
    };
    tx.oncomplete=()=>resolve(value);
    tx.onabort=tx.onerror=()=>reject(tx.error??new Error("Job transaction was interrupted."));
  });
}

export function listJobs(){
  return transact(jobs=>jobs.sort((a,b)=>b.createdAt-a.createdAt||a.label.localeCompare(b.label)),"readonly");
}

export function enqueue(key, now){
  return transact((jobs,store)=>{
    if(jobs.some(job=>job.status==="queued"||job.status==="running")) return false;
    for(const job of makeBatch(now,key)) store.add(job);
    // Retain whole completed batches so the displayed totals stay coherent.
    const batches=[...new Map(jobs.map(job=>[job.batch,job.createdAt]))].sort((a,b)=>b[1]-a[1]);
    const stale=new Set(batches.slice(19).map(([batch])=>batch));
    for(const job of jobs) if(stale.has(job.batch)) store.delete(job.key);
    return true;
  });
}

export function claim(lease, now){
  return transact((jobs,store)=>{
    const result=claimNext(jobs,now,lease);
    if(result) store.put(result.job);
    return result?.exhausted?null:result?.job??null;
  });
}

export function finish(lease, now, outcome){
  return transact((jobs,store)=>{
    const job=jobs.find(candidate=>candidate.key===outcome.key);
    if(job&&settle(job,lease,now,outcome)) store.put(job);
  });
}

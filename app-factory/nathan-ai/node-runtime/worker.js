'use strict';
importScripts('./engine.js');
self.onmessage=async event=>{
  let task;
  try{
    task=self.NathanNodeRuntime.request(event.data);
    const send=(stage,extra={})=>self.postMessage({runId:task.runId,jobId:task.jobId,nodeId:task.nodeId,stage,...extra});
    send('awakened');send('ignited');send('protected');send('running');
    const bytes=new TextEncoder().encode(task.payload);
    const hash=await crypto.subtle.digest('SHA-256',bytes);
    send('completed',{digest:Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join(''),bytes:bytes.byteLength});
  }catch(error){
    if(task)self.postMessage({runId:task.runId,jobId:task.jobId,nodeId:task.nodeId,stage:'failed',error:error.message});
    else self.postMessage({stage:'rejected',error:'Task did not meet the checksum-only request policy'});
  }
};

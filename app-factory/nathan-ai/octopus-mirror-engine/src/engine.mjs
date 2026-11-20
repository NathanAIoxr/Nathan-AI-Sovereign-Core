// Octopus Mirror Engine — independently deployable, bounded processing kernel.
// Input is caller-supplied authorized work, not scraped wallets or network assets.
import {createHash} from 'node:crypto';
const sha=x=>createHash('sha256').update(x).digest('hex');
export const ARMS=['intake','forward','reverse','distribute','optimize','refine','golden-goose','conductor'];
export function verifySha256d(headerHex,targetHex){
 if(!/^[0-9a-f]{160}$/i.test(headerHex)||!/^[0-9a-f]{64}$/i.test(targetHex))throw Error('Invalid 80-byte header or target');
 const h=createHash('sha256').update(createHash('sha256').update(Buffer.from(headerHex,'hex')).digest()).digest();
 const displayHash=Buffer.from(h).reverse().toString('hex');
 return {hash:displayHash,valid:BigInt('0x'+displayHash)<=BigInt('0x'+targetHex)};
}
export function runCycle(jobs,{maxJobs=2000,arms=8}={}){
 if(!Array.isArray(jobs)||!Number.isInteger(maxJobs)||maxJobs<1||maxJobs>2000||arms!==8)throw Error('Invalid bounded cycle');
 const started=Date.now(),seen=new Set(),results=[],errors=[];
 for(const job of jobs.slice(0,maxJobs)){
  try{
   if(!job||typeof job.id!=='string'||!/^[\w.-]{1,100}$/.test(job.id))throw Error('Invalid job id');
   if(seen.has(job.id))continue;seen.add(job.id);
   if(job.kind==='sha256d-verify'){
    const proof=verifySha256d(job.headerHex,job.targetHex);
    results.push({id:job.id,kind:job.kind,proof,arm:results.length%arms});
   }else if(job.kind==='digest'){
    if(typeof job.payload!=='string'||job.payload.length>65536)throw Error('Invalid payload');
    results.push({id:job.id,kind:job.kind,digest:sha(job.payload),arm:results.length%arms});
   }else throw Error('Unsupported job kind');
  }catch(e){errors.push({id:String(job?.id??''),error:e.message});}
 }
 return {engine:'octopus-mirror-engine',version:1,mode:'AUTHORIZED_OFFLINE',processed:results.length,rejected:errors.length,elapsedMs:Date.now()-started,results,errors,rewardsVerified:0,coinsMinted:0};
}

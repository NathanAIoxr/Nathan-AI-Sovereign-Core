// Run from an authorized operator environment with FEDERATION_URL and PROVISION_TOKEN.
// Resumable, bounded batches; does not copy data or allocate dedicated hardware.
const base=process.env.FEDERATION_URL?.replace(/\/$/,'');
const token=process.env.PROVISION_TOKEN;
if(!base||!token)throw new Error('FEDERATION_URL and PROVISION_TOKEN are required');
const start=Number(process.env.START_NODE||1),end=Number(process.env.END_NODE||1000);
if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end>1000||start>end)throw new Error('invalid node range');
const receipt={source:'tabor-supercomputer-federation',start,end,attempts:[],verified:0,unverified:0};
for(let i=start;i<=end;i+=10){
 const limit=Math.min(10,end-i+1);
 try{
  const response=await fetch(base+'/v1/provision?start='+i+'&limit='+limit,{method:'POST',headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
  const body=await response.json().catch(()=>({error:'non_json_response'}));
  const rows=Array.isArray(body.results)?body.results:[];
  const verified=rows.filter(r=>r.status==='provisioned').length;
  receipt.verified+=verified;receipt.unverified+=limit-verified;
  receipt.attempts.push({start:i,limit,http_status:response.status,verified,unverified:limit-verified});
  if(!response.ok){console.error(JSON.stringify(receipt));process.exitCode=1;break;}
 }catch(e){receipt.unverified+=limit;receipt.attempts.push({start:i,limit,error:String(e)});process.exitCode=1;break;}
}
console.log(JSON.stringify(receipt,null,2));

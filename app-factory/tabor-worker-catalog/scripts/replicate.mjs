import { setTimeout } from "node:timers/promises";
import { fleet, release } from "../src/registry.mjs";

const endpoint=new URL(process.argv[2]);
const key=process.env.TABOR_COPY_TOKEN;
if(endpoint.protocol!=="https:"||endpoint.username||endpoint.password||!(/^[a-f0-9]{64}$/).test(key??""))throw new Error("Use the HTTPS operator endpoint and TABOR_COPY_TOKEN.");
async function copy(offset){
  for(let attempt=0;attempt<4;attempt++){
    try{
      const url=new URL("/replicate",endpoint);
      url.searchParams.set("offset",String(offset));
      const response=await fetch(url,{method:"POST",redirect:"error",
        headers:{authorization:"Bearer "+key},signal:AbortSignal.timeout(25000)});
      if(!response.ok){
        if(response.status<500)throw new RangeError("Copy authorization or input was rejected with "+response.status);
        throw new Error("Copy batch failed with "+response.status);
      }
      const receipt=await response.json();
      if(receipt.offset!==offset||receipt.slots!==Math.min(25,fleet.slots.length-offset)||receipt.sha256!==release.sha256)throw new RangeError("Unexpected copy receipt");
      return receipt;
    }catch(error){
      if(error instanceof RangeError||attempt===3)throw error;
      await setTimeout(500*(attempt+1));
    }
  }
}
const batches=Array.from({length:Math.ceil(fleet.slots.length/25)},(_,i)=>i*25);
for(let i=0;i<batches.length;i+=4){
  const receipts=await Promise.all(batches.slice(i,i+4).map(copy));
  for(const receipt of receipts)console.log(JSON.stringify(receipt));
}

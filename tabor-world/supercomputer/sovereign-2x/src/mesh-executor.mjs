import {fp64,kernel,maxTerms,validSeed} from "./mesh-kernel.mjs";

const invocationPattern=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const reply=(body,status=200)=>Response.json(body,{status,headers:{"cache-control":"no-store"}});
export default {
  async fetch(request) {
    const {origin,pathname}=new URL(request.url);
    if(origin!=="https://executor.internal"||pathname!=="/execute"||request.method!=="POST"){
      return reply({error:"not_found"},404);
    }
    let data;
    try{data=await request.json();}catch{return reply({error:"invalid_input"},400);}
    const {run_id,index,start,count,offset,slot}=data??{};
    if(typeof run_id!=="string"||!invocationPattern.test(run_id)||!validSeed(start)||
      !Number.isInteger(index)||index<0||index>3||!Number.isInteger(slot)||slot<0||slot>=320||
      !Number.isInteger(offset)||offset<0||!Number.isInteger(count)||count<1||offset+count>maxTerms) {
      return reply({error:"invalid_shard"},400);
    }
    return reply({run_id,index,start,count,offset,slot,kernel,checksum:fp64(start,count),
      operations:2*count,executor:"nathan-sovereign-fp64-executor",invocation:crypto.randomUUID()});
  }
};

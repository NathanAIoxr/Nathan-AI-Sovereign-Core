import { catalogBody, fleet, release, replicaKey } from "../src/registry.mjs";

const encoder=new TextEncoder();
const replicaBatch=25;
const concurrency=5;
const bytes=encoder.encode(catalogBody);

async function authorized(request,env){
  const supplied=request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if(!supplied||!/^[a-f0-9]{64}$/.test(env.CATALOG_COPY_TOKEN??""))return false;
  const algorithm={name:"HMAC",hash:"SHA-256"};
  const keys=await Promise.all([crypto.subtle.importKey("raw",encoder.encode(supplied),algorithm,false,["sign"]),
    crypto.subtle.importKey("raw",encoder.encode(env.CATALOG_COPY_TOKEN),algorithm,false,["verify"])]);
  const challenge=encoder.encode("tabor-worker-catalog-copy");
  return crypto.subtle.verify("HMAC",keys[1],await crypto.subtle.sign("HMAC",keys[0],challenge),challenge);
}

async function copy(bucket,id){
  const key=replicaKey(id);
  const current=await bucket.head(key);
  if(current){
    if(current.customMetadata?.sha256!==release.sha256||current.size!==release.bytes)throw new Error("Replica checksum metadata conflict");
    return false;
  }
  await bucket.put(key,bytes,{sha256:release.sha256,
    httpMetadata:{contentType:"application/json; charset=utf-8"},
    customMetadata:{sha256:release.sha256,slot:id,release:release.release,cohort:fleet.cohort}});
  return true;
}

export default {async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(request.method!=="POST"||path!=="/replicate"||!await authorized(request,env))return new Response(null,{status:404});
  const offset=new URL(request.url).searchParams.get("offset")??"";
  if(!/^\d{1,4}$/.test(offset)||Number(offset)%replicaBatch!==0||Number(offset)>=fleet.slots.length){
    return Response.json({error:"Invalid copy offset"},{status:400});
  }
  const nodes=fleet.slots.slice(Number(offset),Number(offset)+replicaBatch);
  let written=0;
  try{
    for(let i=0;i<nodes.length;i+=concurrency) {
      const values=await Promise.all(nodes.slice(i,i+concurrency).map(id=>copy(env.WORKER_CATALOG_REPLICAS,id)));
      written+=values.filter(Boolean).length;
    }
    return Response.json({offset:Number(offset),slots:nodes.length,written,sha256:release.sha256,first:nodes[0],last:nodes.at(-1)});
  }catch{
    return Response.json({error:"Catalog copy batch interrupted",offset:Number(offset)},{status:503});
  }
}};

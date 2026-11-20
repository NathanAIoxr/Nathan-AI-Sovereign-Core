const encoder=new TextEncoder();
const maximumBody=1024*1024;
const headers={zone:"X-Conductor-Zone",time:"X-Conductor-Timestamp",nonce:"X-Conductor-Nonce",seal:"X-Conductor-Seal"};
const hex=bytes=>Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,"0")).join("");
const unhex=text=>Uint8Array.from(text.match(/../g),x=>Number.parseInt(x,16));

async function keyFor(secret,usage) {
  if(typeof secret!=="string"||!/^[a-f0-9]{64}$/.test(secret))throw new TypeError("origin_key_required");
  return crypto.subtle.importKey("raw",unhex(secret),{name:"HMAC",hash:"SHA-256"},false,[usage]);
}
async function bodyDigest(request) {
  const reader=request.clone().body?.getReader();
  const bytes=new Uint8Array(reader?maximumBody:0);
  let length=0;
  if(reader){
    try{
      for(;;){
        const {value,done}=await reader.read();
        if(done)break;
        if(length+value.length>maximumBody){
          reader.cancel().catch(()=>undefined);
          throw new RangeError("origin_body_limit");
        }
        bytes.set(value,length);
        length+=value.length;
      }
    }finally{reader.releaseLock();}
  }
  return hex(await crypto.subtle.digest("SHA-256",bytes.subarray(0,length)));
}
async function canonical(request,domain,time,nonce) {
  const url=new URL(request.url);
  return encoder.encode(JSON.stringify(["CHEIRONOMER/1",domain,request.method,url.pathname+url.search,time,nonce,await bodyDigest(request)]));
}
export async function signOriginRequest(request,secret,now=Date.now()) {
  const key=await keyFor(secret,"sign");
  const clean=new Headers(request.headers);
  for(const name of [...clean.keys()])if(name.startsWith("x-conductor-"))clean.delete(name);
  const domain=new URL(request.url).hostname;
  const time=String(now),nonce=crypto.randomUUID();
  const seal=hex(await crypto.subtle.sign("HMAC",key,await canonical(request,domain,time,nonce)));
  for(const [name,value] of Object.entries({zone:domain,time,nonce,seal}))clean.set(headers[name],value);
  return new Request(request,{headers:clean,redirect:"manual"});
}

export async function verifyOriginRequest(request,secret,claimNonce,now=Date.now()) {
  try {
    const values=Object.fromEntries(Object.entries(headers).map(([name,header])=>[name,request.headers.get(header)]));
    const {zone,time,nonce,seal}=values;
    if(zone!==new URL(request.url).hostname||!/^\d{13}$/.test(time??"")||Math.abs(now-Number(time))>30000||
      !/^[a-f0-9-]{36}$/.test(nonce??"")||! /^[a-f0-9]{64}$/.test(seal??"")||typeof claimNonce!=="function")return false;
    const key=await keyFor(secret,"verify");
    const valid=await crypto.subtle.verify("HMAC",key,unhex(seal),await canonical(request,zone,time,nonce));
    return valid&&await claimNonce(zone,nonce,Number(time)+30000)===true;
  }catch{return false;}
}

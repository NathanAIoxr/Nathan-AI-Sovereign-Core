import {json} from "./conductor.js";
import {hud,hudScript} from "./hud.js";
import {readOwnedGraph} from "./nathan_reader_bots.js";
import {parseVoice} from "./voice_telemetry.js";
const hdr={"cache-control":"no-store","x-content-type-options":"nosniff","content-security-policy":"default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'"};
const decode = text => Uint8Array.from(atob(text.replaceAll("-","+").replaceAll("_","/")),v=>v.charCodeAt(0));

async function operator(request,env) {
  const token=request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.CHEIR_ACCESS_AUD || token.length>16000) return null;
  try {
    const parts=token.split(".");
    if (parts.length!==3 || !parts.every(part=>/^[a-zA-Z0-9_-]+$/.test(part))) return null;
    const [a,b,c]=parts;
    const header=JSON.parse(new TextDecoder().decode(decode(a)));
    const {aud,iss,sub,exp,nbf,email}=JSON.parse(new TextDecoder().decode(decode(b)));
    const now=Date.now()/1000;
    if (header.alg!=="RS256"||typeof header.kid!=="string"||iss!=="https://nathantaboract.cloudflareaccess.com"||
      !Array.isArray(aud)||!aud.includes(env.CHEIR_ACCESS_AUD)||typeof sub!=="string"||typeof email!=="string"||
      !Number.isFinite(exp)||exp<=now||nbf!==undefined&&(!Number.isFinite(nbf)||nbf>now)) return null;
    const response=await fetch(iss+"/cdn-cgi/access/certs",{redirect:"error",signal:AbortSignal.timeout(5000)});
    if (!response.ok) return null;
    const {keys}=await response.json();
    const jwk=keys.find(key=>key.kid===header.kid&&key.kty==="RSA");
    if(!jwk)return null;
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(c),new TextEncoder().encode(a+"."+b));
    return valid?sub:null;
  } catch {return null;}
}

async function readBytes(request,limit) {
  const reader=request.body?.getReader();
  const output=new Uint8Array(limit);
  if (!reader) return output.subarray(0,0);
  let n=0;
  try {
    for (;;) {
      const {done,value}=await reader.read();
      if(done)return output.subarray(0,n);
      if(n+value.length>limit){await reader.cancel();throw new RangeError("too_large");}
      output.set(value,n);
      n+=value.length;
    }
  } finally {reader.releaseLock();}
}

export async function cheironomer(request,env,path) {
  const state=env.TIME.getByName("cheironomer");
  const m=request.method;
  const publicRead=m==="GET"||m==="HEAD";
  if(publicRead&&["/","/operator/","/hud.mjs","/operator/hud.mjs"].includes(path)){
    if(path.startsWith("/operator/")&&!await operator(request,env))return json({error:"operator_required"},401);
    const script=path.endsWith(".mjs");
    return new Response(m==="HEAD"?null:script?hudScript:hud,{headers:{...hdr,"content-type":script?"text/javascript; charset=utf-8":"text/html; charset=utf-8"}});
  }
  if(publicRead&&path==="/health"){
    await state.cheirWake();
    return json({...await state.cheirStatus(),release:env.RELEASE_SHA??"local"});
  }
  if(!path.startsWith("/operator/")) return json({error:"not_found"},404);
  const user=await operator(request,env);
  if(!user)return json({error:"operator_required"},401);
  const action=path.slice("/operator/".length);
  if(action==="events"&&m==="GET"&&request.headers.get("Upgrade")?.toLowerCase()==="websocket"){
    return state.fetch(new Request("https://cheironomer.internal/events",{headers:{Upgrade:"websocket"}}));
  }
  if(action==="roots"&&m==="GET"){
    const {searchParams}=new URL(request.url);
    return json(await readOwnedGraph(env,searchParams.get("source")??"links",searchParams.get("cursor")??""));
  }
  if(m!=="POST"||!["propose","approve","kill","voice"].includes(action))return json({error:"not_found"},404);
  if(request.headers.get("Origin")!==new URL(request.url).origin)return json({error:"same_origin_required"},403);
  if(action==="voice"&&(await state.cheirStatus()).paused)return json({error:"BRAKE"},409);
  if(action==="voice"&&!/^audio\//i.test(request.headers.get("content-type")??""))return json({error:"expected_audio"},415);
  if(action!=="voice"&&!(request.headers.get("content-type")??"").startsWith("application/json"))return json({error:"expected_json"},415);
  const raw=await readBytes(request,action==="voice"?1024*1024:16384);
  const body=action==="voice"?await parseVoice(env,raw):JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(raw));
  const response=await state.cheirCommand(user,action,body);
  return json(response,response.error?409:202);
}

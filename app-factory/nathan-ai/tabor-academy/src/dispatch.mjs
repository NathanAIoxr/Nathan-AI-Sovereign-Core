import holding from './holding.mjs';
import academy from './worker.mjs';

const prefix='/workspace';
let cachedKeys;
let keysExpire=0;
const decoder=new TextDecoder();
const decode=(value)=>Uint8Array.fromBase64(value,{alphabet:'base64url'});

async function verifiedAccess(request,env) {
  const token=request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || !env.ACCESS_ISSUER || !env.ACCESS_AUDIENCE) return false;
  const parts=token.split('.');
  if(parts.length!==3) return false;
  try {
    const [header,body,signature]=parts;
    const {alg,kid}=JSON.parse(decoder.decode(decode(header)));
    const claims=JSON.parse(decoder.decode(decode(body)));
    const now=Date.now()/1000;
    if(alg!=='RS256'||!kid||claims.iss!==env.ACCESS_ISSUER||
      !Array.isArray(claims.aud)||!claims.aud.includes(env.ACCESS_AUDIENCE)||
      !Number.isFinite(claims.exp)||claims.exp<=now||claims.nbf>now||!claims.email) return false;
    let jwk=cachedKeys?.find(key=>key.kid===kid);
    if(!jwk || keysExpire<Date.now()) {
      const response=await fetch(env.ACCESS_ISSUER+'/cdn-cgi/access/certs',{cf:{cacheTtl:300}});
      if(!response.ok) return false;
      cachedKeys=(await response.json()).keys||[];
      keysExpire=Date.now()+300000;
      jwk=cachedKeys.find(key=>key.kid===kid);
    }
    if(!jwk) return false;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(signature),new TextEncoder().encode(header+'.'+body));
  } catch { return false; }
}
export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    if (url.pathname===prefix) {
      return new Response(null,{status:308,headers:{Location:'/tabor-academy/workspace/'}});
    }
    if(!url.pathname.startsWith(prefix+'/')) return holding.fetch(request);
    if(!(await verifiedAccess(request,env))) {
      return new Response('Sign in through Cloudflare Access to open the Tabor Academy workspace.',
        {status:403,headers:{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'}});
    }
    url.pathname=url.pathname.slice(prefix.length);
    return academy.fetch(new Request(url,request),env,ctx);
  }
};

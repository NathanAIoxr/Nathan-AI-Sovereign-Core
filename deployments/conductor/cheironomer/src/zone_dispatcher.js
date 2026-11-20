import {HOLD_CAPACITY, zoneFor} from "../../../../app-factory/nathan-ai/deep-crawler/holding-zones.js";

export {HOLD_CAPACITY};
export const ROLE = Object.freeze({github:"NATHAN_GH_BOT",cloudflare:"NATHAN_CF_BOT",links:"NATHAN_LINK_TRACER"});
const id = /^hold\/(?:omni_god\/(?:0|[1-9][0-9]{0,11})|supernodes\/NT-[1-9][0-9]{0,8})$/;
const hostname = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/;
const requireValid = (rule) => { if (!rule) throw new TypeError("invalid_command"); };

export function normalize(input) {
  requireValid(input && typeof input === "object" && !Array.isArray(input));
  const {action} = input;
  if (action === "arm") return {action};
  if (action === "stage") {
    const {namespace} = input;
    requireValid(typeof input.id === "string" && input.id.length <= 15);
    const manifest = zoneFor(namespace,input.id);
    requireValid(manifest);
    return {action,manifest,role:ROLE.links};
  }
  if (action === "dispatch") {
    requireValid(id.test(input.identity) && Object.hasOwn(ROLE,input.source));
    return {action,identity:input.identity,role:ROLE[input.source],source:input.source};
  }
  if (action === "register-dns") {
    requireValid(Array.isArray(input.domains) && input.domains.length > 0 && input.domains.length <= 10);
    const domains = input.domains.map((entry) => {
      requireValid(entry && hostname.test(entry.domain) && /^[a-f0-9]{32}$/.test(entry.zoneId));
      return {domain:entry.domain,zoneId:entry.zoneId};
    });
    requireValid(new Set(domains.map(x=>x.domain)).size===domains.length && new Set(domains.map(x=>x.zoneId)).size===domains.length);
    return {action,domains};
  }
  if (action === "promote") {
    requireValid(hostname.test(input.domain) && id.test(input.identity));
    return {action,domain:input.domain,identity:input.identity};
  }
  if (action === "holding") {
    requireValid(hostname.test(input.domain));
    return {action,domain:input.domain};
  }
  if (action === "extract") {
    const tile=input.tile;
    requireValid(["tap-that","tweezer-os","sensor"].includes(tile));
    const payload=input.payload;
    requireValid(payload && typeof payload === "object" && !Array.isArray(payload));
    const keys = Object.keys(payload).sort();
    requireValid(keys.length>0 && keys.length<=16 && keys.every(k=>/^[a-z][a-z0-9_]{0,31}$/.test(k) &&
      (typeof payload[k]==="boolean" || Number.isFinite(payload[k]) || typeof payload[k]==="string" && payload[k].length<=300)));
    return {action,tile,payload:Object.fromEntries(keys.map(k=>[k,payload[k]]))};
  }
  throw new TypeError("invalid_command");
}

async function provider(env,path) {
  const reply=await fetch("https://api.cloudflare.com/client/v4"+path,{headers:{Authorization:"Bearer "+env.CF_API_TOKEN},
    redirect:"error",signal:AbortSignal.timeout(5000)});
  const data=await reply.json();
  if(!reply.ok||!data.success)throw Error("cloudflare_evidence_unavailable");
  return data.result;
}

export async function verifyPhysicalRoute(env,domain) {
  if(!env.CF_API_TOKEN||!env.CF_ACCOUNT_ID)return {verified:false,reason:"DNS verifier credential is unconfigured"};
  const row=await env.LEDGER.prepare("SELECT dns_zone_id FROM dns_zone_fleet WHERE domain=?").bind(domain).first();
  if(!row)return {verified:false,reason:"Domain is unregistered"};
  const p="/zones/"+row.dns_zone_id;
  const [zone,tls,records,routes,apps]=await Promise.all([
    provider(env,p),provider(env,p+"/settings/ssl"),provider(env,p+"/dns_records?name="+encodeURIComponent(domain)),
    provider(env,p+"/workers/routes"),provider(env,"/accounts/"+env.CF_ACCOUNT_ID+"/access/apps")
  ]);
  const owns=zone.account?.id===env.CF_ACCOUNT_ID&&zone.name===domain&&zone.status==="active";
  const origin=records.some(x=>x.name===domain&&x.proxied&&["A","AAAA","CNAME"].includes(x.type));
  const route=routes.some(x=>x.pattern===domain+"/*"&&x.script==="tabor-bridge");
  const guard=apps.some(x=>x.domain===domain||x.domain===domain+"/*");
  return {verified:owns&&tls.value==="strict"&&origin&&route&&guard,zoneId:row.dns_zone_id};
}

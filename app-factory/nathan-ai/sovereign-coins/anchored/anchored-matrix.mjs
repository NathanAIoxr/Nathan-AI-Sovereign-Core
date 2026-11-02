/* NATHAN AI — AnchoredSovereignMatrix
 * Source-first implementation of the 1/0 gate and dual-path integrity workflow.
 * A reverse audit compares fields from last to first; SHA-256 is NOT invertible.
 * This is an offline demonstration, never a financial network, malware detector,
 * moral classifier, hardware register controller, mining pool or proxy system.
 */
export const PACKET_SCHEMA = 'nathan-ai.anchored-packet.v1';
export const AUDIT_SCHEMA = 'nathan-ai.anchored-audit.v1';
const FIELDS = Object.freeze(['schema','ticker','nonce','units','payload','consent']);
export const AXIS_ALPHA = 'FORWARD_INGESTION';
export const AXIS_BETA = 'MIRRORED_INTEGRITY_AUDIT';

export function arithmeticAnchors() {
  return Object.freeze({build:1+1===2,binaryBuild:(1+1).toString(2)==='10',clear:1-1===0});
}
export function waveValue({amplitude,waveNumber,position,angularFrequency,time,phase}) {
  const nums=[amplitude,waveNumber,position,angularFrequency,time,phase];
  if(nums.some(n=>typeof n!=='number'||!Number.isFinite(n)))throw Error('Wave inputs must be finite numbers');
  return amplitude*Math.sin(waveNumber*position-angularFrequency*time+phase);
}
export function makePacket({ticker='SIN',nonce=0,units=1,payload='Local reference packet',consent=false}={}) {
  return {schema:PACKET_SCHEMA,ticker,nonce,units,payload,consent};
}
export function canonicalPacket(packet) {
  return JSON.stringify(FIELDS.map(key=>[key,packet[key]]));
}
export function validatePacket(packet,registry,history=[]) {
  const reasons=[];
  if(!packet||typeof packet!=='object'||Array.isArray(packet))
    return {ok:false,reasons:['Packet must be a structured object.']};
  if(packet.schema!==PACKET_SCHEMA)reasons.push('Unsupported packet schema.');
  if(Object.keys(packet).sort().join('|')!==[...FIELDS].sort().join('|'))
    reasons.push('Packet fields must match the declared contract.');
  if(!Array.isArray(registry?.coins)||!registry.coins.some(c=>c.ticker===packet.ticker))
    reasons.push('Unknown sovereign ring ticker.');
  if(!Number.isSafeInteger(packet.nonce)||packet.nonce<0||packet.nonce>2147483647)
    reasons.push('Nonce must be a whole number from 0 to 2147483647.');
  if(!Number.isSafeInteger(packet.units)||packet.units<=0||packet.units>1000000)
    reasons.push('Units must be a positive whole number up to 1,000,000 per demo.');
  if(typeof packet.payload!=='string'||!packet.payload.trim()||packet.payload.length>2000)
    reasons.push('Nonempty text payload required (up to 2000 characters).');
  if(packet.consent!==true)reasons.push('Explicit demonstration consent must be true.');
  if(!Array.isArray(history))reasons.push('Audit history must be an array.');
  else if(history.some(e=>e?.status==='RETAINED'&&e.ticker===packet.ticker&&e.nonce===packet.nonce))
    reasons.push('Duplicate retained nonce for this ticker.');
  return {ok:reasons.length===0,reasons};
}
async function digest(input) {
  if(!globalThis.crypto?.subtle)throw Error('WebCrypto SHA-256 is not available in this execution environment.');
  const result=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(input));
  return Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function axisAlpha(packet) {
  const input=canonicalPacket(packet);
  const hash=await digest(input);
  return {
    axis:AXIS_ALPHA,
    packet:Object.fromEntries(FIELDS.map(key=>[key,packet[key]])),
    canonical:input,
    digest_sha256:hash,
    nonce:packet.nonce,
    order:[...FIELDS]
  };
}
export async function axisBeta(candidate) {
  if(!candidate||typeof candidate!=='object'||!candidate.packet)
    return {axis:AXIS_BETA,ok:false,reasons:['No candidate to audit.']};
  const packet=candidate.packet;
  const reverseOrder=[...FIELDS].reverse();
  const reversedFields=reverseOrder.map(key=>[key,packet[key]]);
  const sameFieldSet=FIELDS.every(key=>Object.hasOwn(packet,key)) &&
    Object.keys(packet).length===FIELDS.length;
  const recanonical=canonicalPacket(packet);
  const digestSha256=await digest(recanonical);
  const reasons=[];
  if(!sameFieldSet)reasons.push('Candidate field contract changed.');
  if(recanonical!==candidate.canonical)reasons.push('Canonical packet changed since ingestion.');
  if(digestSha256!==candidate.digest_sha256)reasons.push('SHA-256 mismatch.');
  if(candidate.order?.join('|')!==FIELDS.join('|'))reasons.push('Alpha ordering mismatch.');
  return {
    axis:AXIS_BETA,
    ok:reasons.length===0,
    reasons,
    reverse_fields:reversedFields,
    recomputed_sha256:digestSha256,
    clarification:'SHA-256 recomputed forward; packet fields examined in reverse order. Hash was not mathematically inverted.'
  };
}
export async function evaluatePacket(packet,registry,history=[]) {
  const basic=validatePacket(packet,registry,history);
  if(!basic.ok)return {gate:0,status:'QUARANTINE',reasons:basic.reasons,packet,alpha:null,beta:null};
  const alpha=await axisAlpha(packet);
  const beta=await axisBeta(alpha);
  return beta.ok
    ? {gate:1,status:'READY_FOR_LOCAL_DEMO',reasons:[],packet,alpha,beta}
    : {gate:0,status:'QUARANTINE',reasons:beta.reasons,packet,alpha,beta};
}
export function recordAudit(verdict,history=[],now=new Date().toISOString(),status=undefined) {
  const result={schema:AUDIT_SCHEMA,sequence:history.length+1,created_at:now,
    status:status||(verdict.gate===1?'INSPECTED':'QUARANTINE'),
    ticker:verdict.packet?.ticker??'',
    nonce:verdict.packet?.nonce??null,
    gate:verdict.gate,
    digest_sha256:verdict.alpha?.digest_sha256??null,
    reasons:[...verdict.reasons]
  };
  return [...history,result];
}

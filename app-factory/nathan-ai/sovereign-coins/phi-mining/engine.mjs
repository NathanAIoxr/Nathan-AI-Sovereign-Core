/* NATHAN AI — Φ_mine: the four-stage formula applied to mining research.
 * This is a bounded, real SHA-256d historical Bitcoin HEADER test, not live mining.
 * 21 author-defined rings and 732m virtual addresses remain local design metadata.
 * No wallet operation, pool connection, auto-deployment, power setting, or payout.
 */
import {virtualPartition, TOTAL_VIRTUAL_NODES} from '../../phi-life/engine.mjs';
export const STAGES=Object.freeze(['calcium_wave','zinc_flash','identity_firewall','growth_loop']);
export const SCHEMA='nathan-ai.phi-mining.v1';
export const GENESIS_NONCE=2083236893;
export const GENESIS_HASH='000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
export const HEADER_PREFIX_HEX='01000000'+'00'.repeat(32)+
  '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a'+'29ab5f49'+'ffff001d';
export const MAX_NONCES=256;
const LIMIT=2**32;
export function numericConfig(startNonce=GENESIS_NONCE-2,attempts=5) {
  if(!Number.isSafeInteger(startNonce)||startNonce<0||startNonce>=LIMIT||
     !Number.isSafeInteger(attempts)||attempts<1||attempts>MAX_NONCES||
     startNonce+attempts>LIMIT)
    throw Error('Use a bounded integer nonce range: 0..2^32−1, length 1..256.');
  return {startNonce,attempts};
}
function hexBytes(hex){
  if(!/^(?:[a-fA-F0-9]{2})+$/.test(hex))throw Error('Malformed hex');
  return Uint8Array.from(hex.match(/.{2}/g),x=>parseInt(x,16));
}
function toHex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
function encodeNonce(n){
 const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);return b;
}
export function buildHeader(nonce) {
 numericConfig(nonce,1);
 const header=new Uint8Array(80);header.set(hexBytes(HEADER_PREFIX_HEX));header.set(encodeNonce(nonce),76);
 return header;
}
async function sha256(bytes){
 if(!globalThis.crypto?.subtle)throw Error('WebCrypto SHA-256 not available in this environment');
 return new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
}
export async function sha256d(bytes){return sha256(await sha256(bytes));}
function targetFromBits(){
 // Historical Bitcoin genesis nBits 0x1d00ffff, network difficulty unchanged for this test vector.
 return 0xffffn << (8n * 26n);
}
export async function checkHeader(header) {
 if(!(header instanceof Uint8Array)||header.length!==80)throw Error('Bitcoin block header must be 80 bytes');
 const bytes=await sha256d(header);
 const displayed=toHex(Uint8Array.from(bytes).reverse());
 const hashValue=BigInt('0x'+displayed);
 return {hash:displayed,passes_target:hashValue<=targetFromBits(),nonce:new DataView(header.buffer,header.byteOffset+76,4).getUint32(0,true)};
}
export async function axisAlpha(config) {
 const {startNonce,attempts}=numericConfig(config.startNonce,config.attempts);
 const startTime=globalThis.performance?.now?.()??0;
 const candidates=[];
 for(let n=startNonce;n<startNonce+attempts;n++){
   const result=await checkHeader(buildHeader(n));
   if(result.passes_target)candidates.push({nonce:n,hash:result.hash});
 }
 const elapsed=Math.max(0,(globalThis.performance?.now?.()??startTime)-startTime);
 return {mode:'HISTORICAL_BITCOIN_GENESIS_POW_TEST',scanned:attempts,range_start:startNonce,
  range_end_exclusive:startNonce+attempts,candidates,sha256d_operations:attempts,elapsed_ms:Math.round(elapsed*100)/100};
}
export async function axisBeta(alpha) {
 if(!alpha||alpha.mode!=='HISTORICAL_BITCOIN_GENESIS_POW_TEST'||
    !Number.isSafeInteger(alpha.scanned)||alpha.scanned<1||alpha.scanned>MAX_NONCES||
    !Array.isArray(alpha.candidates)||alpha.candidates.length>alpha.scanned)
   throw Error('Unrecognized forward-axis result');
 const verified=[];
 for(const item of alpha.candidates){
   if(!Number.isSafeInteger(item.nonce)||item.nonce<alpha.range_start||item.nonce>=alpha.range_end_exclusive)
      throw Error('Candidate outside authorized scan range');
   const checked=await checkHeader(buildHeader(item.nonce));
   verified.push({nonce:item.nonce,hash:checked.hash,valid:checked.passes_target&&checked.hash===item.hash});
 }
 return {independent_verifications:verified.length,all_match:verified.every(v=>v.valid),verified,
   historical_genesis_match:verified.some(v=>v.valid&&v.nonce===GENESIS_NONCE&&v.hash===GENESIS_HASH)};
}
export function createMiningCycle(registry,{startNonce=GENESIS_NONCE-2,attempts=5,consent=false}={}) {
 const config=numericConfig(startNonce,attempts);
 if(consent!==true)throw Error('Explicit approval for local proof-of-work testing required');
 const rings=virtualPartition(registry);
 return {schema:SCHEMA,kind:'OFFLINE_HISTORICAL_POW_REFERENCE',status:'READY',stage_index:0,
  target_virtual_addresses:TOTAL_VIRTUAL_NODES,real_connected_nodes:0,
  mining_pool_connections:0,submitted_shares:0,actual_rewards:0,signatures:0,
  coin_registry_tickers:rings.map(r=>r.ticker),config,
  alpha:null,beta:null,plan:null,events:[]};
}
function event(state,stage,detail) {
 return { ...state,stage_index:state.stage_index+1,
   status:state.stage_index===3?'COMPLETE':'IN_PROGRESS',
   events:[...state.events,{sequence:state.stage_index+1,stage,detail}]};
}
export async function advanceMiningCycle(state,registry){
 if(!state||state.schema!==SCHEMA||state.kind!=='OFFLINE_HISTORICAL_POW_REFERENCE'||
    !Number.isInteger(state.stage_index)||state.stage_index<0||state.stage_index>4||
    state.real_connected_nodes!==0||state.mining_pool_connections!==0||state.submitted_shares!==0||
    state.actual_rewards!==0||state.signatures!==0) throw Error('Cycle mutated or live-state claim rejected');
 const rings=virtualPartition(registry);
 if(state.coin_registry_tickers.join('|')!==rings.map(r=>r.ticker).join('|'))
    throw Error('Original 21 ring source changed');
 if(state.stage_index===4)return state;
 const stage=STAGES[state.stage_index];
 if(stage==='calcium_wave'){
   numericConfig(state.config.startNonce,state.config.attempts);
   return event(state,stage,'Operator-approved local test, 21 preserved rings and '+TOTAL_VIRTUAL_NODES+' virtual addresses indexed.');
 }
 if(stage==='zinc_flash'){
   const alpha=await axisAlpha(state.config);
   return event({...state,alpha},stage,'Axis Alpha hashed '+alpha.scanned+' historical Bitcoin genesis candidates; no shares submitted.');
 }
 if(stage==='identity_firewall'){
   const beta=await axisBeta(state.alpha);
   if(!beta.all_match)throw Error('Independent Axis Beta proof-of-work check failed.');
   return event({...state,beta},stage,'Axis Beta independently verified '+beta.independent_verifications+' qualifying candidate(s).');
 }
 const plan={rings:rings.map(r=>({ticker:r.ticker,virtual_range:[r.start,r.end_exclusive],ready_to_mine:false,
   network:'NOT_CONNECTED',wallet:'NOT_CONNECTED',config:'REQUIRES_CHAIN_SPECIFIC_AUTHORIZATION'})),
  next_action:'Connect owner-authorized chain-specific miner/pool and wallet read-only telemetry; benchmark watts and payouts before any production change.',
  real_jobs_scheduled:0,virtual_addresses_resolved:TOTAL_VIRTUAL_NODES};
 return event({...state,plan},stage,'Bounded 21-ring mapping prepared; zero external miners or wallets activated.');
}
export async function finishMiningCycle(state,registry){
 let s=state;while(s.stage_index<4)s=await advanceMiningCycle(s,registry);return s;
}
export function exportMiningAudit(state){
 if(!state||state.schema!==SCHEMA||state.stage_index!==4||state.status!=='COMPLETE')
   throw Error('Complete the four-stage local cycle first');
 return {schema:'nathan-ai.phi-mining.audit.v1',mode:state.kind,stages:[...STAGES],
  virtual_address_count:state.target_virtual_addresses,
  bitcoin_header_test:{alpha:state.alpha,beta:state.beta},
  mapped_rings:state.plan.rings,source_target_16_to_1:'DESIGN_TARGET_NOT_VERIFIED',
  wallet_or_pool_activity:false,paid_rewards_confirmed:0,original_coin_registry_unchanged:true};
}
export function measuredEfficiency(revenueUsd,electricityKwh,rateUsdPerKwh){
 for(const n of [revenueUsd,electricityKwh,rateUsdPerKwh])
  if(typeof n!=='number'||!Number.isFinite(n)||n<0)throw Error('Measured values must be nonnegative finite numbers');
 const electricityCost=electricityKwh*rateUsdPerKwh;
 return {measured_output_usd:revenueUsd,measured_kwh:electricityKwh,rate_usd_per_kwh:rateUsdPerKwh,
  electricity_cost_usd:electricityCost,
  output_to_electricity_ratio:electricityCost>0?revenueUsd/electricityCost:null,
  target_16_to_1_met:electricityCost>0?revenueUsd/electricityCost>=16:false,
  note:'These user-provided inputs must represent the same measured time window; no live earnings are inferred.'};
}

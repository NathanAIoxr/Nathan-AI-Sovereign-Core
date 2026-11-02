import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 SCHEMA,STAGES,MAX_NONCES,GENESIS_NONCE,GENESIS_HASH,HEADER_PREFIX_HEX,
 numericConfig,buildHeader,sha256d,checkHeader,axisAlpha,axisBeta,createMiningCycle,
 advanceMiningCycle,finishMiningCycle,exportMiningAudit,measuredEfficiency
} from './engine.mjs';
if(!globalThis.crypto?.subtle)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
const dir=dirname(fileURLToPath(import.meta.url));
const registry=JSON.parse(readFileSync(join(dir,'..','registry.json'),'utf8'));
const source=JSON.parse(readFileSync(join(dir,'source.json'),'utf8'));

test('preserves original Φ-life stage order and 21 coin matrix without claiming real mining',()=>{
 assert.deepEqual(STAGES,['calcium_wave','zinc_flash','identity_firewall','growth_loop']);
 assert.equal(SCHEMA,'nathan-ai.phi-mining.v1');
 assert.equal(source.target_virtual_positions,732000000);
 assert.equal(source.stage_crosswalk.length,4);
 assert.equal(source.authored_rings,21);
 assert.equal(source.allowed_external_effects,'none');
 assert.equal(registry.coins.length,21);
 assert.equal(registry.coins[0].ticker,'SIN');
 assert.equal(registry.coins.at(-1).ticker,'LFB');
});
test('SHA-256d historical Bitcoin genesis test uses real 80-byte header and known hash',async()=>{
 assert.equal(HEADER_PREFIX_HEX.length,152);
 const header=buildHeader(GENESIS_NONCE);
 assert.equal(header.length,80);
 const check=await checkHeader(header);
 assert.equal(check.nonce,GENESIS_NONCE);
 assert.equal(check.hash,GENESIS_HASH);
 assert.equal(check.passes_target,true);
 const digest=await sha256d(header);
 assert.equal(Buffer.from(digest).reverse().toString('hex'),GENESIS_HASH);
});
test('bounded Alpha finds historical genesis nonce; independent Beta verifies it',async()=>{
 const alpha=await axisAlpha({startNonce:GENESIS_NONCE-2,attempts:5});
 assert.equal(alpha.scanned,5);assert.equal(alpha.sha256d_operations,5);
 assert.deepEqual(alpha.candidates,[{nonce:GENESIS_NONCE,hash:GENESIS_HASH}]);
 const beta=await axisBeta(alpha);
 assert.equal(beta.all_match,true);assert.equal(beta.historical_genesis_match,true);
 const tampered=structuredClone(alpha);
 tampered.candidates[0].hash='f'.repeat(64);
 const rejected=await axisBeta(tampered);
 assert.equal(rejected.all_match,false);
});
test('nonce limits, fractions and overflows rejected with no work scheduled',async()=>{
 for(const conf of [[-1,1],[0,0],[0,MAX_NONCES+1],[3.2,1],[1,1.5],[2**32,1],[2**32-2,3]])
  assert.throws(()=>numericConfig(...conf));
 assert.throws(()=>createMiningCycle(registry,{}),/Explicit approval/);
 const changed=structuredClone(registry);changed.coins[2].ticker='AAA';
 // Original order is still 21, changed tickers are treated as user changes to source and not the original.
 const bad=structuredClone(registry);bad.coins.pop();
 assert.throws(()=>createMiningCycle(bad,{consent:true}));
});
test('all four stages produce bounded paper plan with zero on-chain or wallet activity',async()=>{
 let state=createMiningCycle(registry,{consent:true});
 assert.equal(state.status,'READY');assert.equal(state.events.length,0);
 for(let i=0;i<STAGES.length;i++){
  state=await advanceMiningCycle(state,registry);
  assert.equal(state.events.at(-1).stage,STAGES[i]);
 }
 assert.equal(state.status,'COMPLETE');assert.equal(state.stage_index,4);
 assert.equal(state.target_virtual_addresses,732000000);
 assert.equal(state.plan.rings.length,21);
 assert.equal(state.plan.real_jobs_scheduled,0);
 assert.equal(state.plan.rings.reduce((n,x)=>n+(x.virtual_range[1]-x.virtual_range[0]),0),732000000);
 assert.equal(state.real_connected_nodes,0);assert.equal(state.mining_pool_connections,0);
 assert.equal(state.actual_rewards,0);assert.equal(state.signatures,0);assert.equal(state.submitted_shares,0);
 assert.equal(state.alpha.scanned,5);
 assert.equal(state.beta.historical_genesis_match,true);
 assert.equal(await advanceMiningCycle(state,registry),state);
 const audit=exportMiningAudit(state);
 assert.equal(audit.wallet_or_pool_activity,false);
 assert.equal(audit.paid_rewards_confirmed,0);
 assert.equal(audit.mapped_rings.length,21);
});
test('tampered state cannot claim extra nodes, mining rewards or pool connections',async()=>{
 const s=createMiningCycle(registry,{consent:true});
 for(const patch of [
  {real_connected_nodes:732000000},{mining_pool_connections:1},
  {submitted_shares:1},{actual_rewards:1},{signatures:1},
  {stage_index:5},{kind:'LIVE_MINING'}
 ]){
  await assert.rejects(advanceMiningCycle({...s,...patch},registry));
 }
 assert.throws(()=>exportMiningAudit(s),/Complete/);
});
test('electricity measurements calculate ratios but cannot invent income',()=>{
 const result=measuredEfficiency(16,2,0.5);
 assert.equal(result.electricity_cost_usd,1);
 assert.equal(result.output_to_electricity_ratio,16);
 assert.equal(result.target_16_to_1_met,true);
 const noPower=measuredEfficiency(16,0,0.5);
 assert.equal(noPower.output_to_electricity_ratio,null);
 assert.equal(noPower.target_16_to_1_met,false);
 for(const arr of [[-1,1,1],[1,-1,1],[1,1,-1],[Number.NaN,1,1]])
  assert.throws(()=>measuredEfficiency(...arr));
});
test('public UI uses local owner-triggered actions; no seed phrases or remote miner commands',()=>{
 const html=readFileSync(join(dir,'index.html'),'utf8');
 const app=readFileSync(join(dir,'app.mjs'),'utf8');
 assert.match(html,/historical Bitcoin genesis block/);
 for(const id of ['job-form','consent','start-nonce','attempts','run-cycle','one-step','reset-cycle','export-cycle','results','rings','efficiency'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.doesNotMatch(app,/innerHTML\s*=/);
 assert.doesNotMatch(app,/(?:fetch\(['"]https?:|WebSocket|sendBeacon|localStorage|eval\()/);
 assert.match(app,/exportMiningAudit/);
});

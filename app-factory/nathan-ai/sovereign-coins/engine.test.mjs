import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {validateRegistry,createLedger,addLocalEvent,auditLedger,summarizeBalances,calculateEfficiency,DESIGN_RATIO} from './engine.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(readFileSync(join(dir,'registry.json'),'utf8'));
const html=readFileSync(join(dir,'index.html'),'utf8');
const app=readFileSync(join(dir,'app.mjs'),'utf8');

test('all 21 source names retained in exact sequence with independent SIN/SEN foundation',()=>{
 const result=validateRegistry(source);
 assert.deepEqual(result.issues,[]);
 assert.equal(result.ok,true);
 assert.equal(source.coins.length,21);
 assert.equal(source.coins[0].ticker,'SIN');
 assert.equal(source.coins[0].name,'Sovereign Invariant Network');
 assert.equal(source.coins[1].name,'Sovereign Energy Network');
 assert.equal(source.coins.at(-1).name,'Leaf Bailer');
 assert.equal(source.coins.filter(c=>c.initial_design_units===1000000).length,2);
 assert.equal(source.coins.reduce((sum,c)=>sum+c.initial_design_units,0),2000000);
 assert.equal(source.mechanics.asserted_target_output_usd_per_1_input_electricity_usd,16);
 assert.equal(source.mechanics.stated_proxy_architecture_capacity,5000000);
 assert.equal(source.mechanics.mechanism_status,'source_claim_not_implemented');
 assert.ok(!JSON.stringify(source).includes('mail.google.com'),'Private Gmail source links must not be published');
});
test('identifies changed labels and unauthorized foundation weights',()=>{
 const altered=structuredClone(source);altered.coins[2].initial_design_units=1000000;
 assert.equal(validateRegistry(altered).ok,false);
 const repeated=structuredClone(source);repeated.coins[2].ticker='SIN';
 assert.equal(validateRegistry(repeated).ok,false);
});
test('local balances remain independent from design allocation and retain whole units',()=>{
 let ledger=createLedger('2026-11-02T00:00:00Z');
 assert.equal(auditLedger(source,ledger).ok,true);
 assert.equal(summarizeBalances(source,ledger).find(c=>c.ticker==='SIN').design_allocation_units,1000000);
 assert.equal(summarizeBalances(source,ledger).find(c=>c.ticker==='SIN').local_demo_units,0);
 ledger=addLocalEvent(source,ledger,{ticker:'SIN',delta_units:15,description:'demonstration',created_at:'2026-11-02T01:00:00Z'});
 ledger=addLocalEvent(source,ledger,{ticker:'SIN',delta_units:-5,description:'demonstration debit',created_at:'2026-11-02T02:00:00Z'});
 assert.equal(summarizeBalances(source,ledger).find(c=>c.ticker==='SIN').local_demo_units,10);
 assert.equal(auditLedger(source,ledger).event_count,2);
 assert.throws(()=>addLocalEvent(source,ledger,{ticker:'SIN',delta_units:-11,description:'overdraft'}));
 assert.throws(()=>addLocalEvent(source,ledger,{ticker:'XYZ',delta_units:1,description:'unknown'}));
 assert.throws(()=>addLocalEvent(source,ledger,{ticker:'SIN',delta_units:0.5,description:'fractional'}));
 const bad=structuredClone(ledger);bad.entries[0].delta_units=-100;
 assert.equal(auditLedger(source,bad).ok,false);
});
test('calculates user-entered energy output ratio; never asserts measured 16x',()=>{
 assert.equal(DESIGN_RATIO,16);
 const result=calculateEfficiency(2,32,4);
 assert.equal(result.observed_output_per_dollar,16);
 assert.equal(result.minimum_output_for_16x,32);
 assert.equal(result.net_usd,30);
 assert.equal(result.cost_per_kwh,0.5);
 assert.equal(result.meets_design_target,true);
 assert.equal(result.verification,'USER_ENTERED_DATA_ONLY_NOT_A_LIVE_MINING_AUDIT');
 assert.equal(calculateEfficiency(2,0).meets_design_target,false);
 assert.equal(calculateEfficiency(0,1).observed_output_per_dollar,null);
 assert.throws(()=>calculateEfficiency(-2,100));
 assert.throws(()=>calculateEfficiency('not-a-number',32));
});
test('browser app exposes all three views without network mining or credential ingestion',()=>{
 for(const id of ['matrix','ledger','efficiency','ring-grid','balance-rows','event-form','efficiency-form','history-rows'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/fetch\('\.\/registry\.json'/);
 assert.doesNotMatch(app,/innerHTML\s*=/);
 assert.doesNotMatch(app,/WebSocket|walletConnect|stratum\+tcp/i);
 assert.match(html,/not a measured mining result/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transition,supervise,probeFleet} from './healing.mjs';
import {refreshCatalog} from './swarm.mjs';
import {RecoverySupervisor} from './public/one-healing.mjs';
function state(){const data=new Map();return {env:{},tx:fn=>fn(),get:(k,f=null)=>data.has(k)?data.get(k):f,set:(k,v)=>data.set(k,v)};}
test('incident cooldown survives cycles, escalates, caps and clears only after verification',()=>{
 let s=null;for(let i=0;i<20;i++){s=transition(s,false,100+i);assert.ok(s.next<=100+i+3600000);assert.equal(s.incidents,1);}
 assert.equal(s.state,'escalated');s=transition(s,true,5000);assert.equal(s.failures,0);assert.equal(s.verified,5000);assert.equal(transition(s,false,6000).incidents,2);
});
test('durable cooldown suppresses repeated operations and later verifies recovery',async()=>{
 const hub=state();let calls=0;const op=async()=>{calls++;return {healthy:calls>1};};
 assert.equal((await supervise(hub,'test',op,100)).healthy,false);
 assert.equal((await supervise(hub,'test',op,200)).deferred,true);assert.equal(calls,1);
 assert.equal((await supervise(hub,'test',op,60101)).healthy,true);assert.equal(calls,2);
});
test('fleet disabled without explicit deployment opt-in',async()=>assert.equal((await probeFleet(state(),{apps:[]})).checked,0));
test('component repair requires post-repair verification and halts repeated failures',async()=>{
 let repairs=0;const supervisor=new RecoverySupervisor({check:async()=>false,repair:async()=>{repairs++;},maxFailures:2});
 assert.equal((await supervisor.tick()).state,'cooldown');assert.equal((await supervisor.tick()).state,'deferred');supervisor.next=0;
 assert.equal((await supervisor.tick()).state,'halted');supervisor.next=0;await supervisor.tick();assert.equal(repairs,2);
 supervisor.resume();assert.equal(supervisor.halted,false);
});
test('component single-flight prevents concurrent repairs and healthy check skips repair',async()=>{
 let release,repairs=0;const wait=new Promise(resolve=>release=resolve);const supervisor=new RecoverySupervisor({check:async()=>{await wait;return true;},repair:async()=>{repairs++;}});
 const running=supervisor.tick();assert.equal((await supervisor.tick()).state,'deferred');release();assert.equal((await running).state,'healthy');assert.equal(repairs,0);supervisor.stop();
});

test('fleet rotates bounded own-host probes, rejects external and credential URLs, and isolates incidents',async()=>{
 const hub=state();hub.env.FLEET_PROBES='enabled';const seen=[];const request=async(url,options)=>{assert.equal(options.redirect,'manual');seen.push(url);return new Response('',{status:url.includes('app0.')?503:200});};
 const apps=Array.from({length:6},(_,i)=>({url:`https://app${i}.nathantaboract.workers.dev/`}));apps.push({url:'https://evil.test/'},{url:'https://user:pass@app.nathantaboract.workers.dev/'});
 const first=await probeFleet(hub,{apps},request);assert.equal(first.checked,4);assert.equal(first.total,6);assert.equal(first.healthy,false);
 const second=await probeFleet(hub,{apps},request);assert.equal(second.checked,3);assert.equal(second.deferred,1);assert.equal(seen.length,7);assert.equal(seen.filter(x=>x.includes('app0.')).length,1);assert.ok(!seen.some(x=>x.includes('evil')));
});
test('thrown check enters repair; thrown telemetry cannot turn verified recovery into failure',async()=>{
 let checks=0,repairs=0;const supervisor=new RecoverySupervisor({check:async()=>{if(++checks===1)throw Error('offline');return true;},repair:async()=>{repairs++;},onEvent:()=>{throw Error('telemetry');}});
 assert.equal((await supervisor.tick()).state,'recovered');assert.equal(repairs,1);assert.equal(supervisor.failures,0);
});

test('fleet verifies the four live contracts and flags a healthy HTTP response with unhealthy data',async()=>{
 const hub=state();hub.env.FLEET_PROBES='enabled';
 const responses={
  'one-sovereign-hub':Response.json({service:'one-sovereign-hub',bindings:{d1:true,durable_objects:true,kv:true,queue:true,workflow:true}}),
  'hook-and-ring':Response.json({service:'hook-and-ring',onlinePlay:false}),
  'grapple-it':new Response('<html>maintenance</html>',{headers:{'Content-Type':'text/html'}}),
  'tabor-database-atlas':Response.json({registry:{tracked:23},projects:[{}],audit:{ledgerOk:true}}),
 };
 const paths={'one-sovereign-hub':'/health','hook-and-ring':'/api/status','grapple-it':'/api/daily','tabor-database-atlas':'/api/status'};
 const apps=Object.keys(paths).map(name=>({url:'https://'+name+'.nathantaboract.workers.dev/'}));
 const report=await probeFleet(hub,{apps},async(url,options)=>{
  const endpoint=new URL(url),name=endpoint.hostname.split('.')[0];
  assert.equal(endpoint.pathname,paths[name]);assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');
  return responses[name];
 });
 assert.equal(report.checked,4);
 assert.deepEqual(report.observations.map(entry=>entry.healthy),[true,false,false,true]);
 assert.equal(report.observations[1].reason,'contract_not_satisfied');
 assert.equal(report.observations[2].reason,'unexpected_content_type');
 assert.equal(report.observations[1].status,200);
});

const catalogText=JSON.stringify({schema:'one.public-app-catalog.v1',count:1,apps:[{
 id:'app-one',title:'ONE',group:'one',entry:'app-factory/one/index.html',
 adoption:'hub_runtime',url:'https://one.nathantaboract.workers.dev/',
}]});
const asset=text=>({content:text,mime:'application/json'});
test('catalog courier restores an invalid or missing public asset from its durable checkpoint',async()=>{
 const hub=state();let value=asset(catalogText),writes=0;
 hub.env.PUBLIC_KV={
  get:async()=>value,
  put:async(key,body)=>{assert.equal(key,'asset:/apps.json');value=JSON.parse(body);writes++;},
 };
 const noFetch=()=>{throw Error('Unexpected upstream request');};
 assert.equal((await refreshCatalog(hub,false,noFetch,100)).healthy,true);
 assert.equal(writes,0);
 const saved=hub.get('catalog_verified');
 assert.equal(saved.count,1);
 assert.match(saved.sha256,/^[a-f0-9]{64}$/);
 for(const bad of [asset('{"count":2}'),null]){
  value=bad;
  const repaired=await refreshCatalog(hub,false,noFetch,200);
  assert.equal(repaired.action,'restored');
  assert.equal(repaired.sha256,saved.sha256);
  assert.deepEqual(value,asset(catalogText));
 }
 assert.equal(writes,2);
});
test('catalog courier does not accept invalid upstream data or mark a stale readback recovered',async()=>{
 const hub=state();let value=asset(catalogText),writes=0;
 hub.env.REMOTE_CATALOG='enabled';
 hub.env.PUBLIC_KV={get:async()=>value,put:async()=>{writes++;}};
 await assert.rejects(refreshCatalog(hub,true,async()=>new Response('{"count":2}'),100),/Catalog count/);
 assert.equal(writes,0);
 value=null;
 const pending=await refreshCatalog(hub,true,async()=>{throw Error('Unexpected upstream request');},200);
 assert.equal(pending.healthy,false);
 assert.equal(pending.reason,'catalog_readback_pending');
 assert.equal(hub.get('catalog_verified').checked_at,100);
 assert.equal(writes,1);
});

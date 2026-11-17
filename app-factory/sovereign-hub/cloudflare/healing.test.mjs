import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transition,supervise,probeFleet} from './healing.mjs';
import {RecoverySupervisor} from './public/one-healing.mjs';
function state(){const data=new Map();return {env:{},get:(k,f)=>data.has(k)?data.get(k):f,set:(k,v)=>data.set(k,v)};}
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
 const second=await probeFleet(hub,{apps},request);assert.equal(second.checked,4);assert.equal(seen.length,7);assert.equal(seen.filter(x=>x.includes('app0.')).length,1);assert.ok(!seen.some(x=>x.includes('evil')));
});
test('thrown check enters repair; thrown telemetry cannot turn verified recovery into failure',async()=>{
 let checks=0,repairs=0;const supervisor=new RecoverySupervisor({check:async()=>{if(++checks===1)throw Error('offline');return true;},repair:async()=>{repairs++;},onEvent:()=>{throw Error('telemetry');}});
 assert.equal((await supervisor.tick()).state,'recovered');assert.equal(repairs,1);assert.equal(supervisor.failures,0);
});

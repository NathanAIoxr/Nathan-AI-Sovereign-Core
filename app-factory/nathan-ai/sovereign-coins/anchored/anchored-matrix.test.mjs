import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {makePacket,validatePacket,axisAlpha,axisBeta,evaluatePacket,recordAudit,arithmeticAnchors,waveValue} from './anchored-matrix.mjs';
const dir=dirname(fileURLToPath(import.meta.url));
const registry=JSON.parse(readFileSync(join(dir,'..','registry.json'),'utf8'));
const text=readFileSync(join(dir,'index.html'),'utf8');
const source=JSON.parse(readFileSync(join(dir,'source.json'),'utf8'));
if(!globalThis.crypto?.subtle)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});

test('preserves original Wave, Build/Clear, Alpha/Beta, 16-to-1 and 5-million source',()=>{
 assert.equal(source.mathematics.length,3);
 assert.equal(source.methods.length,3);
 assert.equal(source.gates.length,3);
 assert.match(source.mathematics[0].expression,/sin/);
 assert.match(source.methods[0].name,/Axis Alpha/);
 assert.match(source.methods[1].name,/Axis Beta/);
 assert.match(source.methods[2].statement,/\$16/);
 assert.match(source.gates[2].name,/5-Million-Proxy Mask/);
 assert.deepEqual(arithmeticAnchors(),{build:true,binaryBuild:true,clear:true});
 assert.equal(waveValue({amplitude:1,waveNumber:1,position:0,angularFrequency:1,time:0,phase:0}),0);
 assert.throws(()=>waveValue({amplitude:Infinity,waveNumber:1,position:0,angularFrequency:1,time:0,phase:0}));
});
test('Alpha/Beta distinct checks and SHA-256 forward recomputation',async()=>{
 const packet=makePacket({ticker:'SIN',nonce:9,units:3,payload:'Owner-authorized demonstration',consent:true});
 const a=await axisAlpha(packet);
 assert.equal(a.digest_sha256.length,64);
 const b=await axisBeta(a);
 assert.equal(b.ok,true);
 assert.equal(b.reverse_fields[0][0],'consent');
 assert.equal(b.reverse_fields.at(-1)[0],'schema');
 assert.match(b.clarification,/not mathematically inverted/);
 const bad=structuredClone(a);bad.packet.payload='MODIFIED';
 assert.equal((await axisBeta(bad)).ok,false);
});
test('binary rules reject unapproved, invalid and repeated retained nonces',async()=>{
 const p=makePacket({ticker:'SIN',nonce:5,units:1,payload:'Public demo',consent:true});
 assert.equal(validatePacket(p,registry).ok,true);
 assert.equal((await evaluatePacket(p,registry)).gate,1);
 assert.equal((await evaluatePacket({...p,consent:false},registry)).gate,0);
 assert.equal((await evaluatePacket({...p,units:0.5},registry)).gate,0);
 assert.equal((await evaluatePacket({...p,ticker:'AAA'},registry)).gate,0);
 assert.equal((await evaluatePacket(p,registry,[{ticker:'SIN',nonce:5,status:'RETAINED'}])).gate,0);
 const pass=await evaluatePacket(p,registry);
 const audit=recordAudit(pass,[],'2026-11-02T15:00:00Z');
 assert.equal(audit[0].gate,1);
 assert.equal(audit[0].status,'INSPECTED');
 const denied=await evaluatePacket({...p,payload:''},registry);
 assert.equal(recordAudit(denied,audit)[1].status,'QUARANTINE');
});
test('browser UI has distinct explicitly gated retention and original wording',()=>{
 for(const id of ['run','waves','hardware','source','matrix-form','record-approved','audit-history','gate-output','plot-wave'])
   assert.match(text,new RegExp('id="'+id+'"'));
 assert.match(text,/Retain approved event in local ledger/);
 assert.match(text,/quarantine, not silent deletion/i);
 assert.match(text,/1\/0 validation/);
 const app=readFileSync(join(dir,'rules-ui.mjs'),'utf8');
 assert.doesNotMatch(app,/\.innerHTML\s*=/);
 assert.doesNotMatch(app,/fetch\(['"]https?:/);
 assert.match(app,/addLocalEvent/);
});

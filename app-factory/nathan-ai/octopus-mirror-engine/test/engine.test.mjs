import test from 'node:test';
import assert from 'node:assert/strict';
import {runCycle,verifySha256d,ARMS} from '../src/engine.mjs';
test('eight arms remain separate',()=>assert.equal(ARMS.length,8));
test('bitcoin genesis block header validates',()=>{
 const header='01000000'+'00'.repeat(32)+'3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a'+'29ab5f49'+'ffff001d'+'1dac2b7c';
 const target='00000000ffff0000000000000000000000000000000000000000000000000000';
 const p=verifySha256d(header,target);
 assert.equal(p.hash,'000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f');
 assert.equal(p.valid,true);
});
test('dedup and bounded digest processing',()=>{
 const x=runCycle([{id:'a',kind:'digest',payload:'hello'},{id:'a',kind:'digest',payload:'hello'},{id:'b',kind:'bad'}]);
 assert.equal(x.processed,1);assert.equal(x.rejected,1);assert.equal(x.coinsMinted,0);
});

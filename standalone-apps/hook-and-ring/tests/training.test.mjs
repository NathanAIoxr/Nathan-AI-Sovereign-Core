import test from 'node:test';
import assert from 'node:assert/strict';
import { inBezel, guardedRelease, releaseSetup, trackSample } from '../game/input.mjs';
import { defaultThrow, simulateShot } from '../game/physics.mjs';
import { importTosses, readTosses, saveToss, traceToss, drills } from '../game/shot-record.mjs';

test('scaled ten-contact grip excludes lift artifacts and uses the selected limb guard',()=>{
  const history=[{x:0,y:0,t:0},{x:0,y:28,t:72},{x:3,y:14,t:82},{x:60,y:1,t:95}];
  const contacts=new Map(Array.from({length:10},(_,index)=>{
    const p={x:index*25,y:0,t:0};
    return [index,{start:p,trail:[p,{...p,y:index===1?8:0,t:72}]}];
  }));
  const a=releaseSetup({history,contacts},100,4,'hand');
  const b=releaseSetup({history,contacts},100,4,'toe');
  assert.equal(a.contacts,10);
  assert.equal(a.point.t,82);
  assert.equal(b.point.t,72);
  assert.equal(b.guard,20);
  assert.equal(a.velocity.x,(3/10)/4);
  assert.ok(a.twist>0);
  assert.equal(guardedRelease([],100),null);
  assert.equal(inBezel(4,50,100,100),true);
  assert.equal(inBezel(50,50,100,100),false);
});
test('input keeps a bounded history and ignores arrival-order duplicates',()=>{
  const history=[];
  for(let i=0;i<300;i++)trackSample(history,{x:0,y:i,t:i});
  assert.ok(history.length<=96);
  assert.equal(trackSample(history,{x:90,y:90,t:298}),false);
});
test('lab trajectory matches the competition solver and ignores supplied result claims',()=>{
  const claimed={throw:defaultThrow,wind:0,result:{outcome:'miss'},code:'private',at:1234};
  const [record]=importTosses({cartridge:'TACTILECORE-C01-HOOK-RING',version:1,...claimed});
  assert.equal(record.result,undefined);
  assert.equal(record.code,undefined);
  assert.equal(record.at,1234);
  const trace=traceToss(record.throw,record.wind,record.trick);
  assert.deepEqual(trace.result,simulateShot(defaultThrow,0));
  assert.ok(trace.points.length>20);
  assert.throws(()=>importTosses({format:'hook-ring-toss-lab-v1',tosses:[{throw:{...defaultThrow,pull:5},wind:0}]}),/invalid physics/);
});
test('toss history stores only the most recent forty attempts',()=>{
  let saved;
  const storage={getItem:()=>saved,setItem:(_,value)=>{saved=value;}};
  for(let index=0;index<42;index++)saveToss(storage,{throw:defaultThrow,wind:0,at:100+index});
  const history=readTosses(storage);
  assert.equal(history.length,40);
  assert.equal(history[0].at,141);
  assert.equal(history.at(-1).at,102);
});

test('all five drills have a verified winning toss and a starter that needs adjustment',()=>{
  assert.equal(drills.length,5);
  for(const drill of drills){
    assert.ok(drill.check(simulateShot(drill.target,drill.wind)),drill.name);
    assert.equal(drill.check(simulateShot(drill.start,drill.wind)),false,drill.name);
  }
});

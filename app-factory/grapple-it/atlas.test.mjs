import assert from 'node:assert/strict';
import test from 'node:test';
import {ATLAS,CLASSES,TYPES,atlasEntry,atlasSearch,atlasMedals} from './public/atlas.mjs';
import {CHASSIS,arena,checkpoints,scoreChallenge,tracePoint,sanitizeExpansion} from './public/arcade.mjs';

test('101 individually indexed entries cover every subject, type and chassis',()=>{
 assert.equal(ATLAS.length,101);
 assert.equal(Object.keys(CLASSES).length,21);
 for(const [index,entry] of ATLAS.entries()){
  assert.equal(entry.id,String(index+1).padStart(3,'0'));
  assert.equal(atlasEntry(entry.id),entry);
  assert.ok(entry.attributes && entry.traits && entry.application && entry.target);
 }
 assert.deepEqual(new Set(ATLAS.map(entry=>entry.lcc)),new Set(Object.keys(CLASSES)));
 assert.deepEqual(new Set(ATLAS.map(entry=>entry.kind)),new Set(Object.keys(TYPES)));
 assert.deepEqual(new Set(ATLAS.map(entry=>entry.chassis)),new Set(Object.keys(CHASSIS)));
 assert.equal(new Set(ATLAS.map(entry=>entry.title)).size,101);
});

test('search intersects subject, type and mechanic',()=>{
 assert.equal(atlasSearch({query:'PINOCCHIO',lcc:'P',kind:'character',chassis:'rope'})[0].title,'Pinocchio');
 assert.equal(atlasSearch({query:'PINOCCHIO',lcc:'Z'}).length,0);
 assert.ok(atlasSearch({query:'database'}).some(entry=>entry.title==='Database record graph'));
});

test('save restoration validates scores and accepts pre-atlas saves',()=>{
 assert.deepEqual(atlasMedals({'001':270,'102':300,'009':50,'010':300.5}),{'001':270});
 assert.deepEqual(sanitizeExpansion({games:{stone_toss:295},atlas:{'101':300}}).atlas,{'101':300});
 assert.deepEqual(sanitizeExpansion({games:{}}).atlas,{});
});

test('all 101 entries can earn Gold using their visible game rules',()=>{
 for(const entry of ATLAS){
  let total=0;
  for(const round of [0,1,2]){
   let best=0;
   if(entry.chassis==='craft'){
    const route=checkpoints(entry,round);
    const progress=route.reduce((caught,[x,y])=>tracePoint(route,caught,x,y),0);
    best=scoreChallenge(entry,0,round,undefined,false,progress);
   }else{
    for(let tick=0;tick<2160&&best<100;tick++){
     const t=tick/120, target=arena(entry,t,round);
     best=Math.max(best,scoreChallenge(entry,t,round,{x:target.x-target.drift,y:target.y}));
    }
   }
   total+=best;
  }
  assert.ok(total>=270,entry.id+' '+entry.title+' scored '+total);
 }
});

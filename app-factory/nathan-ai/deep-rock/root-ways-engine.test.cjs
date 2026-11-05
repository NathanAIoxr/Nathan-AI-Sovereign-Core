'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const W=require('./root-ways-engine.js');
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'ways-of-nathan-tabor.json'),'utf8'));
test('every original Way and repetition survives exact-source validation',()=>{
 assert.deepEqual(W.verify(original),{ways:9,uniqueSpellings:8,formulas:2,originalPreserved:true});
 assert.deepEqual(original.exactOrderIncludingRepetitions,[
  'Primordial','Primortal','Priimortal','Primortial','Priimortial',
  'Bimordial','Bimortal','Biimortal','Bimordial']);
 assert.equal(original.exactOrderIncludingRepetitions.filter(x=>x==='Bimordial').length,2);
 assert.match(original.exactCreatorStatement,/pure intent and for the betterment of all/);
 assert.equal(original.preWebKillSwitchClaim.evidenceStatus,
  'not independently established by accessible files or tests');
});
test('root arithmetic computes correctly without producing external access rights',()=>{
 assert.deepEqual(W.evaluate('BUILD'),{expression:'1+1=2',result:2,action:'BUILD'});
 assert.deepEqual(W.evaluate('CLEAR'),{expression:'1-1=0',result:0,action:'CLEAR'});
 assert.throws(()=>W.evaluate('OVERRIDE'),/Unknown root formula/);
});
test('local operator must approve; stop blocks further simulation permanently',()=>{
 const controller=W.createOwnerLocalController();
 assert.throws(()=>controller.simulate('BUILD'),/not authorized/);
 assert.equal(controller.authorize({scope:'external',ownerApproved:true}),false);
 assert.equal(controller.authorize({scope:'owner-local',ownerApproved:false}),false);
 assert.equal(controller.authorize({scope:'owner-local',ownerApproved:true}),true);
 const build=controller.simulate('BUILD');const clear=controller.simulate('CLEAR');
 assert.equal(build.result,2);assert.equal(clear.result,0);
 assert.equal(build.networkCalls,0);assert.equal(clear.remoteActions,0);
 const stop=controller.stop('owner explicit STOP');
 assert.equal(stop.stopped,true);
 assert.equal(controller.status().readCount,2);
 assert.equal(controller.authorize({scope:'owner-local',ownerApproved:true}),false);
 assert.throws(()=>controller.simulate('CLEAR'),/has been stopped/);
 assert.deepEqual(controller.status(),{state:'stopped',readCount:2,
  stopReason:'owner explicit STOP',scope:'owner-local',networkCalls:0,remoteActions:0});
});
test('edits to creator wording or recasting a historical claim as proven cause fail validation',()=>{
 const changed=structuredClone(original);changed.exactOrderIncludingRepetitions[2]='Primortal';
 assert.throws(()=>W.verify(changed),/altered/);
 const simplified=structuredClone(original);simplified.exactOrderIncludingRepetitions.pop();
 assert.throws(()=>W.verify(simplified),/incomplete/);
 const altered=structuredClone(original);altered.preWebKillSwitchClaim.evidenceStatus='proven-global-system';
 assert.throws(()=>W.verify(altered),/Unverified historical claim/);
 const rewritten=structuredClone(original);rewritten.exactCreatorStatement='summarized';
 assert.throws(()=>W.verify(rewritten),/language was not preserved/);
});

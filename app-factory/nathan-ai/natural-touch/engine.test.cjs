'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const E=require('./engine.js'),R=require('./records.js');
test('four target classes and no remote installation',()=>{
 const r=E.capabilityReport(E.makeRegistry());assert.equal(r.logicalEndpoints,4);
 assert.deepEqual(r.classes.map(x=>x.kind),['ai-node','non-ai-node','node','non-node']);
 assert.equal(r.physicalDevicesDiscovered,0);assert.equal(r.remoteSystemsModified,0);
});
test('consented local input routes to all classes without output',()=>{
 const r=E.route(E.makeRegistry(),{modality:'light-touch',source:'device-pointer',ownerConsent:true});
 assert.equal(r.addressed,4);assert.equal(r.accepted,4);assert.equal(r.networkCalls,0);
 assert.equal(r.biologicalTouchRestored,false);assert.ok(r.delivered.every(x=>!x.physicalOutputProduced));
});
test('target selection is exact',()=>{
 const r=E.route(E.makeRegistry(),{modality:'gesture',source:'demonstration',ownerConsent:true},'non-node');
 assert.equal(r.addressed,1);assert.equal(r.delivered[0].kind,'non-node');
});
test('consent, modality and magnitude constraints',()=>{
 assert.throws(()=>E.route(E.makeRegistry(),{modality:'gesture',source:'demonstration'}),/affirmative/);
 assert.throws(()=>E.normalizeEvent({modality:'brain-control',source:'demonstration',ownerConsent:true}),/Unsupported/);
 assert.throws(()=>E.normalizeEvent({modality:'gesture',source:'demonstration',ownerConsent:true,magnitude:Infinity}),/Magnitude/);
});
test('no sensor impersonation and explicit physical capability requirement',()=>{
 const m=E.makeRegistry();
 assert.throws(()=>E.route(m,{modality:'vibration',source:'physical-sensor',ownerConsent:true}),/authorized connected/);
 assert.equal(E.route(m,{modality:'vibration',source:'physical-sensor',sensorConnected:true,ownerConsent:true}).accepted,0);
 E.enroll(m,{id:'AUTHORIZED:SENSOR',kind:'non-ai-node',capability:'physical-sensor'});
 assert.equal(E.route(m,{modality:'vibration',source:'physical-sensor',sensorConnected:true,ownerConsent:true}).accepted,1);
 assert.throws(()=>E.enroll(m,{id:'AUTHORIZED:SENSOR',kind:'non-ai-node',capability:'physical-sensor'}),/Duplicate/);
});
test('protective pain route and arithmetic invariants',()=>{
 assert.match(E.route(E.makeRegistry(),{modality:'pain',source:'owner-import',ownerConsent:true}).safety,/Do not suppress/);
 assert.deepEqual(E.arithmetic(),{build:2,clear:0});
});
test('patent and ancient research records are separate, caveated',()=>{
 assert.ok(R.ITEMS.some(x=>x.id==='aristotle'));assert.ok(R.ITEMS.some(x=>x.id==='samkhya'));
 for(const id of ['US20060256090A1','US8773356B2','US9710095B2','US6506148B2'])assert.ok(R.ITEMS.some(x=>x.id===id));
 assert.ok(R.ITEMS.every(x=>x.url.startsWith('https://')&&x.qualification));
});
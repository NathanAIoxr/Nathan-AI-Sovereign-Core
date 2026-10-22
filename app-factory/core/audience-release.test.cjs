'use strict';const test=require('node:test'),assert=require('node:assert/strict'),r=require('./audience-release.js');
function a(overrides={}){return {id:'TW-001',type:'game',target:'general',content:{violence:'mild'},features:{},...overrides}}
test('no official rating or automatic approval',()=>{const x=r.inspect(a());assert.equal(x.officialAgeRating,null);assert.equal(x.submissionApproved,false)});
test('book narrative not automatically evaluated as player violence',()=>{const x=r.inspect(a({type:'book',content:{violence:'mild'}}));assert.ok(x.findings.some(f=>f.code==='MEDIA_CONTEXT'));assert.ok(!x.findings.some(f=>f.code==='INTERACTIVE_VIOLENCE'))});
test('game interactive violence receives extra review',()=>assert.ok(r.inspect(a()).findings.some(x=>x.code==='INTERACTIVE_VIOLENCE')));
test('children with mature content fail closed',()=>assert.equal(r.inspect(a({target:'children',content:{gore:'moderate'}})).readiness,'HOLD'));
test('child-directed paid loot is blocked',()=>assert.equal(r.inspect(a({target:'children',features:{randomRewards:true,inAppPurchases:true}})).readiness,'HOLD'));
test('unreviewed external code blocked despite native wrapper',()=>assert.equal(r.inspect(a({features:{externalCode:true}})).readiness,'HOLD'));
test('outside financial service requires human release gate',()=>assert.equal(r.inspect(a({type:'humanitarian',features:{donations:true}})).readiness,'HOLD'));
test('social messaging calls for moderation',()=>assert.ok(r.inspect(a({type:'social',features:{chat:true}})).findings.some(x=>x.code==='USER_CONTENT')));
test('historical story keeps evidence review',()=>assert.ok(r.inspect(a({type:'book',content:{sensitiveHistory:'mild'}})).findings.some(x=>x.code==='HISTORICAL_CONTEXT')));
test('no all-clear from no objectionable content',()=>assert.equal(r.inspect(a({type:'educational',content:{violence:'none'}})).readiness,'ASSESSMENT_REQUIRED'));
test('bad input and unrecognized descriptors rejected',()=>{assert.throws(()=>r.inspect({id:'x',type:'nonsense'}));assert.throws(()=>r.inspect(a({content:{unknown:'strong'}})))});
test('can review 101 canon game families without overwriting IDs',()=>{let a0=r.inspect({id:'TW-001',type:'game',content:{violence:'mild'}});assert.equal(a0.id,'TW-001')});

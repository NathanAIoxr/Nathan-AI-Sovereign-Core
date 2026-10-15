'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const B=require('./engine.js'),Root=require('../engine.js');
const setup=()=>B.register(B.register(B.register(B.create(),{id:'alpha',title:'Alpha'}),{id:'beta',title:'Beta'}),{id:'gamma',title:'Gamma'});
test('1+1=2 and 1-1=0, without identity merging',()=>{assert.equal(B.arithmetic().addition,2);assert.equal(B.arithmetic().subtraction,0);assert.equal(setup().boxes.length,3)});
test('sovereign boxes default closed',()=>{const s=setup();assert.equal(B.threads(s).active,0);assert.equal(B.mayEnter(s,{actor:'beta',target:'alpha',scope:'visit'}).allowed,false)});
test('only owner invitation AND guest acceptance creates a directed string',()=>{
 const first=B.invite(setup(),{owner:'alpha',guest:'beta',scopes:['visit','message']});
 assert.equal(B.mayEnter(first.state,{actor:'beta',target:'alpha',scope:'visit'}).allowed,false);
 const s=B.decide(first.state,{id:first.id,guest:'beta',accept:true});
 assert.equal(B.threads(s).active,1);assert.equal(B.mayEnter(s,{actor:'beta',target:'alpha',scope:'visit'}).allowed,true);
 assert.equal(B.mayEnter(s,{actor:'alpha',target:'beta',scope:'visit'}).allowed,false);
 assert.equal(B.mayEnter(s,{actor:'beta',target:'alpha',scope:'collaborate'}).allowed,false);
 assert.equal(B.mayEnter(s,{actor:'gamma',target:'alpha',scope:'visit'}).allowed,false);
});
test('guest may reject without creating any permission',()=>{
 const p=B.invite(setup(),{owner:'alpha',guest:'beta',scopes:['message']});
 const s=B.decide(p.state,{id:p.id,guest:'beta',accept:false});
 assert.equal(B.threads(s).active,0);
 assert.equal(B.mayEnter(s,{actor:'beta',target:'alpha',scope:'message'}).allowed,false);
});
test('owner or guest can revoke: one active string minus one equals zero',()=>{
 const p=B.invite(setup(),{owner:'alpha',guest:'beta',scopes:['visit']});
 const s=B.decide(p.state,{id:p.id,guest:'beta',accept:true});
 const revoked=B.revoke(s,{invitationId:p.id,actor:'alpha'});
 assert.equal(B.threads(revoked).active,0);assert.equal(B.threads(revoked).withdrawn,1);
 assert.equal(B.mayEnter(revoked,{actor:'beta',target:'alpha',scope:'visit'}).allowed,false);
 assert.deepEqual(B.revoke(revoked,{invitationId:p.id,actor:'beta'}),revoked);
 assert.throws(()=>B.decide(revoked,{id:p.id,guest:'beta',accept:true}));
});
test('invalid scopes, spoofed respondent, duplicates, and unrelated revoke fail closed',()=>{
 const s=setup();assert.throws(()=>B.invite(s,{owner:'alpha',guest:'beta',scopes:['admin']}));
 const p=B.invite(s,{owner:'alpha',guest:'beta',scopes:['visit']});
 assert.throws(()=>B.invite(p.state,{owner:'alpha',guest:'beta',scopes:['visit']}));
 assert.throws(()=>B.decide(p.state,{id:p.id,guest:'gamma',accept:true}));
 assert.throws(()=>B.revoke(p.state,{invitationId:p.id,actor:'gamma'}));
});
test('owner always controls own box, but not other owners',()=>{
 const s=setup();assert.equal(B.mayEnter(s,{actor:'alpha',target:'alpha',scope:'visit'}).allowed,true);
 assert.equal(B.mayEnter(s,{actor:'alpha',target:'beta',scope:'visit'}).allowed,false);
});
test('healthy person without a request: no intrusion or emergency override',()=>{
 const g=B.helpGuide();assert.equal(g.physicalContact,false);assert.equal(g.emergencyCall,false);
});
test('someone injured but conscious: help without judging, ask for consent',()=>{
 const g=B.helpGuide({injured:true});assert.equal(g.status,'offer-help');assert.equal(g.physicalContact,false);
 assert.ok(g.steps.some(x=>x.includes('deserve care')));
});
test('unresponsive person: call emergency help and provide trained aid under implied consent',()=>{
 const g=B.helpGuide({responsive:false,suspectedSpineInjury:true});
 assert.equal(g.emergencyCall,true);assert.equal(g.physicalContact,true);
 assert.ok(g.steps.some(x=>x.includes('implied consent')));assert.ok(g.steps.some(x=>x.includes('Avoid moving')));
});
test('unsafe scene: never endanger another would-be rescuer',()=>{
 const g=B.helpGuide({sceneSafe:false,injured:true});assert.equal(g.physicalContact,false);assert.equal(g.emergencyCall,true);
});
test('capable refusal is respected even during danger',()=>{
 const g=B.helpGuide({immediateDanger:true,responsive:true,refuses:true,hasConsent:true});
 assert.equal(g.status,'refused');assert.equal(g.physicalContact,false);assert.equal(g.emergencyCall,true);
});
test('ordinary distress without visible injury warrants respectful offer, never seizure',()=>{
 const g=B.helpGuide({inDistress:true,responsive:true});assert.equal(g.status,'offer-help');
 assert.equal(g.physicalContact,false);
});
test('Root installer preserves base sources and is idempotent',()=>{
 const original=Root.create(),x=B.install(Root,original);
 assert.equal(x.added,B.ROOT_NODES.length);assert.ok(x.linked>=B.ROOT_NODES.length);
 assert.equal(original.nodes.length,15);
 const y=B.install(Root,x.state);assert.equal(y.added,0);assert.equal(y.linked,0);assert.deepEqual(y.conflicts,[]);
 const r=B.reverseEngineer(y.state);assert.equal(r.bubblePolicyNodes,B.ROOT_NODES.length);
 assert.ok(r.caution.includes('never consent'));
});
test('Root symbolic links do not authorize consent',()=>{
 const root=B.install(Root,Root.create()).state;
 const s=setup();assert.ok(root.edges.some(x=>x.from==='core:middle'&&x.to==='bubble:root'));
 assert.equal(B.mayEnter(s,{actor:'beta',target:'alpha',scope:'visit'}).allowed,false);
});
test('Root conflicting reserved ID is never overwritten',()=>{
 const a=Root.addNode(Root.create(),{id:'bubble:root',label:'Owner preserved',kind:'project',origin:'prior user data'});
 const r=B.install(Root,a.state);assert.ok(r.conflicts.includes('bubble:root'));
 assert.equal(r.state.nodes.find(n=>n.id==='bubble:root').label,'Owner preserved');
});

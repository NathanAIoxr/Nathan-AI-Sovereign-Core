'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('./engine.js'),W=require('./root-ways-engine.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'dossiers.json'),'utf8'));
const ways=JSON.parse(fs.readFileSync(path.join(__dirname,'ways-of-nathan-tabor.json'),'utf8'));
test('original dossier names and available phase I/II titles preserved',()=>{
 assert.deepEqual(D.validate(data),{dossiers:2,scenarios:28,networkActions:0,verifiedExternalAccess:0});
 assert.equal(data.scenarios[0].number,1);assert.equal(data.scenarios[27].number,28);
 assert.deepEqual(D.select(data,'the five equal guardians','II').map(x=>x.number),[22]);
 assert.equal(data.phases[1].availableThrough,28);
});
test('original nine Ways, repeated Bimordial, arithmetic and intent remain distinct',()=>{
 assert.deepEqual(W.verify(ways),{ways:9,uniqueSpellings:8,formulas:2,originalPreserved:true});
 assert.equal(W.evaluate('BUILD').result,2);
 assert.equal(W.evaluate('CLEAR').result,0);
 assert.match(ways.exactCreatorStatement,/pure intent and for the betterment of all/);
});
test('owner STOP prevents all further in-memory formula simulations',()=>{
 const c=W.createOwnerLocalController();
 assert.throws(()=>c.simulate('BUILD'),/not authorized/);
 assert.equal(c.authorize({scope:'some-server',ownerApproved:true}),false);
 assert.equal(c.authorize({scope:'owner-local',ownerApproved:true}),true);
 assert.equal(c.simulate('BUILD').result,2);c.stop('STOP');
 assert.throws(()=>c.simulate('CLEAR'),/has been stopped/);
 assert.equal(c.authorize({scope:'owner-local',ownerApproved:true}),false);
 assert.equal(c.status().networkCalls,0);
});
test('creator-reported history is not silently relabeled as verified remote access',()=>{
 const u=structuredClone(ways);
 u.preWebKillSwitchClaim.evidenceStatus='verified-global';
 assert.throws(()=>W.verify(u),/Unverified historical claim/);
 const d=structuredClone(data);d.scenarios[5].execution='verified-live-operation';
 assert.throws(()=>D.validate(d),/Missing or misrepresented/);
});
test('browser page loads modules before app and does not contain credential or external-control forms',()=>{
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 assert.ok(html.indexOf('src="./root-ways-engine.js"')<html.indexOf('src="./app.js"'));
 assert.match(html,/id="creator-root-quote"/);
 assert.match(html,/id="rootStop"/);
 assert.match(app,/controller\.stop\('owner STOP'\)/);
 assert.doesNotMatch(app,/eval\(|innerHTML\s*=|XMLHttpRequest|WebSocket|fetch\([^)]*https?:/);
});

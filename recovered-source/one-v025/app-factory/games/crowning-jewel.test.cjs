'use strict';
// Run: node app-factory/games/crowning-jewel.test.cjs
// No external npm dependencies required.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(path.join(__dirname,'crowning-jewel.js'),'utf8');
const sandbox = {};
vm.runInNewContext(code,sandbox,{filename:'crowning-jewel.js'});
const game = sandbox.CrowningJewelEngine;
assert.ok(game,'Crowning Jewel engine was not exposed');
const results=game.runTests();
results.forEach(t => assert.equal(t.passed,true,t.name+' '+(t.error||'')));
let defense=game.makeDefense('story');
for(const action of ['rescue','rescue','rescue','scout','scout','scout','scout','scout','scout','scout']){
 const r=game.defenseAction(defense,action);
 assert.equal(r.accepted,true,'Defense action failed: '+action);
 defense=r.state;
}
assert.equal(defense.over,true,'Defense did not reach final turn');
assert.equal(defense.result,'victory','Defense win condition was not reachable');
assert.ok(defense.integrity>0);
assert.ok(defense.safe>=4);
let civic=game.makeLegacy();
for(const action of ['fundraise','aid','school','care','fundraise','outreach','constitution','aid']){
 const r=game.legacyAction(civic,action);
 assert.equal(r.accepted,true,'Civic action failed: '+action);
 civic=r.state;
}
assert.equal(civic.result,'victory','Civic win condition was not reachable');
assert.equal(civic.over,true);
const before=game.makeDefense();
const denied=game.defenseAction(before,'fortify',12);
assert.equal(denied.accepted,false);
assert.equal(JSON.stringify(before),JSON.stringify(denied.state));
console.log('PASS 1420: The Crowning Jewel ('+results.length+' core tests + 4 campaign assertions).');

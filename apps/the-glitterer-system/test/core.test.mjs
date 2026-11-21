import test from 'node:test';import assert from 'node:assert/strict';import {authorize,inspectText,toBase12,phoneticTools,domains,gameCatalog} from '../src/core.mjs';
test('explicit grant passes',()=>assert.equal(authorize({subject:'c',action:'stage',resource:'r'},[{subject:'c',actions:['stage'],resource:'r'}]).allowed,true));
test('unknown denied',()=>assert.equal(authorize({subject:'x',action:'stage',resource:'r'},[]).allowed,false));
test('lockdown denies',()=>assert.equal(authorize({subject:'c',action:'stage',resource:'r',lockdown:true},[{subject:'c',actions:['stage'],resource:'r'}]).allowed,false));
test('production requires approval',()=>assert.equal(authorize({subject:'c',action:'production_deploy',resource:'r'},[{subject:'c',actions:['production_deploy'],resource:'r'}]).allowed,false));
test('text flags are not malware verdict',()=>{let x=inspectText('<script>alert(1)</script>');assert.ok(x.flags.includes('SCRIPT_TAG'));assert.equal(x.safeGuarantee,false)});
test('base12 notation',()=>assert.equal(toBase12(143),'EE'));
test('text transforms',()=>assert.equal(phoneticTools('DOG').reverse,'GOD'));
test('catalog preserved',()=>{assert.equal(domains.length,12);assert.ok(gameCatalog.includes('TAP THAT'))});

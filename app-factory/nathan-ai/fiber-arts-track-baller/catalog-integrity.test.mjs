import test from 'node:test';
import assert from 'node:assert/strict';
import { auditFiberCatalog } from './catalog-integrity.mjs';
const catalog = () => Array.from({length:12},(_,i)=>({id:`craft-${i}`,steps:Array.from({length:6},(_,j)=>({id:`step-${j}`}))}));
test('accepts exactly 12 crafts and 72 uniquely identified steps',()=>{const result=auditFiberCatalog(catalog());assert.equal(result.ok,true);assert.equal(result.stepCount,72);assert.equal(result.craftCount,12);});
test('rejects absent catalog',()=>assert.deepEqual(auditFiberCatalog(null).errors,['catalog must be an array']));
test('detects missing craft and step',()=>{const c=catalog();c.pop();c[0].steps.pop();const r=auditFiberCatalog(c);assert.equal(r.ok,false);assert.match(r.errors.join(' '),/12 crafts/);assert.match(r.errors.join(' '),/72 steps/);});
test('detects duplicate craft and step ids',()=>{const c=catalog();c[1].id=c[0].id;c[0].steps[1].id=c[0].steps[0].id;const r=auditFiberCatalog(c);assert.match(r.errors.join(' '),/duplicate craft id/);assert.match(r.errors.join(' '),/duplicate step id/);});
test('does not mutate input',()=>{const c=catalog();const before=JSON.stringify(c);const r=auditFiberCatalog(c);assert.equal(JSON.stringify(c),before);assert.ok(Object.isFrozen(r));});

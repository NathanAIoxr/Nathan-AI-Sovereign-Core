import test from 'node:test';
import assert from 'node:assert/strict';
import { auditFiberGlobalIds } from './catalog-global-id-audit.mjs';
const valid = () => Array.from({length:12}, (_, i) => ({id:`craft-${i}`,steps:Array.from({length:6},(_,j)=>({id:`step-${i}-${j}`}))}));
test('accepts unique 12-craft 72-step snapshot',()=>{const r=auditFiberGlobalIds(valid());assert.equal(r.ok,true);assert.equal(r.stepCount,72)});
test('rejects reused step ID across crafts',()=>{const c=valid();c[1].steps[0].id=c[0].steps[0].id;const r=auditFiberGlobalIds(c);assert.equal(r.ok,false);assert.match(r.errors.join(' '),/reused across crafts/)});
test('preserves source snapshot',()=>{const c=valid();const before=JSON.stringify(c);auditFiberGlobalIds(c);assert.equal(JSON.stringify(c),before)});
test('fails closed on missing catalog',()=>{const r=auditFiberGlobalIds(null);assert.equal(r.ok,false)});

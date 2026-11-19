import test from 'node:test';
import assert from 'node:assert/strict';
import {trainCrosswalk, TRAIN_ROSTER} from './train-crosswalk.mjs';
import {NODES, INTEGRATIONS} from './registry.mjs';
test('six Train roles map to existing graph agent roles without dispatch',()=>{
  const result=trainCrosswalk();
  assert.equal(result.entries.length,6);
  assert.deepEqual(result.entries.map(e=>e.name),TRAIN_ROSTER.map(e=>e[0]));
  assert.equal(result.dispatch,false);
  assert.equal(result.external_requests,0);
});
test('rejects missing names and non-reference-only integration',()=>{
  assert.throws(()=>trainCrosswalk(NODES.filter(n=>n.id!=='dog-ai'),INTEGRATIONS),/Roster mismatch/);
  assert.throws(()=>trainCrosswalk(NODES,INTEGRATIONS.map(x=>x.id==='train'?{...x,mode:'write'}:x)),/reference-only/);
});

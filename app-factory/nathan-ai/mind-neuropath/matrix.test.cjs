'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const m=require('./matrix.js');
test('preserves canonical 0/1 whole-integer rules',()=>{
  assert.equal(m.BUILD,'1+1=2');assert.equal(m.CLEAR,'1-1=0');
  assert.equal(m.evaluate('build','2').correct,true);
  assert.equal(m.evaluate('clear','0').correct,true);
  assert.equal(m.evaluate('build','10').correct,false);
});
test('mirror, memory, hearing and urgency examples are deterministic',()=>{
  assert.equal(m.evaluate('mirror',' robat ').correct,true);
  assert.equal(m.evaluate('memory','3 9 2 8').correct,true);
  assert.equal(m.evaluate('hearing','ilt').correct,true);
  assert.equal(m.evaluate('route','pause').correct,true);
  assert.equal(m.evaluate('cns','spinal').correct,true);
});
test('index is searchable and preserves distinct editions',()=>{
  assert.ok(m.ENTRIES.length>=50);
  assert.ok(m.findEntries('22 IVERSIONS').length===1);
  assert.ok(m.findEntries('26 IVERSIONS').length>=1);
  assert.ok(m.findEntries('nervous','Neural & anatomy').length>=1);
  assert.ok(m.ENTRIES.every(e=>e.title&&e.family&&e.stage));
});
test('rejects unknown tasks and excessive inputs; does not generate medical scoring',()=>{
  assert.throws(()=>m.evaluate('not-real','x'),RangeError);
  assert.throws(()=>m.evaluate('build','x'.repeat(101)),RangeError);
  assert.equal(m.evaluate('build','2').clinicalScore,false);
});

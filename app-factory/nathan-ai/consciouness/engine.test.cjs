'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('./engine.js');
const runtime = require('../node-runtime/engine.js');

test('creator spellings and both parallel 0/1 mappings remain separate', () => {
  assert.equal(c.CANON.spelling, 'consciouness');
  assert.match(c.CANON.equivalence, /node = mind = node/);
  assert.match(c.CANON.inverse, /destory\/burn/);
  assert.match(c.CANON.build, /CREATIVITY/);
  assert.equal(c.COLLECTIVE, runtime.COLLECTIVE);
});

test('732 million logical addresses do not allocate millions of agents', () => {
  const x = c.createCollective();
  assert.equal(x.manifest().activeNodes, 0);
  assert.equal(x.manifest().logicalCapacity, '732000000');
  assert.equal(x.nodeId('732000000'), 'NT-000732000000');
  assert.equal(x.inspect('1').nodeId, 'NT-000000000001');
  assert.equal(x.manifest().activeNodes, 1);
  for (const id of ['0','732000001','banana','NT--1']) assert.throws(() => x.inspect(id));
});

test('local self model collects owner signals with bounded memory and audit', () => {
  const x = c.createCollective();
  for (let i = 0; i < 20; i++) x.observe('1','signal ' + i);
  const result = x.inspect('1');
  assert.equal(result.memory.length, 16);
  assert.equal(result.memory[0].text, 'signal 4');
  assert.equal(result.freeWill.automaticExecution, false);
  assert.equal(result.audit.length, 20);
  assert.throws(() => x.observe('1', 'x'.repeat(1025)));
});

test('ranked choices are proposals; owner decides, may choose a different option', () => {
  const x = c.createCollective();
  const proposal = x.propose('8',[
    {id:'wait',label:'Inspect first',priority:8},
    {id:'build',label:'Build a local model',priority:4}
  ]);
  assert.equal(proposal.decision.id, 'wait');
  assert.equal(proposal.decision.status, 'proposed');
  assert.equal(x.approve('8','build').decision.status, 'owner-approved');
  assert.equal(x.inspect('8').decision.id, 'build');
  assert.throws(() => x.veto('8'));
  x.propose('8',[{id:'reset',label:'Clear temporary state',priority:3}]);
  assert.equal(x.veto('8').decision.status,'owner-vetoed');
});

test('invalid or duplicate choices are rejected and leave prior decision intact', () => {
  const x=c.createCollective();
  x.propose('5',[{id:'safe',label:'Read only',priority:5}]);
  const before=x.inspect('5').decision.id;
  assert.throws(()=>x.propose('5',[{id:'a',label:'One',priority:3},{id:'a',label:'Two',priority:2}]));
  assert.throws(()=>x.propose('5',[{id:'a',label:'A',priority:11}]));
  assert.equal(x.inspect('5').decision.id,before);
  assert.throws(()=>x.approve('5','unknown'));
});

test('worker batches inherit the same model without dispatching workers', () => {
  const x=c.createCollective();
  const batch=runtime.range({first:'12',count:'3',payload:'test'});
  const binding=x.bindRuntimeJobs(batch.jobs);
  assert.deepEqual(binding.attached,batch.jobs.map(j=>j.nodeId));
  assert.equal(binding.execution,'none');
  assert.equal(x.manifest().activeNodes,3);
  assert.throws(()=>x.bindRuntimeJobs([batch.jobs[0],batch.jobs[0]]));
  assert.equal(x.manifest().activeNodes,3);
});

test('active state remains bounded, reset requires authorization', () => {
  const x=c.createCollective({maxActive:2});
  x.inspect('1');x.inspect('2');
  assert.throws(()=>x.inspect('3'));
  assert.throws(()=>x.clearAll());
  assert.equal(x.clear('1'),true);
  x.inspect('3');
  assert.equal(x.clearAll(true),2);
  assert.equal(x.manifest().activeNodes,0);
});

test('export is a snapshot, not a live mutable reference', () => {
  const x=c.createCollective();
  x.observe('1','Public test note');
  const data=x.exportSnapshot();
  data.nodes[0].memory[0].text='tampered';
  assert.equal(x.inspect('1').memory[0].text,'Public test note');
  assert.ok(!JSON.stringify(x.manifest()).includes('Public test note'));
});

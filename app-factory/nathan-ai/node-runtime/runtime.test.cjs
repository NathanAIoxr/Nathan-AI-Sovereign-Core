'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto'),api=require('./engine.js');
test('original life formula preserves every supplied operator and symbol',()=>{
  assert.equal(api.LIFE_FORMULA,String.raw`\Phi_{\text{life}} = \mathcal{A} \rightarrow [\,\mathbf{Ca}^{2+}_{\text{wave}} \implies \mathbf{Zn}^{2+}_{\text{flash}} \implies \mathcal{S}_{\text{hard}} \implies \mathcal{C}_{\text{init}}\,]`);
  assert.deepEqual(api.PHASES.map(x=>x.name),['Awaken','Ignite','Protect','Grow']);
});
test('large registry is a bounded lazy address range, not millions of processes',()=>{
  const x=api.range({additional:'10',first:'732000000',count:'3',payload:'abc'});
  assert.equal(x.capacity,'732000010');assert.equal(x.jobs.length,3);assert.equal(x.jobs[0].nodeId,'NT-000732000000');assert.equal(x.jobs[2].nodeId,'NT-000732000002');
  assert.equal(api.range({count:'32'}).jobs.length,32);
  for(const config of [{count:'33'},{first:'0'},{count:'0'},{first:'732000000',count:'2'},{additional:'-1'},{additional:'1000000000001'},{payload:'😀'.repeat(5000)}])assert.throws(()=>api.range(config));
});
test('only explicit owner-started checksum tasks pass the worker policy',()=>{
  const task={type:'checksum',ownerStarted:true,runId:'run-one',jobId:'job-one',nodeId:'NT-000000000001',payload:'abc'};
  assert.deepEqual(api.request(task),task);
  for(const change of [{type:'execute-code'},{ownerStarted:false},{runId:''},{nodeId:'external-url'},{payload:42}])assert.throws(()=>api.request({...task,...change}));
});
test('worker executes a known checksum and reports the four software phases',async()=>{
  const messages=[],context={self:{NathanNodeRuntime:api,postMessage:m=>messages.push(m)},importScripts(){},crypto:webcrypto,TextEncoder,Uint8Array};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'worker.js'),'utf8'),context);
  await context.self.onmessage({data:{type:'checksum',ownerStarted:true,runId:'r',jobId:'j',nodeId:'NT-000000000001',payload:'abc'}});
  assert.deepEqual(messages.map(x=>x.stage),['awakened','ignited','protected','running','completed']);
  assert.equal(messages.at(-1).digest,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.equal(messages.at(-1).bytes,3);
  messages.length=0;await context.self.onmessage({data:{type:'checksum',ownerStarted:false}});assert.deepEqual(messages.map(x=>x.stage),['rejected']);
});
test('stale runs and malformed result packets cannot update a current job',()=>{
  const jobs=[{jobId:'j',nodeId:'NT-000000000001'}],m={runId:'r',jobId:'j',nodeId:jobs[0].nodeId,stage:'completed',digest:'a'.repeat(64)};
  assert.equal(api.result(m,'r',jobs),true);assert.equal(api.result(m,'old',jobs),false);assert.equal(api.result({...m,jobId:'other'},'r',jobs),false);assert.equal(api.result({...m,digest:'bad'},'r',jobs),false);
});

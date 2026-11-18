const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const runtime=import(pathToFileURL(path.join(__dirname,'worker.mjs')).href);
async function call(pathname,method='GET',body) {
  const m=(await runtime).default;
  const req=new Request('https://train.example'+pathname,{method,headers:method==='POST'?{'content-type':'application/json'}:{},body:body===undefined?undefined:JSON.stringify(body)});
  const res=await m.fetch(req);
  return {status:res.status,data:await res.json()};
}
test('all three operations advertised and command roles retained',async()=>{
  const {data}=await call('/operations');
  assert.deepEqual(data.operations.map(x=>x.id),['ram','octopus','convoy']);
  assert.equal(data.lanes.length,8);
  const {data:roster}=await call('/roster');
  for(const agent of ['Nathan AI','DOG AI','REAPER AI','Santa Claus AI','Miss Stacy Clause AI','007 @Will AI']) assert.ok(roster.agents.some(x=>x.name===agent));
});
test('RAM de-duplicates and OCTOPUS allocates eight traceable channels',async()=>{
  const {status,data}=await call('/run','POST',{tasks:['Restore Library','restore   library','Audit evidence',{title:'Repair broken Worker',lane:'repair'},'']});
  assert.equal(status,200);
  assert.equal(data.operations.ram.accepted,3);
  assert.deepEqual(data.operations.ram.duplicates,[2]);
  assert.deepEqual(data.operations.ram.rejected,[5]);
  assert.equal(data.operations.octopus.arms,8);
  assert.equal(data.operations.octopus.lanes.repair.items.length,1);
  assert.equal(data.operations.convoy.total_batches,1);
  assert.equal(data.operations.convoy.remote_writes,0);
  assert.equal(data.operations.convoy.replicas_created,0);
});
test('CONVOY limits its review batches to four items',async()=>{
  const titles=Array.from({length:9},(_,i)=>'Project '+(i+1));
  const {data}=await call('/run','POST',{tasks:titles});
  assert.deepEqual(data.operations.convoy.batches.map(x=>x.items.length),[4,4,1]);
  assert.ok(data.operations.convoy.batches.every(b=>!b.dispatch&&b.state==='awaiting_owner_review'));
});
test('invalid work is rejected, and demo requires no secrets',async()=>{
  assert.equal((await call('/run','POST',{tasks:{title:'invalid'}})).status,400);
  assert.equal((await call('/run','POST',{tasks:Array.from({length:25},(_,i)=>'Task '+i)})).status,400);
  assert.equal((await call('/not-found')).status,404);
  assert.equal((await call('/demo')).status,200);
});

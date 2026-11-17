import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import test from 'node:test';
import {handle} from './worker.mjs';
import {run,start} from './runner.mjs';

const schema = await readFile(new URL('./schema.sql',import.meta.url),'utf8');
const token = 'local-fixture-token-only-not-for-use';
const hash = bytes=>createHash('sha256').update(bytes).digest('hex');

function fixture(t) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(()=>sqlite.close());
  sqlite.exec('PRAGMA foreign_keys=ON;'+schema);
  function prepare(sql) {
    const stm=sqlite.prepare(sql.replace(/\?(\d+)/g,'$arg$1'));
    const names = [...sql.matchAll(/\?(\d+)/g)].map(x=>Number(x[1]));
    return {
      bind(...args) {
        if (!names.length) return {first:async()=>stm.get(...args)??null,all:async()=>({results:stm.all(...args)}),run:()=>stm.run(...args)};
        const highest = Math.max(...names);
        const named = Object.fromEntries([...new Set(names)].map(n=>['$arg'+n,args[n-1]]));
        const a=[named,...args.slice(highest)];
        return {first:async()=>stm.get(...a)??null,all:async()=>({results:stm.all(...a)}),run:()=>stm.run(...a)};
      }
    };
  }
  const LEDGER = {prepare,batch:async statements=>{
    sqlite.exec('BEGIN');
    try { const results=statements.map(s=>s.run());sqlite.exec('COMMIT');return results; }
    catch(error){sqlite.exec('ROLLBACK');throw error;}
  }};
  let now = 1_000_000;
  function request(path,body,credential=token) {
    return handle(new Request('https://local.test'+path,{
      method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+credential},
      body:body===undefined?undefined:JSON.stringify(body)
    }),{LEDGER,RUNNER_TOKEN:token},now);
  }
  async function call(path,body) {
    const response=await request(path,body);
    assert.ok(response.ok,JSON.stringify(await response.clone().json()));
    return response.json();
  }
  return {sqlite,request,call,advance:n=>{now+=n;}};
}

const task = (id,dependsOn=[],extra={})=>({id,role:'build',instruction:'Build the example',acceptance:['Check the output'],dependsOn,...extra});
const plan = (tasks)=>({id:'pilot',root:'atlas',mode:'both',title:'Project runner pilot',brief:'Verify automatic handoffs',tasks});
const jobs = '/v1/jobs';
const pilot = jobs+'/pilot';
const next = {root:'atlas',roles:['build','review','integrate','verify']};
const evidence = {artifact:{path:'example.txt',sha256:hash('fixture')},checks:[{name:'Fixture file',result:'passed'}]};
const finish = (claim, outcome='accepted', data=evidence)=>({attempt:claim.task.attempt,lease:claim.lease,outcome,evidence:data});

test('private routes, plan validation, idempotent submit and competing claims',async t=>{
  const {request,call} = fixture(t);
  assert.equal((await request(pilot,undefined,'wrong')).status,401);
  assert.equal((await request(jobs,plan([task('a',['b']),task('b',['a'])]))).status,400);
  const manifest=plan([task('a'),task('b',['a'],{role:'review'})]);
  assert.equal((await request(jobs,manifest)).status,201);
  assert.equal((await request(jobs,manifest)).status,201);
  assert.equal((await request(jobs,{...manifest,title:'Changed'})).status,409);
  const replies = await Promise.all([call(pilot+'/claim',next),call(pilot+'/claim',next)]);
  const [first] = replies.filter(r=>r.task);
  assert.equal(replies.filter(r=>r.task).length,1);
  assert.equal(first.task.id,'a');
  const path=pilot+'/tasks/a/finish';
  assert.equal((await request(path,finish(first,'accepted',{}))).status,400);
  assert.deepEqual(await call(path,finish(first)),{state:'accepted'});
  assert.deepEqual(await call(path,finish(first)),{state:'accepted',replayed:true});
  assert.equal((await call(pilot+'/claim',next)).task.id,'b');
});

test('expired leases are fenced and exhausted blockers propagate without touching siblings',async t=>{
  const {request,call,advance,sqlite} = fixture(t);
  await call(jobs,plan([task('a',[],{maxAttempts:2}),task('b',['a']),task('c')]));
  const first = await call(pilot+'/claim',next);
  advance(121_000);
  const second = await call(pilot+'/claim',next);
  assert.equal(second.task.attempt,2);
  assert.equal((await request(pilot+'/tasks/a/finish',finish(first))).status,409);
  assert.equal((await request(pilot+'/tasks/a/heartbeat',{lease:first.lease,attempt:1})).status,409);
  await call(pilot+'/tasks/a/finish',finish(second,'retry',{reason:'Fixture failed'}));
  const third=await call(pilot+'/claim',next);
  assert.equal(third.task.id,'c');
  await call(pilot+'/tasks/c/finish',finish(third));
  const status=await call(pilot);
  assert.equal(status.state,'blocked');
  assert.deepEqual(status.counts,{pending:0,running:0,accepted:1,blocked:2});
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM runner_receipts').get().n,3);
});

test('runner resumes a saved artifact after the two finish requests lose their responses',async t=>{
  const {call,advance,sqlite} = fixture(t);
  const dir = await mkdtemp(join(tmpdir(),'nathan-runner-test-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  await mkdir(join(dir,'artifacts'));
  const adapter=join(dir,'adapter.mjs');
  await writeFile(adapter,`
import {appendFile,writeFile} from 'node:fs/promises';
const chunks=[];
for await(const part of process.stdin) chunks.push(part);
const {task,dependencies}=JSON.parse(Buffer.concat(chunks));
if(process.env.NATHAN_RUNNER_TOKEN) process.exit(1);
if (task.id==='review' && dependencies[0]?.receipt?.artifact?.path!=='artifacts/build.txt') process.exit(1);
const path='artifacts/'+task.id+'.txt';
await writeFile(path,task.instruction);
await appendFile('invocations',task.id+'\\n');
console.log(JSON.stringify({outcome:'accepted',evidence:{artifact:{path},checks:[{name:'Fixture written',result:'passed'}]}}));
`);
  await call(jobs,plan([task('build'),task('review',['build'],{role:'review'})]));
  const settings={jobId:'pilot',root:'atlas',cwd:dir,journal:join(dir,'journal'),adapter:process.execPath,args:[adapter],pollMs:100};
  let drops=0;
  const unreliable=async(path,body)=>{
    if(path.endsWith('/build/finish') && drops++<2) throw new Error('Fixture connection lost before request');
    if(path.endsWith('/claim') && drops===2) advance(121_000);
    return call(path,body);
  };
  const status=await run(unreliable,settings);
  assert.equal(status.state,'complete');
  assert.equal(await readFile(join(dir,'invocations'),'utf8'),'build\nreview\n');
  assert.equal(sqlite.prepare("SELECT attempt FROM runner_tasks WHERE id='build'").get().attempt,2);
  assert.equal(status.tasks[0].receipt.artifact.sha256,hash('Build the example'));
});

test('one brief plans once and resumes from the checkpoint without another planner call',async t=>{
  const {call} = fixture(t);
  const dir = await mkdtemp(join(tmpdir(),'nathan-start-test-'));
  t.after(()=>rm(dir,{recursive:true,force:true}));
  const adapter=join(dir,'adapter.mjs');
  await writeFile(adapter,`
import {appendFile,writeFile} from 'node:fs/promises';
const chunks=[];
for await(const part of process.stdin) chunks.push(part);
const packet=JSON.parse(Buffer.concat(chunks));
if (packet.operation==='plan') {
  await appendFile('invocations','plan\\n');
  console.log(JSON.stringify({tasks:[{id:'write',role:'build',instruction:'Write fixture',acceptance:['Saved fixture']}]}));
} else {
  await appendFile('invocations','build\\n');
  await writeFile('draft.md','# Fixture');
  console.log(JSON.stringify({outcome:'accepted',evidence:{artifact:{path:'draft.md'},checks:[{name:'Draft saved',result:'passed'}]}}));
}
`);
  const {tasks,...project}=plan([]);
  const settings={project,cwd:dir,journal:join(dir,'journal'),adapter:process.execPath,args:[adapter],pollMs:100};
  assert.equal((await start(call,settings)).state,'complete');
  assert.equal((await start(call,settings)).state,'complete');
  assert.equal(await readFile(join(dir,'invocations'),'utf8'),'plan\nbuild\n');
});

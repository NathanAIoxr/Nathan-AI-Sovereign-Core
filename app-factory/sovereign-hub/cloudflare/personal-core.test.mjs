import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {b64,digest,utf8} from './core.mjs';
import {BOT_ROLES} from './swarm.mjs';
import {
 coreRegistry,boxValue,pixelBox,reversePlan,planRole,observationFromJob,grantMessage,subjectMessage,verifyPortableGrant,
} from './personal-core.mjs';

test('every bot has its own agent identity, source links, and four axes',()=>{
 const registry=coreRegistry(BOT_ROLES);
 assert.deepEqual(registry.agents.map(a=>a.id),BOT_ROLES.map(b=>b.id));
 assert.ok(registry.sources.length>=8);
 for(const agent of registry.agents)assert.ok(registry.links.some(link=>link.from===agent.id));
 assert.ok(registry.links.every(link=>link.authority===false));
 assert.deepEqual(new Set(registry.links.flatMap(link=>Object.keys(link.shared))),
  new Set(['attributes','characteristics','functionalities','traits']));
});

test('separate box addresses preserve null, absent keys, nested objects, and pixel channels',()=>{
 const boxes=boxValue('root',{child:[null,{key:0}],'/~':false});
 assert.deepEqual(boxes.map(x=>x.address),['root#','root#/~1~0','root#/child','root#/child/0','root#/child/1','root#/child/1/key']);
 assert.equal(boxes[3].type,'nothing');
 assert.ok(!boxes.some(x=>x.address==='root#/missing'));
 assert.throws(()=>boxValue('root',{child:{leaf:3}},{maxDepth:1}),/limits/);
 assert.notEqual(pixelBox('image',100_000,50,99_999,49,'b').address,pixelBox('image',100_000,50,99_999,49,'r').address);
 assert.throws(()=>pixelBox('image',4,4,4,0),/outside/);
});

test('reverse plan chooses a supported alternative and holds on missing, contradictory, or cyclic requirements',()=>{
 const rules=[
  {id:'publish-with-a',produces:'live',requires:['candidate-a']},
  {id:'publish-with-b',produces:'live',requires:['candidate-b']},
  {id:'build-b',produces:'candidate-b',requires:['source']},
 ];
 const fact=(id,state)=>({id,state,source:'owner:revision'});
 const accepted=reversePlan('live',rules,[fact('candidate-a','contradicted'),fact('source','verified')]);
 assert.deepEqual(accepted.steps,['build-b','publish-with-b']);
 assert.equal(accepted.decision,'allow');
 assert.equal(reversePlan('live',rules,[]).decision,'hold');
 assert.equal(reversePlan('source',[],[fact('source','verified'),fact('source','contradicted')]).evidence,'contradicted');
 const cycle=reversePlan('a',[{id:'a-from-b',produces:'a',requires:['b']},{id:'b-from-a',produces:'b',requires:['a']}],[]);
 assert.equal(cycle.decision,'hold');
 assert.deepEqual(cycle.blocked,['a']);
});

test('agents choose recovery or request evidence while preserving authority limits',()=>{
 const role=coreRegistry(BOT_ROLES).agents.find(role=>role.id==='ant-fleet-sentinel');
 const row={result:'{"checked":4,"healthy":false}',hash:'test',finished:5000,cycle:'cycle-1',state:'completed'};
 const receipt=observationFromJob(row,role.id,true,6000);
 assert.equal(receipt.state,'contradicted');
 assert.equal(planRole(role,'recover',receipt).next,'propose-recovery');
 assert.equal(planRole(role,'recover',receipt).decision,'hold');
 assert.equal(planRole(role,'recover',observationFromJob(row,role.id,false,6000)).next,'request-evidence');
 assert.equal(planRole(role,'recover',{state:'verified'}).next,'no-repair-needed');
});

test('portable proof validates issuer, audience, request binding, subject and expiry',async()=>{
 const make=async()=>{
  const keys=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
  return {...keys,pub:b64(await crypto.subtle.exportKey('raw',keys.publicKey))};
 };
 const sign=async(keys,message)=>b64(await crypto.subtle.sign('Ed25519',keys.privateKey,utf8(message)));
 const issuer=await make(),subject=await make(),requestHash=await digest('a run');
 const grant={id:'grant-a',issuer:issuer.pub,subject:subject.pub,audience:'zorro-cloud:example.com',
  role:'ant-fleet-sentinel',purpose:'plan',issued:1,expires:50};
 const envelope={grant,signature:await sign(issuer,grantMessage(grant)),proof:await sign(subject,subjectMessage(grant,requestHash))};
 const context={audience:grant.audience,role:grant.role,issuerTrusted:key=>key===issuer.pub,requestHash,subject:subject.pub,now:2};
 const proof=await verifyPortableGrant(envelope,context);
 assert.equal(proof.grant,'grant-a');
 await assert.rejects(verifyPortableGrant(envelope,{...context,requestHash:await digest('another run')}),/invocation proof/);
 await assert.rejects(verifyPortableGrant(envelope,{...context,audience:'zero-cloud:device'}),/scope/);
 await assert.rejects(verifyPortableGrant(envelope,{...context,now:50}),/expiry/);
 await assert.rejects(verifyPortableGrant(envelope,{...context,issuerTrusted:()=>false}),/issuer/);
});

test('Zero-Cloud runs with fetch disabled and keeps idempotent receipts and switches across processes',()=>{
 const scratch=mkdtempSync(join(tmpdir(),'one-zero-')),db=join(scratch,'personal.sqlite'),cli=fileURLToPath(new URL('./personal-core-cli.mjs',import.meta.url));
 const invoke=(command,input)=>{
  const args=command==='status'?[db]:[join(scratch,'input.json'),db];
  if(input)writeFileSync(args[0],JSON.stringify(input));
  return spawnSync(process.execPath,['--import','data:text/javascript,globalThis.fetch%3D()%3D%3E%7Bthrow%20Error(%22offline%22)%7D',cli,command,...args],{encoding:'utf8'});
 };
 const read=result=>{assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);};
 try{
  const run={key:'one',role:'ant-fleet-sentinel',goal:'recover',evidence:{state:'contradicted',source:'snapshot:local'}};
  const first=read(invoke('run',run));assert.equal(first.mode,'zero-cloud');
  assert.deepEqual(read(invoke('run',run)),first);
  assert.notEqual(invoke('run',{...run,goal:'assess'}).status,0);
  read(invoke('control',{role:'*',paused:true}));
  assert.match(invoke('run',{...run,key:'two'}).stderr,/kill switch/);
  assert.equal(read(invoke('status')).guards.paused,true);
  read(invoke('control',{role:'*',paused:false}));
  assert.equal(read(invoke('run',{...run,key:'two'})).plan.next,'propose-recovery');
 }finally{rmSync(scratch,{recursive:true,force:true});}
});

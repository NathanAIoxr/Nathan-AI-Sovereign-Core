import {test} from 'node:test';
import assert from 'node:assert/strict';
import {b64,digest,utf8,canonical} from './core.mjs';
import {grantMessage,subjectMessage} from './personal-core.mjs';
import {createRuntime} from './runtime-fixture.mjs';
function signer(pair,key){return async(path,body,overrides={})=>{const method=body===undefined?'GET':'POST',raw=body===undefined?'':JSON.stringify(body),timestamp=Math.floor(Date.now()/1000),nonce=crypto.randomUUID(),message=canonical(['owner',method,path,await digest(raw),timestamp,nonce]);return {method,headers:{Authorization:'Owner '+key,'X-Agent-Time':String(timestamp),'X-Agent-Nonce':nonce,'X-Agent-Signature':b64(await crypto.subtle.sign('Ed25519',pair.privateKey,utf8(message))),...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:raw}:{}),...overrides};};}
test('actual Workers runtime: owner pairing, identity, sync, booking, projection and workflow',async()=>{const {mf,setup}=await createRuntime();try{const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']),publicKey=b64(await crypto.subtle.exportKey('raw',pair.publicKey)),signed=signer(pair,publicKey);async function call(path,body,status=200){const r=await mf.dispatchFetch('https://example.com'+path,await signed(path,body));const value=await r.json();assert.equal(r.status,status,JSON.stringify(value));return value;}
 let response=await mf.dispatchFetch('https://example.com/api/snapshot');assert.equal(response.status,403,await response.text());response=await mf.dispatchFetch('https://example.com/auth/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:setup,public_key:publicKey,turnstile:null})});assert.equal(response.status,200,await response.text());
 await call('/api/connectors',{connector:'notes',mode:'local'});await call('/api/context',{key:'prefs',value:{budget:1000},expected:0,readers:[],ttl:null});assert.equal((await call('/api/context?key=prefs')).version,1);await call('/api/context',{key:'prefs',value:{},expected:0,readers:[],ttl:null},409);
 const original={connector:'notes',record:'one',value:{text:'first'},expected:0,key:'sync-one'};const first=await call('/api/sync',original);assert.deepEqual(first,await call('/api/sync',original));const conflict=await call('/api/sync',{...original,key:'sync-two',value:{text:'offline'}});assert.equal(conflict.status,'conflict');await call('/api/conflicts/resolve',{conflict:conflict.conflict,choice:'remote'});assert.equal((await call('/api/changes?connector=notes')).items.length,1);
 const fence=await call('/api/booking-fences',{resource:'room'});const booking={resource:'room',key:'book-one',range:{start:'2026-11-17',end:'2026-11-19'},token:fence.token};assert.deepEqual(await call('/api/bookings',booking),await call('/api/bookings',booking));await call('/api/bookings',{...booking,key:'overlap'},409);await call('/api/bookings',{...booking,key:'adjacent',range:{start:'2026-11-19',end:'2026-11-20'}});await call('/api/booking-fences',{resource:'room'});await call('/api/bookings',{...booking,key:'stale',range:{start:'2026-11-20',end:'2026-11-21'}},409);
 const replay=await signed('/api/snapshot');assert.equal((await mf.dispatchFetch('https://example.com/api/snapshot',replay)).status,200);assert.equal((await mf.dispatchFetch('https://example.com/api/snapshot',replay)).status,403);
 const agent=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']),agentPub=b64(await crypto.subtle.exportKey('raw',agent.publicKey));await call('/api/agents',{agent:'reader',public_key:agentPub,scopes:['diagnostics:read'],resources:['notes']});const capability=await call('/api/tokens',{agent:'reader',scopes:['diagnostics:read'],ttl:60});const now=Math.floor(Date.now()/1000),nonce=crypto.randomUUID(),proof=canonical([await digest(capability.token),'GET','/api/snapshot',await digest(''),now,nonce]);const agentHeaders={Authorization:'Bearer '+capability.token,'X-Agent-Time':String(now),'X-Agent-Nonce':nonce,'X-Agent-Signature':b64(await crypto.subtle.sign('Ed25519',agent.privateKey,utf8(proof)))};response=await mf.dispatchFetch('https://example.com/api/snapshot',{headers:agentHeaders});assert.equal(response.status,200);await call('/api/revoke',{jti:capability.jti});
 const health=await call('/api/commands',{connector:'notes',action:'verify-storage',key:'verify-one'});assert.equal(health.healthy,true);const db=await mf.getD1Database('DB');assert.ok((await db.prepare('SELECT COUNT(*) AS n FROM hub_projection').first()).n>=1);await db.prepare("UPDATE hub_projection SET counts='{}',healthy=0").run();assert.equal((await call('/api/commands',{connector:'notes',action:'verify-storage',key:'verify-two'})).healthy,true);assert.equal((await db.prepare('SELECT healthy FROM hub_projection').first()).healthy,1);
 const flow=await call('/api/recovery',{key:'recovery-test'});assert.ok(flow.id);await call('/api/flows',{id:'checkout',expected:0,target:'complete',key:'bad-flow'},409);await call('/api/flows',{id:'checkout',expected:0,target:'shipping',key:'flow-one'});await call('/api/flows',{id:'checkout',expected:1,target:'payment',key:'flow-two'});await call('/api/flows',{id:'checkout',expected:2,target:'complete',key:'flow-three'});await call('/api/flows',{id:'checkout',expected:3,target:'shipping',key:'flow-overshoot'},409);await call('/api/swarm/control',{role:'bee-grapple-observer',paused:true});const swarm=await call('/api/swarm/run',{key:'swarm-local-test'});assert.equal(swarm.roles,9);assert.equal(swarm.vetoed,1);assert.equal(swarm.executed,8);const publicHealth=await (await mf.dispatchFetch('https://example.com/health')).json();assert.equal(publicHealth.recovery.fleet_contracts,11);assert.equal(publicHealth.recovery.fleet_targets,21);const catalogReceipt=(await call('/api/swarm')).healing.catalog;assert.ok(catalogReceipt.count>0);assert.match(catalogReceipt.sha256,/^[a-f0-9]{64}$/);const duplicate=await call('/api/swarm/run',{key:'swarm-local-test'});assert.deepEqual(duplicate,swarm);await call('/api/swarm/control',{role:'*',paused:true});assert.equal((await call('/api/swarm/run',{key:'swarm-veto'})).executed,0);await call('/api/export');assert.equal((await call('/api/snapshot')).conflicts,0);
 const core=(await call('/api/personal-core'));assert.equal(core.profile.mode,'zorro-cloud');assert.equal(core.agents.length,9);
 const agentRequest={key:'fleet-assess',role:'bee-source-verifier',goal:'assess',identity:null};
 const agentRun=await call('/api/personal-core/run',agentRequest);assert.equal(agentRun.observation.state,'verified');assert.equal(agentRun.plan.next,'record-verification');
 assert.deepEqual(await call('/api/personal-core/run',agentRequest),agentRun);
 await call('/api/personal-core/run',{...agentRequest,goal:'recover'},409);
 await call('/api/personal-core/control',{role:agentRequest.role,paused:true});
 await call('/api/personal-core/run',{...agentRequest,key:'paused-run'},423);
 await call('/api/personal-core/control',{role:agentRequest.role,paused:false});
 await call('/api/personal-core/run',{...agentRequest,key:'resumed-run'});
 const delegate=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
 const delegatePub=b64(await crypto.subtle.exportKey('raw',delegate.publicKey));
 await call('/api/agents',{agent:'core-delegate',public_key:delegatePub,scopes:['personal-core:run'],resources:[agentRequest.role]});
 const access=await call('/api/tokens',{agent:'core-delegate',scopes:['personal-core:run'],ttl:60});
 const input={key:'portable-run',role:agentRequest.role,goal:'assess'};
 const issued=Math.floor(Date.now()/1000),grant={id:'delegation',issuer:publicKey,subject:delegatePub,
  audience:'zorro-cloud:example.com',role:input.role,purpose:'plan',issued,expires:issued+60};
 const signature=b64(await crypto.subtle.sign('Ed25519',pair.privateKey,utf8(grantMessage(grant))));
 const delegateProof=b64(await crypto.subtle.sign('Ed25519',delegate.privateKey,utf8(subjectMessage(grant,await digest(canonical(input))))));
 const delegated=async body=>{
  const path='/api/personal-core/run',raw=JSON.stringify(body),at=Math.floor(Date.now()/1000),nonce=crypto.randomUUID();
  const message=canonical([await digest(access.token),'POST',path,await digest(raw),at,nonce]);
  const signed=b64(await crypto.subtle.sign('Ed25519',delegate.privateKey,utf8(message)));
  return mf.dispatchFetch('https://example.com'+path,{method:'POST',body:raw,headers:{Authorization:'Bearer '+access.token,
   'Content-Type':'application/json','X-Agent-Time':String(at),'X-Agent-Nonce':nonce,'X-Agent-Signature':signed}});
 };
 const delegatedBody={...input,identity:{grant,signature,proof:delegateProof}};
 const rejected=await delegated({...delegatedBody,key:'tampered'});
 assert.equal(rejected.status,403,await rejected.text());
 const accepted=await delegated(delegatedBody);
 assert.equal(accepted.status,200);
 assert.equal((await accepted.json()).identity.grant,'delegation');
 await call('/api/revoke',{jti:access.jti});
 assert.equal((await delegated(delegatedBody)).status,403);
 const publicModule=await mf.dispatchFetch('https://example.com/one-core.mjs',{headers:{Origin:'https://other-app.test'}});assert.equal(publicModule.status,200);const evil=await mf.dispatchFetch('https://example.com/api/catalog',{headers:{Origin:'https://evil.test'}});assert.equal(evil.status,403);
 }finally{await mf.dispose();}});

async function ownerRuntime(t) {
 const {mf,setup}=await createRuntime();
 t.after(()=>mf.dispose());
 const newKey=async()=>{
  const pair=await crypto.subtle.generateKey('Ed25519',false,['sign','verify']);
  return {pair,key:b64(await crypto.subtle.exportKey('raw',pair.publicKey))};
 };
 const owner=await newKey();
 const response=await mf.dispatchFetch('https://example.com/auth/pair',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({code:setup,public_key:owner.key,turnstile:null})});
 assert.equal(response.status,200,await response.text());
 const request=(identity,path,body)=>signer(identity.pair,identity.key)(path,body)
  .then(init=>mf.dispatchFetch('https://example.com'+path,init));
 return {mf,owner,request,newKey};
}

test('context writer grants, MCP scopes, owner-only repairs and identity revocation', async t=>{
 const {mf,owner,request,newKey}=await ownerRuntime(t);
 const call=(path,body)=>request(owner,path,body);
 const agent=await newKey();
 const scopes=['context:read','context:write','commands:run','microapps:run'];
 assert.equal((await call('/api/connectors',{connector:'notes',mode:'local'})).status,200);
 assert.equal((await call('/api/agents',{agent:'reader',public_key:agent.key,scopes,resources:['notes','draft']})).status,200);
 const {token}=await (await call('/api/tokens',{agent:'reader',scopes,ttl:60})).json();
 const delegated=async (path,body)=>{
  const method=body===undefined?'GET':'POST',raw=body===undefined?'':JSON.stringify(body);
  const time=Math.floor(Date.now()/1000),nonce=crypto.randomUUID();
  const proof=canonical([await digest(token),method,path,await digest(raw),time,nonce]);
  const signature=b64(await crypto.subtle.sign('Ed25519',agent.pair.privateKey,utf8(proof)));
  return mf.dispatchFetch('https://example.com'+path,{method,...(body===undefined?{}:{body:raw}),headers:{
   Authorization:'Bearer '+token,'Content-Type':'application/json','X-Agent-Time':String(time),'X-Agent-Nonce':nonce,'X-Agent-Signature':signature,
  }});
 };
 const write={key:'private-notes',value:{text:'owned'},expected:0,readers:['reader'],ttl:null};
 assert.equal((await call('/api/context',write)).status,200);
 assert.equal((await delegated('/api/context?key=private-notes')).status,200);
 const edit={...write,expected:1,readers:null,value:{text:'delegated'}};
 assert.equal((await delegated('/api/context',edit)).status,403);
 assert.equal((await call('/api/context/writer',{key:write.key,agent:'reader'})).status,200);
 assert.equal((await delegated('/api/context',edit)).status,200);
 assert.equal((await call('/api/context',{...write,expected:2,readers:[]})).status,200);
 assert.equal((await delegated('/api/context',{...edit,expected:3})).status,403);
 assert.equal((await delegated('/api/context',{...edit,expected:0,key:'draft'})).status,200);
 assert.equal((await delegated('/api/context',{...edit,expected:0,key:'unassigned'})).status,403);
 assert.equal((await delegated('/api/commands',{connector:'notes',action:'verify-storage',key:'repair'})).status,403);
 const list=await (await delegated('/mcp',{jsonrpc:'2.0',id:1,method:'tools/list'})).json();
 assert.deepEqual(list.result.tools.map(tool=>tool.name),['microapp.run']);
 const tool=spec=>delegated('/mcp',{jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'microapp.run',arguments:{spec}}});
 assert.equal((await tool({kind:'duration',start:1,end:2})).status,200);
 const budget={kind:'split-budget',amount_minor:25,currency:'USD',buckets:2};
 assert.equal((await tool(budget)).status,403);
 assert.equal((await delegated('/api/microapps',budget)).status,403);
 assert.equal((await tool(null)).status,400);
 assert.equal((await call('/api/agents/revoke',{agent:'reader'})).status,200);
 assert.equal((await delegated('/api/context?key=draft')).status,403);
});

test('authenticated owner device rotation requires both keys and preserves one active device', async t=>{
 const {owner,request,newKey}=await ownerRuntime(t);
 const next=await newKey();
 assert.equal((await request(owner,'/api/devices/revoke',{public_key:owner.key})).status,409);
 const message=canonical(['one-owner-device-rotate-v1','example.com',owner.key,next.key]);
 const proof=b64(await crypto.subtle.sign('Ed25519',next.pair.privateKey,utf8(message)));
 assert.equal((await request(owner,'/api/devices/rotate',{public_key:next.key,proof:'wrong'})).status,403);
 assert.equal((await request(owner,'/api/devices/rotate',{public_key:next.key,proof})).status,200);
 assert.equal((await request(owner,'/api/devices')).status,403);
 const {devices}=await (await request(next,'/api/devices')).json();
 assert.deepEqual(devices.map(device=>device.public_key),[next.key]);
 assert.equal((await request(next,'/api/devices',{public_key:owner.key})).status,409);
});

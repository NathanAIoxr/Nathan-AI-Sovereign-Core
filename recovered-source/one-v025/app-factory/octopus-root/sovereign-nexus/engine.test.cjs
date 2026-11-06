'use strict';
const {test}=require('node:test'),a=require('node:assert/strict');
const R=require('../engine.js'),F=require('../sovereign-fields/engine.js'),U=require('../uct/engine.js');
const C=require('../sovereign-continuum/engine.js'),B=require('../sovereign-bubble/engine.js');
const Codex=require('../codex.js'),N=require('./engine.js');
const adapters={root:R,field:F,uct:U,continuum:C,bubble:B,codex:Codex};
const all=N.PACKS.map(p=>p.id);
test('explicit consent required and unknown packs denied',()=>{
 a.throws(()=>N.prepare(R,R.create(),adapters,[]),/Choose/);
 a.throws(()=>N.prepare(R,R.create(),adapters,['unknown']),/Unknown/);
 a.throws(()=>N.prepare(R,R.create(),adapters,['arsenal','arsenal']),/duplicate/);
});
test('complete finite 6-pack graft keeps all source nodes and review bin',()=>{
 const s=R.create();const failure=R.attach(s,{from:'core:middle',to:'missing:node',type:'symbolic',note:'Evidence incomplete'}).state;
 const p=N.prepare(R,failure,adapters,all);
 a.equal(p.addedNodes,446);
 a.equal(p.after.nodes,461);a.equal(p.after.reviews,1);
 a.equal(failure.nodes.length,15);a.equal(failure.cookie.length,1);
 a.equal(p.state.cookie[0].why,failure.cookie[0].why);
 a.equal(p.state.nodes.filter(x=>x.id.startsWith('arsenal:')).length,9);
 a.ok(p.state.edges.some(x=>x.from==='arsenal:mirror-pair'&&x.to==='continuum:gate-pair-mirror'));
 a.ok(p.state.edges.some(x=>x.from==='bubble:root'&&x.to==='arsenal:root'));
 a.ok(p.state.nodes.some(x=>x.id==='math:001'));
 a.ok(!p.state.nodes.some(x=>x.id.startsWith('security-grant:')));
 a.equal(p.after.nodes<R.LIMIT,true);
});
test('single game bridge is independent of numerical and owner/private data',()=>{
 const raw=R.create(),p=N.prepare(R,raw,adapters,['arsenal']);
 a.equal(p.addedNodes,9);a.equal(p.after.nodes,24);
 a.equal(p.state.edges.some(x=>x.to==='continuum:gate-pair-mirror'),false);
 a.equal(p.state.edges.some(x=>x.from==='core:middle'&&x.to==='arsenal:root'),true);
 a.deepEqual(raw,R.create());
});
test('grafts idempotently with exact source-byte preservation and no duplicate links',()=>{
 const s=R.create(),p=N.prepare(R,s,adapters,all);
 const after=N.apply(R,s,adapters,p);
 const again=N.prepare(R,after.state,adapters,all);
 a.equal(again.addedNodes,0);a.equal(again.addedLinks,0);
 a.deepEqual(again.state,after.state);
});
test('stale preview prevents a write to a newer user graph',()=>{
 const original=R.create(),p=N.prepare(R,original,adapters,['arsenal']);
 const changed=R.addNode(original,{id:'personal:new',label:'My new root',kind:'project',origin:'Owner-added after preview'}).state;
 a.throws(()=>N.apply(R,changed,adapters,p),/changed after preview/);
 a.equal(changed.nodes.some(x=>x.id==='arsenal:root'),false);
});
test('recovery only when root is unchanged since graft; never silently clobber updates',()=>{
 const s=R.create(),p=N.apply(R,s,adapters,N.prepare(R,s,adapters,['arsenal']));
 const receipt=N.receipt(p),back=N.verifyRollback(p.state,s,receipt);
 a.deepEqual(back,s);
 const edited=R.addNode(p.state,{id:'owner:later',label:'Later root',kind:'project',origin:'Owner'}).state;
 a.throws(()=>N.verifyRollback(edited,s,receipt),/automatic rollback refused/);
 a.throws(()=>N.verifyRollback(p.state,R.create(),{...receipt,beforeFingerprint:'wrong'}),/checksum/);
});
test('conflicting owner-defined IDs fail closed without deleting/relabeling',()=>{
 const s=R.addNode(R.create(),{id:'arsenal:root',label:'Owned by a different original',kind:'project',origin:'Owner'}).state;
 a.throws(()=>N.prepare(R,s,adapters,['arsenal']),/Conflicting/);
 a.equal(s.nodes.find(x=>x.id==='arsenal:root').label,'Owned by a different original');
});
test('missing packs and near-capacity graphs do not attach partial codex or mutate originals',()=>{
 const s=R.create();
 a.throws(()=>N.prepare(R,s,{root:R},['field']),/Missing explicit local adapter/);
 let full=s;for(let i=0;i<385;i++){const out=R.addNode(full,{id:'private:item'+i,label:'Owned item '+i,kind:'project',origin:'Owned'});a.ok(out.ok,i);full=out.state;}
 const n=full.nodes.length;
 a.throws(()=>N.prepare(R,full,adapters,['codex']),/partially|capacity|conflicted|Root capacity/);
 a.equal(full.nodes.length,n);a.equal(full.cookie.length,0);
});
test('navigation catalog is path-scoped; no network, private-data access or cross-app writes',()=>{
 a.ok(N.MODULES.length>=17);for(const m of N.MODULES){a.match(m.href,/^\.\.\/|^\.\.\/\.\.\//);a.ok(!m.href.includes('://'));a.ok(!m.href.includes('?'));}
 const s=JSON.stringify(N.PACKS);a.ok(!s.includes('account_key'));
 a.ok(N.PACKS.every(p=>p.namespace&&p.description));
});

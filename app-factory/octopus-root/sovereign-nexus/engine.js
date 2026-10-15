/* NATHAN AI — SOVEREIGN NEXUS v1
   Finite, opt-in, local-only connector for Octopus ROOT data. Never a permission grant,
   authenticated authorization, import from other apps, publication, deletion, or upload. */
(function(host,make){'use strict';const api=make();if(typeof module==='object'&&module.exports)module.exports=api;else host.SovereignNexus=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='tabor.sovereign-nexus.v1',KEY='tabor-octopus-root-v1',BACKUP_KEY='tabor.sovereign-nexus.rollback.v1';
const PACKS=Object.freeze([
 {id:'field',name:'SOVEREIGN FIELD LAB',namespace:'field',required:['root','field'],type:'model',description:'27 independent model receptors, with mathematics separated from fictional effects.'},
 {id:'uct',name:'UNIVERSAL CONTINUUM',namespace:'uct',required:['root','uct'],type:'model',description:'Seven continuum branches with mathematical, speculative and fictional statuses.'},
 {id:'continuum',name:'SOVEREIGN CONTINUUM',namespace:'continuum',required:['root','continuum'],type:'model',description:'25 numerical gates and six deep-model Root records.'},
 {id:'bubble',name:'SOVEREIGN BUBBLE',namespace:'bubble',required:['root','bubble'],type:'policy-model',description:'One-way invitation, revocation and default-deny concepts, not real server authorization.'},
 {id:'codex',name:'TABOR ROOT CODEX',namespace:'math',required:['root','codex'],type:'read-only-index',description:'216 reference nodes with separate historical/source classifications.'},
 {id:'arsenal',name:'OCTOPUS ARSENAL',namespace:'arsenal',required:['root'],type:'fictional-game',description:'Eight original game powers, campaign and consent-preserving knowledge links.'}
]);
const MODULES=Object.freeze([
 ['root','OCTOPUS ROOT','../index.html','Foundation','The main graph, with explicit receptor checks and a recoverable review tray'],
 ['arsenal','NATHAN TABOR OCTOPUS','../octopus-arsenal/index.html','Game','8 tentacles and 15 arena waves; game save stays independent'],
 ['continuum','SOVEREIGN CONTINUUM','../sovereign-continuum/index.html','Mathematics','25 interactive formulas and six deeper model references'],
 ['field','SOVEREIGN FIELD LAB','../sovereign-fields/index.html','Mathematics','27 receptors modeling fields, geometry, signal and force'],
 ['uct','UNIVERSAL CONTINUUM','../uct/index.html','Research & fiction','Seven branches; source/status boundaries retained'],
 ['bubble','SOVEREIGN BUBBLE','../sovereign-bubble/index.html','Permission model','Invitations and revocations remain a separate educational model'],
 ['glyphs','TRIPLE-CODE RAIL','../uct/triple-code/index.html','Ancient numbers','Numbers, geometric relations and glyph interpretations'],
 ['middle','THE MIDDLE C','../../middle-c/index.html','Word game','Independent word and number reversals'],
 ['roots','100 MATH ROOTS','../../stewie-mr-finn/polar-middle-c/math-roots/index.html','Math game','Root-solving puzzles and numerical verifications'],
 ['one','ONE','../../one/index.html','Life platform','Separate local-first personal shell; no data access by Nexus'],
 ['boxes','SOVEREIGN BOXES','../../sovereign-boxes/index.html','Original games','Independent sovereign game registry'],
 ['node','UNIVERSAL NODE','../../universal-node/index.html','Mathematics & games','Independent coordinate and node models'],
 ['gps','TABOR GPS','../../tabor-gps/index.html','Location research','Separate location calculations; Nexus does not read positions'],
 ['pricing','FACTORY PRICING','../../pricing-router/index.html','Product planning','Separate free-first audience policy and release configuration'],
 ['vault','CREATOR VAULT','../../vault.html','Library','Independent archive; Nexus never scans or imports its files'],
 ['eco','FACTORY ECOSYSTEM','../../ecosystem.html','Directory','Published public product registry and navigation'],
 ['factory','TABOR 1–2–3 FACTORY','../../index.html','Factory','Independent launch and product coordination'],
 ['map','ROOT CONSTELLATION','../../root-constellation.html','Map','Reference-only family navigation'],
 ['crown','CROWNING JEWEL','../../games/crowning-jewel.html','Game','Independent game story and save']
].map(([id,name,href,category,description])=>Object.freeze({id,name,href,category,description})));
const ARSENAL_NODES=Object.freeze([
 ['arsenal:root','THE ARSENAL OF THE MIDDLE C','project','Eight original fictional game powers; does not operate real hardware'],
 ['arsenal:void-wall','THE VOID WALL','symbol','Fictional game repulsion, inspired by shape-field modeling'],
 ['arsenal:fire-column','THE FIRE COLUMN','symbol','Fictional beam, compared with ideal plasma mathematics'],
 ['arsenal:backoff-gate','THE BACK-OFF GATE','symbol','Fictional knockback, compared with plasma cutoff'],
 ['arsenal:fading-wall','THE FADING WALL','symbol','Fictional slowdown cloud, compared with wave attenuation'],
 ['arsenal:field-pressure','PRESSURE WITHOUT A HAND','symbol','Fictional area push, compared with magnetic pressure'],
 ['arsenal:moment-bender','MOMENT BENDER','symbol','Fictional time slowdown, not real time control'],
 ['arsenal:quiet-coil','THE QUIET COIL','symbol','Fictional chain arc, compared with ideal Faraday induction'],
 ['arsenal:mirror-pair','THE MIRROR PAIR','symbol','Fictional paired impact, not remote quantum targeting']
].map(([id,label,kind,note])=>Object.freeze({id,label,kind,note})));
const ARSENAL_REFERENCES=Object.freeze([
 ['arsenal:void-wall','continuum:gate-warp-wall'],
 ['arsenal:fire-column','continuum:gate-fire-column'],
 ['arsenal:backoff-gate','continuum:gate-frequency-gate'],
 ['arsenal:fading-wall','continuum:gate-wave-fade'],
 ['arsenal:field-pressure','continuum:gate-field-pressure'],
 ['arsenal:moment-bender','continuum:gate-clock-bender'],
 ['arsenal:quiet-coil','continuum:gate-quiet-coil'],
 ['arsenal:mirror-pair','continuum:gate-pair-mirror']
]);
const COMPARISONS=Object.freeze([
 ['field:metric','uct:warp','Independent spacetime mathematics and hypothetical metric-story research'],
 ['field:clock','continuum:gate-clock-bender','Clock ratio models compared without conflating physical time and game slow-motion'],
 ['field:render','continuum:gate-eye-budget','Both include workload models for finite rendering'],
 ['field:pinch','uct:plasma','Ideal plasma relation versus a broader research concept'],
 ['field:cutoff','uct:shield','Ideal frequency cutoff versus hypothetical field protections'],
 ['field:hover','uct:repulsor','Support force does not mean antigravity'],
 ['field:erasure','uct:machine','Thermodynamic bound does not imply computational consciousness'],
 ['field:identity','continuum:family-paradox','Digest integrity is not an authentication grant'],
 ['bubble:root','arsenal:root','Sovereign boundary applies to game connections; symbolic link grants nothing'],
 ['bubble:root','field:sovereign','Independent mathematical field lab remains distinct'],
 ['bubble:root','uct:continuum','Independent fictional and research nodes remain distinct'],
 ['bubble:root','continuum:root','Numerical laboratory retains independent model validity']
]);
const canonical=x=>JSON.stringify(x);
const fingerprint=x=>{const s=typeof x==='string'?x:canonical(x);let a=0x811c9dc5;for(let i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,0x01000193)}return ('00000000'+(a>>>0).toString(16)).slice(-8)};
const copy=x=>JSON.parse(JSON.stringify(x));
function selectedPacks(selection){
 if(!Array.isArray(selection)||!selection.length)throw Error('Choose at least one pack; nothing is attached by default.');
 const ids=selection.map(x=>String(x)),allowed=new Set(PACKS.map(x=>x.id));
 if(new Set(ids).size!==ids.length||ids.some(x=>!allowed.has(x)))throw Error('Unknown or duplicate pack; denied');
 return PACKS.filter(p=>ids.includes(p.id));
}
function requireEngine(adapters,name){if(!adapters||!adapters[name])throw Error('Missing explicit local adapter: '+name);return adapters[name]}
function exists(s,id){return s.nodes.some(n=>n.id===id)}
function link(s,R,from,to,note){
 if(!exists(s,from)||!exists(s,to))return {state:s,added:0};
 if(s.edges.some(e=>e.from===from&&e.to===to&&e.type==='symbolic'))return {state:s,added:0};
 const r=R.attach(s,{from,to,type:'symbolic',note:'KNOWLEDGE COMPARISON ONLY — NOT ACCESS. '+note});
 if(!r.ok)throw Error('Cross-reference denied: '+r.why);
 return {state:r.state,added:1};
}
function arsenalInstall(R,s){
 let next=s,added=0,linked=0;
 for(const n of ARSENAL_NODES){
  const before=next.nodes.find(x=>x.id===n.id);
  if(before){if(before.label!==n.label||before.kind!==n.kind)throw Error('Conflicting original arsenal node: '+n.id);continue;}
  const r=R.addNode(next,{id:n.id,label:n.label,kind:n.kind,origin:'NATHAN TABOR OCTOPUS original game; '+n.note});
  if(!r.ok)throw Error('Arsenal install rejected: '+r.why);next=r.state;added++;
 }
 for(const [from,to,note] of [
  ['core:middle','arsenal:root','Game nodes are separated from research physics'],
  ...ARSENAL_NODES.slice(1).map(n=>['arsenal:root',n.id,n.note]),
  ...ARSENAL_REFERENCES.map(([a,b])=>[a,b,'Original fictional game power cross-referenced to numerical model'])
 ]){
  const result=link(next,R,from,to,note);next=result.state;linked+=result.added;
 }
 return {state:next,added,linked,conflicts:[]};
}
function precheck(R,s){
 if(!R||typeof R.addNode!=='function'||typeof R.attach!=='function'||typeof R.save!=='function'||typeof R.load!=='function')throw Error('Compatible Octopus ROOT required');
 if(!s||s.schema!==R.SCHEMA)throw Error('Incorrect Root schema');
 // Validate through a discarded copy; R.load marks links imported-unverified by design.
 const temp=R.load(R.save(s));
 if(temp.nodes.length!==s.nodes.length||temp.edges.length!==s.edges.length)throw Error('Root integrity mismatch');
}
function ensureRetained(a,b){
 if(b.nodes.length<a.nodes.length||b.edges.length<a.edges.length||b.cookie.length<a.cookie.length)throw Error('Sovereign no-loss contract violated');
 for(let i=0;i<a.nodes.length;i++)if(canonical(a.nodes[i])!==canonical(b.nodes[i]))throw Error('Existing node modified or reordered: '+a.nodes[i].id);
 for(let i=0;i<a.edges.length;i++)if(canonical(a.edges[i])!==canonical(b.edges[i]))throw Error('Existing link changed or reordered');
 for(let i=0;i<a.cookie.length;i++)if(canonical(a.cookie[i])!==canonical(b.cookie[i]))throw Error('Review tray modified');
 if(a.counter>b.counter)throw Error('Root counter regressed');
}
function prepare(R,state,adapters,selection){
 precheck(R,state);const chosen=selectedPacks(selection);const original=copy(state);let s=copy(state);const summary=[],warnings=[];
 for(const pack of chosen){
  for(const req of pack.required)requireEngine(adapters,req);
  const n=s.nodes.length,e=s.edges.length;
  let result;
  switch(pack.id){
   case 'field':result=adapters.field.install(R,s);break;
   case 'uct':result=adapters.uct.install(R,s);break;
   case 'continuum':result=adapters.continuum.graft(s,R);break;
   case 'bubble':result=adapters.bubble.install(R,s);break;
   case 'codex':result=adapters.codex.enrich(R,s);break;
   case 'arsenal':result=arsenalInstall(R,s);break;
   default:throw Error('Unregistered pack');
  }
  if(!result?.state)throw Error('Adapter did not return a state: '+pack.id);
  if(result.conflicts?.length)throw Error(pack.id+' conflicted: '+result.conflicts.slice(0,3).join(' | '));
  s=result.state;ensureRetained(original,s);
  const newNodes=s.nodes.length-n,newLinks=s.edges.length-e;
  if(pack.id==='codex'&&newNodes!==0&&newNodes!==adapters.codex.RECORDS.length+adapters.codex.CONCEPTS.length)
    throw Error('Codex would attach partially; operation blocked');
  summary.push({id:pack.id,name:pack.name,newNodes,newLinks});
 }
 let cross=0;
 for(const [a,b,note] of COMPARISONS){
  const r=link(s,R,a,b,note);s=r.state;cross+=r.added;
 }
 ensureRetained(original,s);
 if(s.nodes.length>R.LIMIT||s.edges.length>4000||s.cookie.length>4000)throw Error('Root capacity exceeded; no changes applied');
 precheck(R,s);
 warnings.push('Knowledge links are symbolic and do not grant access or verify scientific claims.');
 warnings.push('No private files, other app saves, tokens, credentials, browser tabs, external services or location were read.');
 return {schema:VERSION,selection:chosen.map(p=>p.id),summary,addedNodes:s.nodes.length-original.nodes.length,addedLinks:s.edges.length-original.edges.length,
   crosslinks:cross,before:{nodes:original.nodes.length,edges:original.edges.length,reviews:original.cookie.length},
   after:{nodes:s.nodes.length,edges:s.edges.length,reviews:s.cookie.length},
   beforeFingerprint:fingerprint(original),afterFingerprint:fingerprint(s),warnings,state:s};
}
function assertFresh(current,prepared){
 if(!prepared||prepared.schema!==VERSION||!Array.isArray(prepared.selection))throw Error('Nexus preview required');
 if(fingerprint(current)!==prepared.beforeFingerprint)throw Error('Root changed after preview — refresh and preview again');
}
function apply(R,current,adapters,prepared){
 assertFresh(current,prepared);
 const result=prepare(R,current,adapters,prepared.selection);
 if(result.afterFingerprint!==prepared.afterFingerprint)throw Error('Preview changed — no writes allowed');
 return result;
}
function receipt(result){return {schema:'tabor.sovereign-nexus.local-receipt.v1',selection:[...result.selection],addedNodes:result.addedNodes,addedLinks:result.addedLinks,beforeFingerprint:result.beforeFingerprint,afterFingerprint:result.afterFingerprint,notice:'Local comparison checksum, NOT identity, proof of legal permission, or security authentication.'}}
function verifyRollback(current,backup,receiptData){
 if(!backup||!receiptData||receiptData.schema!=='tabor.sovereign-nexus.local-receipt.v1')throw Error('No valid local restoration receipt');
 if(fingerprint(current)!==receiptData.afterFingerprint)throw Error('Root changed since last graft — automatic rollback refused; export and reconcile manually');
 if(fingerprint(backup)!==receiptData.beforeFingerprint)throw Error('Backup checksum mismatch');
 return copy(backup);
}
return Object.freeze({VERSION,KEY,BACKUP_KEY,PACKS,MODULES,ARSENAL_NODES,COMPARISONS,fingerprint,precheck,prepare,assertFresh,apply,receipt,verifyRollback,arsenalInstall});
});
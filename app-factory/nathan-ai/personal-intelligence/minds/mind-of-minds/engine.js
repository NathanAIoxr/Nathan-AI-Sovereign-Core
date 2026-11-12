/* Nathan AI Personal Intelligence — Additive Mind Registry Engine v1.0
   Catalog, task plans, address resolver; no language model invocation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanMindRegistry=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const OMNI_CAPACITY=126000000000n;
const NODE_CAPACITY=732000000n;
const LABELS=Object.freeze({CERO:'0.0 / CERO: original or unreviewed',UNO:'1.0 / UNO: source-backed, reviewed',DOS:'2.0 / DOS: derived connection or interpretation'});
const TYPES=Object.freeze(['creator-system','renaissance','turtle-agent','pantheon-identity','historical-textual-lens','literary-form','folklore-lens','workshop-agent','mind-mode']);
const clean=(v,n=1000)=>String(v==null?'':v).replace(/\u0000/g,'').slice(0,n);
function validDefinition(x){if(!x||typeof x!=='object')throw new TypeError('Mind definition required');
 if(!/^[a-z0-9][a-z0-9._-]{2,100}$/.test(x.id))throw new Error('Invalid mind ID');
 if(!TYPES.includes(x.type))throw new Error('Invalid mind category');
 if(!clean(x.name,140).trim())throw new Error('Name required');
 return Object.freeze({id:x.id,name:clean(x.name,140),type:x.type,group:clean(x.group||'',100),purpose:clean(x.purpose||'',1000),status:clean(x.status||'defined-prompt-template',100),sourceId:clean(x.sourceId||'',180),tags:Object.freeze((Array.isArray(x.tags)?x.tags:[]).slice(0,20).map(z=>clean(z,50))),baseIds:Object.freeze((Array.isArray(x.baseIds)?x.baseIds:[]).slice(0,30).map(z=>clean(z,100))),disclaimer:clean(x.disclaimer||'',500)}); }
function validateCatalog(items){if(!Array.isArray(items)||items.length>20000)throw new Error('Mind catalog must contain <= 20,000 definitions');const out=items.map(validDefinition),ids=new Set(out.map(x=>x.id));if(ids.size!==out.length)throw new Error('Duplicate mind IDs');return out;}
function omniAddress(v){if(typeof v==='number'&&(!Number.isSafeInteger(v)||v<0))throw new RangeError('Unsafe number');let n;try{n=BigInt(v);}catch(e){throw new RangeError('Invalid Omni address');}if(n<0n||n>=OMNI_CAPACITY)throw new RangeError('Omni address must be between 0 and 125999999999');return Object.freeze({address:n.toString(),padded:n.toString().padStart(12,'0'),conceptual:true,allocated:false,executing:false,rangeSize:OMNI_CAPACITY.toString()});}
function nodeAddress(v){let n;try{n=BigInt(v)}catch(e){throw new RangeError('Invalid Node address')}if(n<0n||n>=NODE_CAPACITY)throw new RangeError('Node address must be between 0 and 731999999');return Object.freeze({address:n.toString(),conceptual:true,allocated:false,executing:false,rangeSize:NODE_CAPACITY.toString()});}
function build(a,b){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!Number.isSafeInteger(a+b))throw new Error('Safe integers required');return a+b;}
function clear(a,b){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!Number.isSafeInteger(a-b))throw new Error('Safe integers required');return a-b;}
function intake(original,sourceId='owner:unassigned'){if(typeof original!=='string')throw TypeError('Original source must be text');return Object.freeze({schema:'nathan.personal-intelligence.intake.v1',sourceId:clean(sourceId,180),original,stage:'CERO',originalPreserved:true,reviewed:false,notes:[]});}
function review(source,annotations,proof=[],ownerConfirmed=false){if(!source||source.schema!=='nathan.personal-intelligence.intake.v1')throw new Error('Requires original intake');if(!Array.isArray(proof)||!proof.length)throw new Error('UNO requires at least one inspectable source reference');return Object.freeze({schema:'nathan.personal-intelligence.review.v1',sourceId:source.sourceId,original:source.original,stage:ownerConfirmed?'UNO':'UNO_PENDING',reviewed:ownerConfirmed===true,annotations:clean(annotations,4000),references:proof.map(x=>clean(x,300)).filter(Boolean)});}
function connect(source,relation,target,notes=''){if(!source||!['nathan.personal-intelligence.intake.v1','nathan.personal-intelligence.review.v1'].includes(source.schema))throw new Error('Requires intake or review');return Object.freeze({schema:'nathan.personal-intelligence.connection.v1',stage:'DOS',sourceId:source.sourceId,relation:clean(relation,120),target:clean(target,180),notes:clean(notes,2000),status:'interpretation-awaiting-review',doesNotModifyOriginal:true});}
function plan(query,selectedIds,catalog,stage='CERO'){
 if(!['CERO','UNO','DOS'].includes(stage))throw new Error('Unknown stage');
 const defs=validateCatalog(catalog),lookup=new Map(defs.map(d=>[d.id,d]));
 const ids=[...new Set(selectedIds||[])];if(ids.length===0)throw new Error('Choose at least one mind definition');if(ids.length>24)throw new Error('At most 24 selected mind templates per plan');
 return Object.freeze({schema:'nathan.personal-intelligence.mind-plan.v1',query:clean(query,3000),stage,approval:'owner-required',execution:'not-connected',originals:'immutable',steps:ids.map((id,i)=>{const m=lookup.get(id);if(!m)throw new Error('Unknown mind '+id);return {order:i+1,id:m.id,name:m.name,role:m.purpose,sourceId:m.sourceId,task:'Examine the selected owner-approved sources from the '+m.name+' perspective. Cite exact source IDs; separate original evidence from interpretation. Do not impersonate or claim to be the actual person or a supernatural entity.',status:'prompt-only; not executed'};})});
}
function search(definitions,query,group='all'){const q=clean(query,200).toLocaleLowerCase().trim();return definitions.filter(x=>(group==='all'||x.type===group)&&(!q||[x.name,x.id,x.group,x.purpose,x.tags.join(' '),x.sourceId].join(' ').toLocaleLowerCase().includes(q)));}
return Object.freeze({OMNI_CAPACITY:OMNI_CAPACITY.toString(),NODE_CAPACITY:NODE_CAPACITY.toString(),LABELS,TYPES,validDefinition,validateCatalog,omniAddress,nodeAddress,build,clear,intake,review,connect,plan,search});
});

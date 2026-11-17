import {canonical, digest, fields, id, integer, requireThat, unb64, verifyEd} from './core.mjs';

export const CORE_MODES=Object.freeze(['zero-cloud','zorro-cloud']);
export const CORE_ACTION='personal-core:run';
const proofDomain='nathan-ai.personal-core.grant.v1';
const purpose='plan';
const factsAllowed=new Set(['verified','contradicted','unknown']);
const success=['healthy','verified'];
const scopesByRole={
 'ant-catalog-courier':['manifest','checkpoint','refresh or restore the public catalog'],
 'bee-source-verifier':['catalog hash','source artifact','verify the source and compare hashes'],
 'bee-grapple-observer':['release receipt','Grapple It','inspect the release health contract'],
 'bee-hook-observer':['release receipt','Hook & Ring','inspect the tournament and release contracts'],
 'ant-adoption-scout':['adoption manifest','catalog identities','reconcile registration and adoption evidence'],
 'ant-projection-medic':['derived projection','authoritative revision','recompute the derived D1 projection'],
 'ant-outbox-carrier':['delivery receipt','idempotency key','reconcile durable deliveries'],
 'ant-fleet-sentinel':['fleet status','deployment identities','reconcile the catalog against deployed Workers'],
 'ant-receipt-auditor':['job receipt','route and timestamp','review failed or exhausted job receipts'],
};

const existingSources=[
 ['sovereign-boxes','app-factory/sovereign-boxes/engine.js',['addressable units','relationship'],['separate identities'],['box and revoke'],['source preserved']],
 ['tabor-light','app-factory/sovereign-boxes/tabor-light/guardian.js',['scale','node and non-node'],['bounded claims','separate identities'],['validate references'],['evidence first']],
 ['guardian','app-factory/nathan-ai/atomic-equator-forever-guardian/', ['owner control'],['local guard'],['enforce controls'],['explicit boundary','evidence first']],
 ['one-hub','app-factory/sovereign-hub/cloudflare/worker.mjs',['scoped identity','durable state'],['signed requests'],['authorize and audit','inspect evidence'],['revocable']],
 ['one-hive','hive/hive.js',['bee','ant'],['specialized roles'],['dispatch jobs'],['auditable']],
 ['tabor-world','app-factory/tabor-universal-library-engine/public/world/world-core.mjs',['project descriptors','deployment identities'],['source metadata'],['connect by shared fields'],['provenance']],
 ['voice-box','app-factory/nathan-ai/voice-box/',['local inference'],['on-device'],['preserve source inputs'],['local']],
 ['silicon-to-source','app-factory/nathan-ai/silicon-to-source/',['hardware claims'],['source evidence'],['compare claims'],['provenance']],
];
const descriptor=(id,source,attributes,characteristics,functionalities,traits)=>
 ({id,source,attributes,characteristics,functionalities,traits});
export function coreRegistry(bots){
 const sources=existingSources.map(row=>descriptor(...row));
 const agents=bots.map(bot=>{
  const [evidence,resource,operation]=scopesByRole[bot.id];
  return {...descriptor(bot.id,'app-factory/sovereign-hub/cloudflare/swarm.mjs',
   [bot.family,evidence,resource],['bounded planning','separate identities'],['inspect evidence',operation],['evidence first','auditable']),
   operator:bot.id,scope:bot.scope,evidence,resource,operation};
 });
 const links=agents.flatMap(agent=>sources.flatMap(source=>{
  const shared=Object.fromEntries(['attributes','characteristics','functionalities','traits'].map(field=>
   [field,agent[field].filter(value=>source[field].includes(value))]).filter(([,values])=>values.length));
  return Object.keys(shared).length?[{from:agent.id,to:source.id,shared,authority:false}]:[];
 }));
 return {agents,sources,links};
}

export function boxValue(root,value,{maxBoxes=4096,maxDepth=32}={}){
 id(root);
 integer(maxBoxes,1,4096);
 integer(maxDepth,0,32);
 const boxes=[];
 function visit(current,path,parent,depth){
  requireThat(boxes.length<maxBoxes&&depth<=maxDepth,'Box limits exceeded');
  const type=current===null?'nothing':Array.isArray(current)?'array':typeof current==='object'?'object':typeof current;
  requireThat(['nothing','array','object','string','number','boolean'].includes(type),'Value is outside the box schema');
  if(type==='number')requireThat(Number.isFinite(current),'Non-finite numeric box');
  if(type==='object')requireThat(Object.getPrototypeOf(current)===Object.prototype,'Plain JSON object required');
  const address=root+'#'+path.map(key=>'/'+String(key).replaceAll('~','~0').replaceAll('/','~1')).join('');
  const parentAddress=parent===null?null:parent;
  const compound=type==='array'||type==='object';
  boxes.push({address,parent:parentAddress,type,...(compound?{}:{value:current})});
  if(compound)for(const key of Object.keys(current).sort())visit(current[key],[...path,key],address,depth+1);
 }
 visit(value,[],null,0);
 return boxes;
}

export function pixelBox(root, width, height, x, y, channel=null){
 id(root);
 integer(width,1,1_000_000);integer(height,1,1_000_000);
 integer(x,0,width-1);integer(y,0,height-1);
 requireThat(channel===null||['r','g','b','a'].includes(channel),'Invalid pixel channel');
 const address=root+'#/pixel/'+x+'/'+y;
 return channel===null?{address,type:'pixel',width,height,x,y}:
  {address:address+'/'+channel,parent:address,type:'pixel-channel',channel};
}

export function evidenceState(states){
 requireThat(Array.isArray(states)&&states.every(state=>factsAllowed.has(state)),'Invalid evidence state');
 if(states.includes('contradicted'))return 'contradicted';
 return states.includes('verified')?'verified':'unknown';
}

// Search backward through declared, owned system contracts. Choose only paths
// whose root assertions have evidence, or return exactly which proofs are missing.
export function reversePlan(goal,rules,facts){
 id(goal);
 requireThat(Array.isArray(rules)&&rules.length<=64&&Array.isArray(facts)&&facts.length<=256,'Planner input exceeds limits');
 const producers=new Map(),steps=new Set(),byFact=new Map();
 for(const fact of facts){
  fields(fact,['id','state','source']);id(fact.id);
  requireThat(factsAllowed.has(fact.state)&&typeof fact.source==='string'&&fact.source.length>0&&fact.source.length<=240,'Invalid fact');
  const same=byFact.get(fact.id)??[];same.push(fact.state);byFact.set(fact.id,same);
 }
 for(const rule of rules){
  fields(rule,['id','produces','requires']);id(rule.id);id(rule.produces);
  requireThat(!steps.has(rule.id)&&Array.isArray(rule.requires)&&rule.requires.length<=12,'Invalid rule');
  steps.add(rule.id);rule.requires.forEach(id);
  const same=producers.get(rule.produces)??[];same.push(rule);producers.set(rule.produces,same);
 }
 let explored=0;
 const plan=(target,trail)=>{
  requireThat(++explored<=4096&&trail.size<=32,'Planner exploration limit reached');
  const verdict=evidenceState(byFact.get(target)??[]);
  if(verdict==='contradicted'||trail.has(target))return {steps:[],missing:[],blocked:[target]};
  if(verdict==='verified')return {steps:[],missing:[],blocked:[]};
  const candidates=producers.get(target)??[];
  if(!candidates.length)return {steps:[],missing:[target],blocked:[]};
  const next=new Set([...trail,target]);
  const options=candidates.map(rule=>{
   const prerequisites=rule.requires.map(req=>plan(req,next));
   const missing=[...new Set(prerequisites.flatMap(item=>item.missing))];
   const blocked=[...new Set(prerequisites.flatMap(item=>item.blocked))];
   return {steps:[...new Set([...prerequisites.flatMap(item=>item.steps),rule.id])],missing,blocked};
  });
  return options.sort((a,b)=>a.blocked.length-b.blocked.length||a.missing.length-b.missing.length||a.steps.length-b.steps.length)[0];
 };
 const output=plan(goal,new Set());
 const status=output.blocked.length?'contradicted':output.missing.length?'unknown':'verified';
 return {goal,...output,evidence:status,decision:status==='verified'?'allow':'hold'};
}

export const defaultGuards=()=>({generation:0,paused:false,roles:{}});
export function guardUpdate(current,role,paused,agents){
 requireThat(role==='*'||agents.some(agent=>agent.id===role),'Unknown agent role');
 requireThat(typeof paused==='boolean','Explicit pause required');
 return role==='*'?{...current,generation:current.generation+1,paused}:
  {...current,generation:current.generation+1,roles:{...current.roles,[role]:paused}};
}
export function allowAgent(guards,role){
 requireThat(!guards.paused&&!guards.roles[role],'Agent paused by kill switch',423);
}
export function profile(mode){
 requireThat(CORE_MODES.includes(mode),'Unknown core mode');
 return {mode,network:mode==='zero-cloud'?'none':'existing owner Worker bindings',authority:'scoped planning and evidence receipts'};
}

export function planRole(agent,goal,observation){
 requireThat(['assess','recover'].includes(goal),'Unknown agent goal');
 if(goal==='assess'){
  if(observation.state==='verified')return {next:'record-verification',decision:'allow',evidence:'verified',steps:['compare the observed receipt','record evidence']};
  return {next:observation.state==='contradicted'?'record-incident':'request-evidence',decision:'hold',evidence:observation.state,steps:['obtain a current '+agent.evidence]};
 }
 if(observation.state==='verified')return {next:'no-repair-needed',decision:'allow',evidence:'verified',steps:['retain the healthy receipt']};
 if(observation.state==='contradicted'){
  const plan=reversePlan('recovery-proposal',[
   {id:'recheck-evidence',produces:'fresh-evidence',requires:['observed-incident']},
   {id:'draft-recovery',produces:'recovery-proposal',requires:['fresh-evidence']},
  ],[{id:'observed-incident',state:'verified',source:observation.source}]);
  return {...plan,decision:'hold',next:'propose-recovery',steps:[...plan.steps,agent.operation]};
 }
 return {next:'request-evidence',decision:'hold',evidence:'unknown',steps:['obtain a current '+agent.evidence]};
}
export function observationFromJob(row,role,verifiedHash,now=Date.now()){
 if(!row?.result||!verifiedHash||!Number.isSafeInteger(row.finished)||row.finished>now||now-row.finished>45*60_000){
  return {state:'unknown',source:'hub:'+role,reason:'missing, stale, or unverified bot receipt'};
 }
 let result;
 try{result=JSON.parse(row.result);}catch{return {state:'unknown',source:'hub:'+role,reason:'invalid bot receipt'};}
 if(result.deferred||result.mode==='disabled'||result.available===false||
  (role==='ant-fleet-sentinel'&&!result.checked))return {state:'unknown',source:'hub:'+role,receipt:row.cycle,sha256:row.hash};
 const state=row.state==='failed'||result.healthy===false||result.exhausted>0?'contradicted':
  row.state==='completed'&&(result.healthy===true||success.includes(result.state)||
  ['ant-adoption-scout','bee-source-verifier','ant-outbox-carrier','ant-receipt-auditor'].includes(role))?'verified':'unknown';
 return {state,source:'hub:'+role,receipt:row.cycle,sha256:row.hash,observed_at:row.finished};
}

export const grantMessage=grant=>canonical([proofDomain,grant]);
export const subjectMessage=(grant,requestHash)=>canonical([proofDomain,'invocation',grant.id,requestHash]);
export async function verifyPortableGrant(envelope,{audience,role,issuerTrusted,requestHash,subject,now=Math.floor(Date.now()/1000)}){
 const {grant,signature,proof}=fields(envelope,['grant','signature','proof']);
 fields(grant,['id','issuer','subject','audience','role','purpose','issued','expires']);
 id(grant.id);id(grant.role);
 requireThat(unb64(grant.issuer).length===32&&unb64(grant.subject).length===32,'Ed25519 identity required',403);
 integer(grant.issued,0);integer(grant.expires,grant.issued+1,grant.issued+3600);
 requireThat(grant.audience===audience&&grant.role===role&&grant.purpose===purpose&&
  (!subject||grant.subject===subject)&&grant.issued<=now&&now<grant.expires,'Grant scope or expiry rejected',403);
 requireThat(issuerTrusted(grant.issuer)&&await verifyEd(grant.issuer,signature,grantMessage(grant)),'Untrusted issuer or grant signature',403);
 requireThat(typeof requestHash==='string'&&/^[a-f0-9]{64}$/.test(requestHash)&&
  await verifyEd(grant.subject,proof,subjectMessage(grant,requestHash)),'Invalid invocation proof',403);
 return {grant:grant.id,identity:await digest(unb64(grant.subject)),audience,role};
}

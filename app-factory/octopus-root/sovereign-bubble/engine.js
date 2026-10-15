/* NATHAN AI — SOVEREIGN BUBBLE / STRING LEDGER
 * 1 + 1 = 2 independent sovereign boxes; 1 - 1 = 0 active permission strings.
 * Distinct from physical string theory. Local pure model, NOT authentication.
 */
(function(host,make){'use strict';const api=make();if(typeof module==='object'&&module.exports)module.exports=api;else host.SovereignBubble=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='tabor.sovereign-bubble.v1';
const SCOPES=Object.freeze(['visit','message','collaborate','view-project','assist']);
const ROOT_NODES=Object.freeze([
 ['bubble:root','THE SOVEREIGN BUBBLE','project','Each participant or project retains its own protected boundary'],
 ['bubble:one-plus-one','ONE PLUS ONE EQUALS TWO','formula','A+B remains A and B: relationship never merges identities'],
 ['bubble:one-minus-one','ONE MINUS ONE EQUALS ZERO','formula','Revoke one active string and zero access remains along it'],
 ['bubble:sovereignty','MY BUBBLE — MY BOUNDARY','symbol','Default deny; nobody obtains implicit access'],
 ['bubble:invitation','THE INVITATION STRING','symbol','Only a box owner may invite an entrant'],
 ['bubble:acceptance','THE YES IS YES GATE','symbol','Guest must affirm invitation before any contact'],
 ['bubble:rejection','THE NO IS NO GATE','symbol','Rejection means no string, no access'],
 ['bubble:revocation','THE UNHOOKED STRING','symbol','Either side may sever the active string immediately'],
 ['bubble:direction','THE ONE-WAY DOOR','symbol','Guest-to-host permission never grants the reverse direction'],
 ['bubble:scope','THE NO-GREED RULE','symbol','Permission exists only for its explicitly selected purpose'],
 ['bubble:strings','THE STRING BRIDGE','symbol','Original relationship-graph metaphor, not fundamental-particle physics'],
 ['bubble:watch','THE PERMISSION SENTINEL','symbol','Check actual grants, not symbolic Root links, before any entry'],
 ['bubble:samaritan','THE GOOD SAMARITAN GATE','project','Offer care without judging deservingness; honor safety and medical consent'],
 ['bubble:danger','THE LIFE-IN-DANGER SIGNAL','symbol','Check scene; call emergency services; do not delay for interrogation'],
 ['bubble:implied','THE URGENT MERCY RULE','symbol','Implied consent may apply when unconscious or unable to consent in emergency'],
 ['bubble:transport','THE HELP-GETS-HELP PATH','symbol','Summon responders; avoid unsafe movement or forced transport'],
 ['bubble:history','THE NO-LOSS LEDGER','symbol','Revoked and refused invitations remain auditable, without data leaks']
].map(([id,label,kind,note])=>Object.freeze({id,label,kind,note})));
const clone=v=>JSON.parse(JSON.stringify(v));
function validate(s){if(!s||s.schema!==SCHEMA||!Array.isArray(s.boxes)||!Array.isArray(s.invitations)||!Array.isArray(s.strings)||!Number.isSafeInteger(s.sequence))throw Error('Invalid sovereign ledger');return s}
function validId(id){return typeof id==='string'&&/^[a-z][a-z0-9._-]{1,55}$/.test(id)}
function create(){return {schema:SCHEMA,boxes:[],invitations:[],strings:[],sequence:0}}
function register(s,{id,title,kind='person'}={}){
 validate(s);if(!validId(id)||!['person','project','system'].includes(kind)||typeof title!=='string'||!title.trim()||title.length>80)throw Error('Invalid sovereign box');
 if(s.boxes.some(b=>b.id===id))throw Error('Duplicate sovereign box');
 const next=clone(s);next.boxes.push({id,title,kind,privateByDefault:true});return next
}
function assertBox(s,id){if(!s.boxes.some(b=>b.id===id))throw Error('Unknown sovereign box')}
function invite(s,{owner,guest,scopes}={}){
 validate(s);assertBox(s,owner);assertBox(s,guest);
 if(owner===guest)throw Error('A sovereign cannot invite itself');
 if(!Array.isArray(scopes)||!scopes.length||new Set(scopes).size!==scopes.length||scopes.some(x=>!SCOPES.includes(x)))throw Error('Explicit recognized scopes required');
 if(s.invitations.some(i=>i.owner===owner&&i.guest===guest&&i.status==='pending'))throw Error('A pending invitation already exists');
 const next=clone(s),id='invite-'+(++next.sequence);
 next.invitations.push({id,owner,guest,scopes:scopes.slice(),status:'pending'});
 return {state:next,id};
}
function decide(s,{id,guest,accept}={}){
 validate(s);const i=s.invitations.find(x=>x.id===id);if(!i||i.status!=='pending'||i.guest!==guest)throw Error('Only the invited guest may respond to a pending invitation');
 if(typeof accept!=='boolean')throw Error('Explicit yes or no required');
 const next=clone(s),record=next.invitations.find(x=>x.id===id);
 record.status=accept?'accepted':'declined';
 if(accept)next.strings.push({id:'string-'+id,from:guest,to:i.owner,scopes:i.scopes.slice(),active:true,invitationId:id});
 return next;
}
function revoke(s,{invitationId,actor}={}){
 validate(s);const i=s.invitations.find(x=>x.id===invitationId);
 if(!i||![i.owner,i.guest].includes(actor))throw Error('Only a party may withdraw its own relationship');
 const next=clone(s);const inv=next.invitations.find(x=>x.id===invitationId);
 if(inv.status==='revoked')return next;
 inv.status='revoked';for(const st of next.strings)if(st.invitationId===invitationId)st.active=false;
 return next;
}
function mayEnter(s,{actor,target,scope}={}){
 validate(s);if(!SCOPES.includes(scope))return {allowed:false,reason:'Scope not declared'};
 if(!s.boxes.some(x=>x.id===actor)||!s.boxes.some(x=>x.id===target))return {allowed:false,reason:'Unknown sovereign box'};
 if(actor===target)return {allowed:true,reason:'Owner stays inside own boundary'};
 const link=s.strings.find(t=>t.from===actor&&t.to===target&&t.active&&t.scopes.includes(scope)&&s.invitations.some(i=>i.id===t.invitationId&&i.status==='accepted'));
 return link?{allowed:true,reason:'Specific active invitation and acceptance'}:{allowed:false,reason:'No active mutual permission for this direction and scope'};
}
function arithmetic(){return Object.freeze({addition:1+1,subtraction:1-1,meaning:'Two separate sovereign entities; zero active authorization after a single permission string is removed'})}
function threads(s){validate(s);return {boxes:s.boxes.length,active:s.strings.filter(x=>x.active).length,withdrawn:s.strings.filter(x=>!x.active).length,pending:s.invitations.filter(x=>x.status==='pending').length}}
function helpGuide({sceneSafe=true,immediateDanger=false,injured=false,inDistress=false,responsive=true,hasConsent=false,refuses=false,suspectedSpineInjury=false}={}){
 for(const x of [sceneSafe,immediateDanger,injured,inDistress,responsive,hasConsent,refuses,suspectedSpineInjury])if(typeof x!=='boolean')throw Error('Use explicit booleans');
 const needs=immediateDanger||injured||inDistress||!responsive,emergency=immediateDanger||!responsive;
 const steps=[];
 if(!sceneSafe){steps.push('Stay out of the danger zone; call emergency services and follow dispatcher instructions.');return {status:'unsafe-scene',emergencyCall:true,physicalContact:false,steps};}
 if(!needs){steps.push('Respect the boundary. Offer ordinary assistance only if welcomed.');return {status:'no-visible-need',emergencyCall:false,physicalContact:false,steps};}
 steps.push('Approach safely without judging the person or asking whether they deserve care.');
 if(emergency)steps.push('Call 911 or your local emergency number immediately; request trained responders and follow dispatcher guidance.');
 if(refuses&&responsive){steps.push('Do not force care or transport on a person able to refuse; if danger persists, seek dispatcher or professional guidance.');return {status:'refused',emergencyCall:emergency,physicalContact:false,steps};}
 if(responsive&&!hasConsent){steps.push('Ask permission before touching or giving non-emergency care; offer to call and remain nearby.');return {status:'offer-help',emergencyCall:emergency,physicalContact:false,steps};}
 if(!responsive)steps.push('If the person cannot consent in an emergency, implied consent may apply; provide only aid within your training and dispatcher guidance.');
 else steps.push('Help within the permission actually given and your first-aid training.');
 if(suspectedSpineInjury)steps.push('Avoid moving them unless needed for immediate safety, CPR, or lifesaving care.');
 else steps.push('Do not move or transport someone unnecessarily; arrange professional evaluation or transport with consent.');
 steps.push('Stay with them when safe and hand over to appropriate help.');
 return {status:'help-with-care',emergencyCall:emergency,physicalContact:!responsive||hasConsent,steps};
}
function reverseEngineer(root){
 if(!root||!Array.isArray(root.nodes)||!Array.isArray(root.edges))throw Error('Root graph required');
 const families=['core:middle','field:sovereign','uct:continuum','continuum:root','bubble:root'];
 return {rootNodes:root.nodes.length,knowledgeStrings:root.edges.length,bubblePolicyNodes:root.nodes.filter(n=>n.id.startsWith('bubble:')).length,
   attachedFamilies:families.filter(id=>root.nodes.some(x=>x.id===id)),
   caution:'Legacy symbolic/formula/tentacle connections are KNOWLEDGE links, never consent grants.'};
}
function install(rootEngine,state){
 if(!rootEngine||!state||state.schema!==rootEngine.SCHEMA)throw Error('Valid Octopus Root engine/snapshot required');
 let next=state,added=0,linked=0;const conflicts=[];
 for(const n of ROOT_NODES){
  const old=next.nodes.find(x=>x.id===n.id);
  if(old){if(old.label!==n.label)conflicts.push(n.id);continue}
  const out=rootEngine.addNode(next,{id:n.id,label:n.label,kind:n.kind,origin:'Sovereign Bubble v1: '+n.note});
  if(out.ok){next=out.state;added++}else conflicts.push(n.id+': '+out.why);
 }
 const edges=[
  ['core:middle','bubble:root','Main Root ethics and permission rail'],
  ...ROOT_NODES.filter(n=>!['bubble:root','bubble:danger','bubble:implied','bubble:transport'].includes(n.id)).map(n=>['bubble:root',n.id,'Sovereign boundary policy: '+n.note]),
  ['bubble:samaritan','bubble:danger','Respond promptly to danger'],
  ['bubble:samaritan','bubble:implied','Only necessary aid with emergency implied consent'],
  ['bubble:samaritan','bubble:transport','Professional transport preferred'],
  ...['field:sovereign','uct:continuum','continuum:root'].map(id=>['bubble:root',id,'Cross-pack ethics annotation only; no access granted'])
 ];
 for(const [from,to,note] of edges){
  if(!next.nodes.some(n=>n.id===from)||!next.nodes.some(n=>n.id===to))continue;
  if(next.edges.some(e=>e.from===from&&e.to===to&&e.type==='symbolic'))continue;
  const r=rootEngine.attach(next,{from,to,type:'symbolic',note});
  if(r.ok){next=r.state;linked++}else conflicts.push(from+' → '+to+': '+r.why);
 }
 return {state:next,added,linked,conflicts};
}
return Object.freeze({SCHEMA,SCOPES,ROOT_NODES,create,register,invite,decide,revoke,mayEnter,arithmetic,threads,helpGuide,reverseEngineer,install});
});
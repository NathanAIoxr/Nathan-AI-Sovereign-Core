/* TABOR ROOT — shared DATA CONTRACTS ONLY. v1.
 * No user login, remote access, OAuth, financial transaction or store publishing occurs here.
 * Caller-supplied authentication booleans and grants are NOT proof of identity:
 * real APIs must construct trusted actor/grant context after authenticating.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaborRootContracts=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='tabor.root.v1';
const ID=/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*:[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const HEX=/^[a-fA-F0-9]{64}$/;
const STATUSES=new Set(['concept','prototype','tested','release-candidate','published','archived']);
const VISIBILITY=new Set(['private','public','restricted']);
const ACTIONS=new Set(['project.read','project.edit','asset.read','asset.link','asset.tag','research.review','build.preview']);
const FORBIDDEN_EXTERNAL=new Set(['payment.charge','payment.refund','publish.execute','store.submit','case.disclose','bank.transfer','delete.remote']);
const isString=s=>typeof s==='string'&&s.trim().length>0;
function validId(s){return typeof s==='string'&&ID.test(s)}
function checkProject(p){
 const errors=[];
 if(!p||typeof p!=='object'||Array.isArray(p))return ['Project must be an object'];
 if(p.schema!=='tabor.root.project.v1')errors.push('Unsupported project schema');
 if(!validId(p.id))errors.push('Project ID must include an explicit namespace');
 if(!isString(p.tenantId))errors.push('Tenant identity required');
 if(!isString(p.name))errors.push('Project name required');
 if(!STATUSES.has(p.status))errors.push('Unrecognized status');
 if(p.visibility&&!VISIBILITY.has(p.visibility))errors.push('Invalid visibility');
 if(p.originalId!==undefined&&!isString(p.originalId))errors.push('Original legacy ID must remain a string');
 return errors;
}
function checkAsset(a){
 const errors=[];
 if(!a||typeof a!=='object'||Array.isArray(a))return ['Asset must be an object'];
 if(a.schema!=='tabor.root.asset-ref.v1')errors.push('Unsupported asset reference schema');
 if(!validId(a.id))errors.push('Asset ID must be namespaced');
 if(!isString(a.tenantId))errors.push('Asset tenant ID required');
 if(!isString(a.sourceFilename))errors.push('Original filename required');
 if(!VISIBILITY.has(a.visibility))errors.push('Asset must have explicit visibility');
 if(a.sha256!==null && !(typeof a.sha256==='string'&&HEX.test(a.sha256)))errors.push('SHA-256 must be a 64-character hex digest or null');
 if(!isString(a.provenance))errors.push('Provenance required');
 return errors;
}
/* For use ONLY after trusted server middleware authenticated the actor and
 * retrieved grants from its OWN database. Client-supplied actor/grants are forgeable. */
function authorize(context){
 if(!context||!context.trustedServerContext)return {allowed:false,reason:'Trusted server context required'};
 const {actor,resource,action,grants=[],now=Date.now()}=context;
 if(!actor||actor.authenticated!==true||!isString(actor.id)||!isString(actor.tenantId))
  return {allowed:false,reason:'Authenticated server identity required'};
 if(!resource||!isString(resource.tenantId)||resource.tenantId!==actor.tenantId)
  return {allowed:false,reason:'Cross-tenant access denied'};
 if(!ACTIONS.has(action)||FORBIDDEN_EXTERNAL.has(action))
  return {allowed:false,reason:'External or unauthorized operation blocked'};
 const valid=Array.isArray(grants)&&grants.some(g=>
  g&&g.approved===true&&g.revoked!==true&&
  g.actorId===actor.id&&g.tenantId===actor.tenantId&&
  (g.resourceId===resource.id||g.resourceId==='*')&&
  Array.isArray(g.scopes)&&g.scopes.includes(action)&&
  Number.isFinite(g.expiresAt)&&g.expiresAt>now
 );
 return valid?{allowed:true,reason:'Authorized for the requested scoped operation'}:{allowed:false,reason:'No valid scoped grant'};
}
/* Generates REVIEW METADATA, never a publish/charge command. */
function releaseReview(project,assets,destination,approval){
 const problems=checkProject(project);
 if(!isString(destination))problems.push('Destination required');
 if(!Array.isArray(assets)||assets.length===0)problems.push('At least one asset reference required');
 else for(const [i,a] of assets.entries()){
  problems.push(...checkAsset(a).map(error=>'Asset '+i+': '+error));
  if(a.tenantId!==project?.tenantId)problems.push('Cross-tenant asset '+i);
  if(a.visibility!=='public')problems.push('Nonpublic asset '+i+' must not enter public release');
  if(!a.sha256)problems.push('Unverified asset digest '+i);
 }
 if(!approval||approval.ownerReviewed!==true||approval.rightsReviewed!==true||!isString(approval.reviewId))
  problems.push('Human owner and rights review required');
 return {schema:'tabor.root.release-review.v1',destination,projectId:project?.id||null,
  status:problems.length?'blocked':'ready-for-provider-review',problems,
  warning:'No publication, payment, store approval or remote action occurred.'};
}
return Object.freeze({SCHEMA,checkProject,checkAsset,validId,authorize,releaseReview});
});
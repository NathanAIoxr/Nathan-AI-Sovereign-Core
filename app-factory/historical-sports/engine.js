/* NATHAN AI historical sports 111-year archival gate.
 * Historical eligibility is not trademark clearance. Never silently delete records.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HistoricalSports111=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RULE_YEAR=2026,MIN_AGE_YEARS=111,CUTOFF=RULE_YEAR-MIN_AGE_YEARS;
const PROVENANCE=Object.freeze(['VERIFIED HISTORICAL','HISTORICAL — GAPS','GENERATED FILL-IN','FICTIONAL']);
const RIGHTS=Object.freeze(['needs-review','review-in-progress','licensed','counsel-cleared']);
const RECORD_KINDS=Object.freeze(['historical','simulation','fictional']);
const sourceOK=v=>typeof v==='string'&&/^https:\/\/[^ /]+\.[^ /]+/i.test(v);
const yearOK=v=>Number.isInteger(v)&&v>=1800&&v<=3000;
const clean=v=>typeof v==='string'&&v.trim().length>0&&v.length<256;
function assess(record){
 const r=record||{},errors=[],warnings=[];
 if(!clean(r.id)||!clean(r.name))errors.push('Stable id and name required');
 if(!RECORD_KINDS.includes(r.record_kind))errors.push('Record kind required');
 if(!PROVENANCE.includes(r.provenance))errors.push('Explicit provenance label required');
 if(!RIGHTS.includes(r.rights_status))errors.push('Explicit rights-review status required');
 if(r.founding_year!==null&&r.founding_year!==undefined&&!yearOK(r.founding_year))errors.push('Founding year invalid');
 if(r.simulation_year!==null&&r.simulation_year!==undefined&&!yearOK(r.simulation_year))errors.push('Simulation year invalid');
 if(r.record_kind==='historical'&&!['VERIFIED HISTORICAL','HISTORICAL — GAPS'].includes(r.provenance))errors.push('Historical records require historical provenance');
 if(r.record_kind==='simulation'&&r.provenance!=='GENERATED FILL-IN')errors.push('Simulated records must say GENERATED FILL-IN');
 if(r.record_kind==='fictional'&&r.provenance!=='FICTIONAL')errors.push('Fictional records must say FICTIONAL');
 if(r.record_kind!=='historical'&&r.founding_year!=null)errors.push('Never assign fictional history a real founding_year');
 if(r.provenance==='VERIFIED HISTORICAL'&&(!yearOK(r.founding_year)||!Array.isArray(r.sources)||!r.sources.some(sourceOK)))errors.push('Verified historical status requires a year and a citation URL');
 if(r.record_kind==='simulation'&&(!yearOK(r.simulation_year)||!clean(r.legacy_anchor_id)))errors.push('Simulation needs its own era and a source-era anchor');
 if(r.provenance==='HISTORICAL — GAPS')warnings.push('Unresolved historical details must remain unknown, not automatically filled');
 const historicalYearEligible=r.record_kind==='historical'&&yearOK(r.founding_year)&&r.founding_year<=CUTOFF;
 const historicalReferenceEligible=historicalYearEligible&&r.provenance==='VERIFIED HISTORICAL'&&errors.length===0;
 if(r.record_kind==='historical'&&!historicalYearEligible)warnings.push('Outside the fixed 1915 historical reference gate or founding year unknown');
 if(r.record_kind==='historical'&&historicalYearEligible&&r.provenance!=='VERIFIED HISTORICAL')warnings.push('Date eligible, but documentary confirmation pending');
 if(r.record_kind==='simulation')warnings.push('Generated creative material; not an independently established historical franchise');
 const documentsAvailable=Array.isArray(r.rights_documents)&&r.rights_documents.some(sourceOK);
 const counselApproved=r.rights_status==='counsel-cleared'&&documentsAvailable&&clean(r.counsel_review_id);
 const licensed=r.rights_status==='licensed'&&documentsAvailable&&clean(r.license_reference);
 const paperworkGate=(counselApproved||licensed)&&errors.length===0;
 if(!paperworkGate)warnings.push('Commercial branding rights not cleared by this automated gate');
 if(paperworkGate)warnings.push('Paperwork supplied; legal sufficiency and scope require human verification');
 return {
  id:r.id||null,provenance:r.provenance||'UNLABELED',valid:errors.length===0,
  year_cutoff:CUTOFF,historical_year_eligible:historicalYearEligible,
  historical_reference_eligible:historicalReferenceEligible,
  rights_review_gate:paperworkGate?'documentation-present':'blocked-for-review',
  commercial_immunity:false,errors,warnings
 };
}
function filterFor1915(records){
 if(!Array.isArray(records))throw TypeError('Records must be an array');
 const output={eligible:[],hold:[],generated:[],fictional:[],assessments:[]};
 for(const record of records){
  const a=assess(record);output.assessments.push(a);
  if(record?.record_kind==='simulation')output.generated.push(record);
  else if(record?.record_kind==='fictional')output.fictional.push(record);
  else if(a.historical_reference_eligible)output.eligible.push(record);
  else output.hold.push(record);
 }
 return output;
}
function makeExpansion({id,name,simulation_year,legacy_anchor_id,note=''}) {
 const record={id,name,record_kind:'simulation',provenance:'GENERATED FILL-IN',founding_year:null,simulation_year,
 legacy_anchor_id,note,rights_status:'needs-review',sources:[],rights_documents:[]};
 const a=assess(record);
 if(!a.valid)throw Error(a.errors.join('; '));
 return record;
}
function historySummary(records){
 const result=filterFor1915(records);
 return {cutoff:CUTOFF,historicalVerified:result.eligible.length,needsResearch:result.hold.length,
 generatedFillIn:result.generated.length,fictional:result.fictional.length};
}
return Object.freeze({RULE_YEAR,MIN_AGE_YEARS,CUTOFF,PROVENANCE,RIGHTS,RECORD_KINDS,assess,filterFor1915,makeExpansion,historySummary});
});
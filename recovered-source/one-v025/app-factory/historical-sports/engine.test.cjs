'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('./engine.js'),records=require('./examples.json');
test('2026 fixed 111 year gate is 1915',()=>{
 assert.equal(E.CUTOFF,1915);
 assert.equal(E.RULE_YEAR-E.MIN_AGE_YEARS,E.CUTOFF);
});
test('historically documented 1871 and 1914 examples eligible but not automatically cleared',()=>{
 for(const x of records.slice(0,2)){
  const r=E.assess(x);assert.equal(r.valid,true);assert.equal(r.historical_reference_eligible,true);
  assert.equal(r.rights_review_gate,'blocked-for-review');assert.equal(r.commercial_immunity,false);
 }
});
test('1915 qualifies; 1916 and unknown are on hold, no deletion',()=>{
 const historical=year=>({id:'year:'+year,name:'Test',record_kind:'historical',provenance:'VERIFIED HISTORICAL',founding_year:year,rights_status:'needs-review',sources:['https://example.org/data']});
 const y1915=E.assess(historical(1915));assert.equal(y1915.historical_reference_eligible,true);
 const y1916=E.assess(historical(1916));assert.equal(y1916.historical_reference_eligible,false);
 const group=E.filterFor1915([historical(1915),historical(1916),records[2]]);
 assert.equal(group.eligible.length,1);assert.equal(group.hold.length,2);
 assert.equal(group.assessments.length,3);
});
test('generated filler never impersonates historical date',()=>{
 const simulated=E.makeExpansion({id:'sim:42',name:'Original Comets',simulation_year:1930,legacy_anchor_id:'historical:boston-1871'});
 assert.equal(simulated.provenance,'GENERATED FILL-IN');
 assert.equal(simulated.founding_year,null);
 assert.equal(E.assess(simulated).historical_reference_eligible,false);
 assert.throws(()=>E.makeExpansion({id:'sim:missing',name:'No Anchor',simulation_year:1930,legacy_anchor_id:''}));
});
test('documentary status cannot be inferred without a source',()=>{
 const bad={id:'h:no-source',name:'Placeholder',record_kind:'historical',provenance:'VERIFIED HISTORICAL',founding_year:1900,rights_status:'needs-review',sources:[]};
 assert.equal(E.assess(bad).valid,false);
 assert.equal(E.assess({...bad,provenance:'HISTORICAL — GAPS'}).historical_reference_eligible,false);
});
test('paperwork gate does not claim legal immunity and requires human identifiers',()=>{
 const sample=records[0];
 assert.equal(E.assess({...sample,rights_status:'licensed'}).rights_review_gate,'blocked-for-review');
 const documented={...sample,rights_status:'licensed',rights_documents:['https://example.org/license'],license_reference:'LIC-001'};
 const result=E.assess(documented);
 assert.equal(result.rights_review_gate,'documentation-present');
 assert.equal(result.commercial_immunity,false);
});
test('all examples explicitly disclose verified, incomplete or generated material',()=>{
 const report=E.historySummary(records);
 assert.deepEqual([report.historicalVerified,report.needsResearch,report.generatedFillIn,report.fictional],[2,1,1,0]);
 assert.ok(records.every(r=>E.assess(r).valid));
});
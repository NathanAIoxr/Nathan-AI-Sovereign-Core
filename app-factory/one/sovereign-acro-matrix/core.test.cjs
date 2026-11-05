const test=require("node:test");
const assert=require("node:assert/strict");
const core=require("./core.js");
const registry=require("./registry.js");

test("66 additive nodes with all four categories",()=>{
 assert.equal(registry.length,66);
 const counts=registry.reduce((a,r)=>(a[r.group]=(a[r.group]||0)+1,a),{});
 assert.deepEqual(counts,{external:19,nathan:15,humanity:15,mythology:17});
});
test("colliding acronyms are never silently replaced",()=>{
 assert.equal(core.search(registry,{query:"SI",group:"external"}).filter(x=>x.code==="SI").length,2);
 assert.equal(registry.filter(x=>x.code==="UI").length,2);
 assert.equal(registry.filter(x=>x.code==="II").length,2);
});
test("owner's blueprint labels remain discoverable",()=>{
 for(const label of ["DATA ATAD","ABM","MIDA","REALITIST","ICU BUDDY","CT INC.","KK / καινὴ κτίσις","ASR","JAS","SLUT","4T CLUB","CPT","SSS","SOVEREIGN USER"]){
  assert.ok(registry.some(x=>x.code===label),label);
 }
});
test("reversal preserves Unicode grapheme order and round-trip",()=>{
 const result=core.analyzeDualAxis("DATA 🌀 e\u0301");
 assert.equal(result.backward,"e\u0301 🌀 ATAD");
 assert.equal(result.roundTripMatches,true);
 assert.equal(result.symmetric,false);
 assert.match(result.notice,/do not verify/);
});
test("palindrome is not falsely called a fact",()=>{
 const r=core.analyzeDualAxis("level");assert.equal(r.symmetric,true);assert.match(r.notice,/truth/);
});
test("MIDA requires provenance, never auto-verifies",()=>{
 const empty=core.reviewClaim({claim:"A statement"});
 assert.equal(empty.sourceStatus,"sources-needed");assert.equal(empty.automaticallyVerified,false);
 const source=core.reviewClaim({claim:"A statement",sources:["document-1"],review:"supported"});
 assert.equal(source.sourceStatus,"sources-attached");assert.equal(source.automaticallyVerified,false);
 assert.equal(core.gateReview({claim:"A statement",review:"supported",sources:["document-1"]}).gate,1);
 assert.equal(core.gateReview({claim:"A statement",review:"supported",sources:[]}).gate,0);
 assert.equal(core.gateReview({claim:"A statement",review:"unreviewed",sources:["document-1"]}).gate,0);
});
test("ASR whitespace preview declares loss and preserves original",()=>{
 const r=core.asrPreview("a \n  b");
 assert.equal(r.original,"a \n  b");assert.equal(r.reduced,"a b");assert.equal(r.lossy,true);
 assert.ok(r.reducedBytes<r.originalBytes);
});
test("permission grants expire and revoke without external authorization",()=>{
 const g=core.newGrant("records:review","Local note","2026-12-01T00:00:00.000Z","2026-11-05T00:00:00.000Z");
 assert.equal(core.hasGrant([g],"records:review","2026-11-06T00:00:00.000Z"),true);
 assert.equal(core.hasGrant([g],"records:review","2026-12-02T00:00:00.000Z"),false);
 assert.equal(core.hasGrant([core.revokeGrant(g,"2026-11-06T00:00:00.000Z")],"records:review","2026-11-07T00:00:00.000Z"),false);
});
test("humanity is an observable checklist, not proof of feeling",()=>{
 const good=core.humanityCheck({acknowledgedNeed:true,respectsAutonomy:true,constructiveAction:true,disclosesUncertainty:true,protectsPrivacy:true});
 assert.equal(good.passes,true);assert.match(good.notice,/cannot establish machine feelings/);
 assert.equal(core.humanityCheck({acknowledgedNeed:true}).passes,false);
});
test("invalid states and missing purposes are rejected",()=>{
 assert.throws(()=>core.reviewClaim({claim:"",sources:[]}),/required/);
 assert.throws(()=>core.reviewClaim({claim:"A",review:"supertrue"}),/Unknown review/);
 assert.throws(()=>core.newGrant("records:review",""),/Purpose/);
});
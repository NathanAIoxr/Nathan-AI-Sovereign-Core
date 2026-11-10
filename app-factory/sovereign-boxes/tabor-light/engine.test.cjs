"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const T=require("./engine.js");
test("Earth-centered X and GNIS Owens Cross Roads anchor are preserved",()=>{
 assert.deepEqual({x:T.CORE.x,y:T.CORE.y,z:T.CORE.z},{x:0,y:0,z:0});
 assert.equal(T.OXR.latitudeDegrees,34.5881461);
 assert.equal(T.OXR.longitudeDegrees,-86.4588768);
 const b=T.beam();
 assert.ok(b.earthCenterToOXRmeters>6e6&&b.earthCenterToOXRmeters<6.5e6);
 assert.equal(b.referencePoint.name,"Owens Cross Roads, Alabama, USA");
});
test("OXR is exactly on the implemented mathematical straight axis; bounce retraces and reverses",()=>{
 const b=T.beam(),p=T.vector(b.earthCenterToOXRmeters);
 for(const k of ["x","y","z"])
   assert.ok(Math.abs(p[k]-b.referencePoint.ecefMeters[k])<1e-7);
 assert.equal(b.outbound[0].tMeters,0);
 assert.equal(b.outbound[1].tMeters,b.reflected[0].tMeters);
 assert.equal(b.reflected[1].tMeters,0);
 assert.equal(b.reflected[2].tMeters,-b.earthCenterToOXRmeters);
 const negative=T.vector(-b.earthCenterToOXRmeters);
 for(const k of ["x","y","z"])assert.ok(Math.abs(p[k]+negative[k])<1e-7);
 assert.equal(b.physicalBeamEmitted,false);
 assert.equal(b.coordinateFrame,"EARTH_FIXED_NOT_INERTIALLY_FIXED");
});
test("Earth equator, firmament and 46.5bn ly midpoint frames stay separate",()=>{
 const a=T.frame("EQUATOR"),b=T.frame("FIRMAMENT"),c=T.frame("OBSERVABLE_RADIUS");
 assert.equal(a.basis,"GEOMETRIC");assert.equal(b.basis,"SYMBOLIC_CREATOR_FRAME");
 assert.equal(c.signedDisplayExtentLightYears,46500000000);
 assert.equal(T.OBSERVABLE_RADIUS_LY,46500000000);
 assert.equal(a.geometryIsPhysical,true);assert.equal(b.geometryIsPhysical,false);
 assert.equal(c.geometryIsPhysical,false);
 assert.throws(()=>T.frame("ACTUAL_COSMIC_CENTER"));
});
test("all 732 million logical supernodes resolve independently, on demand",()=>{
 assert.equal(T.boxNode("1").nodeId,"NT-000000000001");
 assert.equal(T.boxNode("732000000").nodeId,"NT-000732000000");
 assert.notEqual(T.boxNode(1).namespace,T.boxNode(2).namespace);
 assert.equal(T.boxNode(1).materialized,false);
 assert.equal(T.boxNode(1).inheritedLayers,T.KINDS.length);
 for(const bad of ["0","732000001","-1","3.5","oops"])assert.throws(()=>T.boxNode(bad));
});
test("zero and non-nodes retain their own boxes without coercing node identities",()=>{
 const zero=T.boxNonNode("ZERO","0");
 const unknown=T.boxNonNode("UNKNOWN","not discovered");
 assert.equal(zero.originalLabel,"0");
 assert.equal(zero.coercedIntoSupernode,false);
 assert.equal(zero.zeroIsNotAutomaticallyAbsence,true);
 assert.notEqual(zero.boxId,unknown.boxId);
 assert.throws(()=>T.boxNonNode("EVIL_PERSON","x"));
});
test("proton, neuron, electron, below and above exist and preserve distinct evidence types",()=>{
 for(const k of ["PLANCK_LIMIT","QUARK","GLUON","ELECTRON","PROTON","NEURON","SYNAPSE","HUMAN","EARTH_CORE","GALAXY","OBSERVABLE_UNIVERSE","BEYOND_OBSERVABLE","FIRMAMENT","ELECTION"])
   assert.equal(T.layer(k).sovereign,true);
 assert.equal(T.layer("PROTON").evidence,"EMPIRICAL");
 assert.equal(T.layer("FIRMAMENT").evidence,"SYMBOLIC");
 assert.equal(T.layer("BEYOND_OBSERVABLE").evidence,"UNKNOWN");
 assert.equal(T.CANON.electronSourceTerm,"election");
});
test("registry reconciliation does not invent or publish missing private content",()=>{
 const original=JSON.parse(fs.readFileSync(path.join(__dirname,"..","registry.json"),"utf8"));
 const before=JSON.stringify(original),report=T.reconcile(original);
 assert.equal(report.actualPublicBoxes,original.records.length);
 assert.equal(report.countMatches,true);
 assert.equal(report.privateIdeaSlots,496);
 assert.equal(report.canTruthfullyRestoreOwnerOnlyContent,false);
 assert.equal(report.duplicateIds.length,0);
 assert.equal(JSON.stringify(original),before);
});
test("reconciliation finds genuine gaps, and never silently repairs source records",()=>{
 const testRegistry={counts:{totalIndexedBoxes:5},records:[{id:"TW-001",kind:"original-game-family"},{id:"TW-001",kind:"original-game-family"}]};
 const before=JSON.stringify(testRegistry),report=T.reconcile(testRegistry);
 assert.deepEqual(report.discrepancies,["DECLARED_COUNT_DIFFERS_FROM_RECORDS","DUPLICATE_BOX_IDS","PRIVATE_ID_SLOTS_INCOMPLETE","ORIGINAL_REFERENCE_IDS_MISSING"]);
 assert.equal(JSON.stringify(testRegistry),before);
});
test("core arithmetic and previous declared source systems remain preserved",()=>{
 assert.equal(1+1,2);assert.equal(1-1,0);
 assert.equal(T.CANON.exactTerm,"consciouness");
 assert.equal(T.fullMap().totalAddressableSupernodes,"732000000");
 assert.equal(T.fullMap().verifiedPhysicalNodes,0);
 assert.ok(T.SOURCE_LINKS.some(x=>x.includes("supernodes")));
 assert.ok(T.SOURCE_LINKS.some(x=>x.includes("mother-earth")));
});

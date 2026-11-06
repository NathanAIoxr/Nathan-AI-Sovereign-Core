"use strict";
const {test}=require("node:test");const a=require("node:assert/strict");
const fs=require("node:fs"),p=require("node:path");
const {compileManifests}=require("./build-manifests.cjs");
const load=name=>JSON.parse(fs.readFileSync(p.join(__dirname,name),"utf8"));
const policy=load("policy.json"),catalog=load("catalog.json"),sample=load("manifests.example.json");
test("five standalone apps route separately from the same immutable policy",()=>{
 const x=compileManifests(sample,policy,catalog);
 a.equal(x.applicationCount,5);
 a.deepEqual(x.plans.map(o=>o.configuration),["socialFlow","socialFlow","corePipeline","maxApex","socialFlow"]);
 a.ok(x.plans.every(o=>o.releaseStatus==="PREVIEW_ONLY"&&o.humanApprovalRequired));
});
test("manifest build deterministic and zero payment enablement",()=>{
 const x=compileManifests(sample,policy,catalog),y=compileManifests(sample,policy,catalog);
 a.deepEqual(x,y);
 a.ok(x.plans.flatMap(o=>o.offers).every(o=>!o.directPurchaseEnabled));
});
test("cannot silently overwrite app ID in batch",()=>{
 const x={schemaVersion:1,apps:[sample.apps[0],sample.apps[0]]};
 a.throws(()=>compileManifests(x,policy,catalog),/Duplicate app ID/);
});
test("malformed manifests fail before plan generation",()=>{
 a.throws(()=>compileManifests({apps:[]},policy,catalog));
 a.throws(()=>compileManifests({schemaVersion:1,apps:"not-an-array"},policy,catalog));
});

import test from "node:test";
import assert from "node:assert/strict";
import {hashAsset,validateAssetRecord,buildPrivateManifest,publicInventorySummary,CHARACTER_IDS} from "./intake.mjs";
const sample=()=>({id:"asset-buddy-original-01",character_id:"buddy",kind:"original_artwork",sha256:hashAsset(new TextEncoder().encode("synthetic fixture only")),bytes:22,media_type:"image/png",rights:"creator_original",source_class:"user_supplied",verification:"unverified",storage:{visibility:"private",vault_key:"vault:buddy/original-01"}});
test("character inventory is grounded in Persona Atlas, not DOG AI",()=>{assert.deepEqual(CHARACTER_IDS,["buddy","hunny","hidden-kingdom"]);assert.ok(!CHARACTER_IDS.includes("dog-ai"));});
test("private intake accepts structured, source-tagged metadata",()=>{const x=sample();assert.equal(validateAssetRecord(x).ok,true);const m=buildPrivateManifest([x]);assert.equal(m.asset_count,1);assert.equal(m.public_export,false);});
test("no public URL, unknown field, unsafe path, or unknown character",()=>{
 for(const change of [
  x=>x.storage.public_url="https://example.test/original.png",
  x=>x.storage.vault_key="../private",
  x=>x.storage.visibility="public",
  x=>x.character_id="dog-ai",
  x=>x.extra="secret",
  x=>x.rights="assumed_owner",
 ]){const x=sample();change(x);assert.equal(validateAssetRecord(x).ok,false);}
});
test("duplicate assets and oversized payload metadata rejected",()=>{
 const x=sample();assert.throws(()=>buildPrivateManifest([x,x]),/Duplicate/);
 x.bytes=Number.MAX_SAFE_INTEGER;assert.equal(validateAssetRecord(x).ok,false);
});
test("summary strips hash, storage locations, and original content",()=>{
 const x=sample();const summary=publicInventorySummary(buildPrivateManifest([x]));
 assert.equal(summary.counts.buddy,1);
 assert.equal(summary.counts.hunny,0);
 assert.ok(!JSON.stringify(summary).includes("vault:"));
 assert.ok(!JSON.stringify(summary).includes(x.sha256));
});
test("source class and verification cannot be silently promoted",()=>{
 const x=sample();x.source_class="assistant_inferred";assert.equal(validateAssetRecord(x).ok,false);
 x.source_class="user_supplied";x.verification="confirmed_without_review";assert.equal(validateAssetRecord(x).ok,false);
});
test("hashing is deterministic and accepts bytes only",()=>{
 const bytes=new TextEncoder().encode("fixture");
 assert.equal(hashAsset(bytes),hashAsset(bytes));
 assert.throws(()=>hashAsset("fixture"),/bytes/);
});

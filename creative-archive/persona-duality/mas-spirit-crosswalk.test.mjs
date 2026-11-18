import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(url)=>JSON.parse(readFileSync(new URL(url,import.meta.url),"utf8"));
const original=read("../nexus-mas-spirit/canon.json");
const crosswalk=read("./mas-spirit-crosswalk.json");
const atlasText=readFileSync(new URL("./registry.mjs",import.meta.url),"utf8");
test("PD-001 source canonical spelling and version are faithfully mirrored",()=>{
 assert.equal(crosswalk.source_of_truth.version,original.version);
 assert.equal(original.principles.latest_spelling,"SANTA SUPMALG, supersedes earlier SANTA SUPMALS");
 assert.equal(crosswalk.canonical_in_source.name,"SANTA SUPMALG");
 assert.equal(crosswalk.superseded_in_source.name,"SANTA SUPMALS");
 const byId=new Map(original.nodes.map(n=>[n.id,n]));
 assert.equal(byId.get(crosswalk.canonical_in_source.node_id).name,crosswalk.canonical_in_source.name);
 assert.equal(byId.get(crosswalk.superseded_in_source.node_id).name,crosswalk.superseded_in_source.name);
 assert.equal(byId.get("N026").authority,"user_authored");
 assert.equal(byId.get("N027").authority,"source_variant");
});
test("PD-001 preserves both forms and human review gate",()=>{
 assert.match(atlasText,/"id": "supmalg"/);
 assert.match(atlasText,/"id": "supmals"/);
 assert.equal(crosswalk.conflict.status,"unresolved_across_sources");
 assert.equal(crosswalk.source_of_truth.read_only,true);
 assert.match(crosswalk.conflict.decision_required,/Creator confirmation/);
});
test("PD-001 quartet, reversal and user wording remain source-bound",()=>{
 assert.equal(original.principles.meaning,crosswalk.quartet.meaning);
 assert.deepEqual(original.principles.reversals,crosswalk.quartet.reversals);
 for(const name of [...crosswalk.quartet.mas,...crosswalk.quartet.spirit]){
  assert.ok(original.nodes.some(n=>n.name===name && n.authority==="user_authored"));
 }
 assert.ok(original.principles.no_spying_expansion.includes(crosswalk.preserved_literal.no_sleep_watching));
});

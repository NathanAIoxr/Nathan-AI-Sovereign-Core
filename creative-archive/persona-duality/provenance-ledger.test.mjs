import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const ledger=JSON.parse(readFileSync(new URL("./provenance-ledger.json",import.meta.url),"utf8"));
test("provenance sources are unique, local and typed",()=>{
 const ids=new Set(ledger.sources.map(x=>x.id));
 assert.equal(ids.size,ledger.sources.length);
 for(const s of ledger.sources){assert.ok(s.path.startsWith("creative-archive/")||s.path.startsWith("app-factory/"));assert.ok(!s.path.includes(".."));assert.ok(s.source_type);}
 for(const r of ledger.records){assert.ok(r.source_ids.length);for(const id of r.source_ids)assert.ok(ids.has(id));}
});
test("no fabricated first-utterance dates or quotes",()=>{
 assert.equal(ledger.policy.unknown_origin_dates_remain_null,true);
 for(const r of ledger.records){assert.equal(r.original_author_date,null);assert.equal(r.quote,null);assert.ok(r.classification);}
 assert.ok(ledger.unresolved.some(x=>x.topic.includes("chronology")));
});
test("creator canon, scriptural text, and assistant comparisons remain separate",()=>{
 const find=(topic)=>ledger.records.find(x=>x.topic===topic);
 assert.equal(find("Isaiah 45:7").classification,"scriptural_anchor");
 assert.equal(find("Yin and Yang").classification,"assistant_comparative_interpretation");
 assert.equal(find("MAS SPIRIT").classification,"source_derived_creator_canon");
 assert.notEqual(find("Santa Claus").classification,"source_derived_creator_canon");
});
test("repository snapshot dates do not masquerade as creation dates",()=>{
 for(const s of ledger.sources)if(s.record_date)assert.match(s.date_kind,/record|version/);
 for(const r of ledger.records)assert.ok(r.original_author_date===null);
});

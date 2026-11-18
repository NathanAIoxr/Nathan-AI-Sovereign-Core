import {test} from "node:test";import assert from "node:assert/strict";import {reconcile} from "./reconcile.mjs";
test("separates script namespaces from logical fleet",()=>{const x=reconcile({ordinary:[{id:"a"}],dispatch:[{id:"a"}],fleet:[{id:"a"}]});assert.equal(x.counts.unique,3);assert.deepEqual(x.records.map(r=>r.kind),["ordinary_worker","dispatch_script","fleet_catalog"]);});
test("never infers health or deployment",()=>{const x=reconcile({dispatch:[{id:"shard",account_owned:true}]});assert.equal(x.records[0].health,"unverified");assert.equal(x.records[0].deployment_id,null);});
test("deduplicates within a namespace",()=>{const x=reconcile({ordinary:[{id:"a"},{id:"a"}]});assert.equal(x.counts.duplicates,1);assert.equal(x.counts.unique,1);});
test("rejects missing identities",()=>assert.throws(()=>reconcile({fleet:[{}]}),/missing identity/));
test("bounds inputs",()=>assert.throws(()=>reconcile({atlas:Array(5001).fill({id:"x"})}),/oversized/));

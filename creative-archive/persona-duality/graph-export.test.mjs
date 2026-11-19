import test from "node:test";
import assert from "node:assert/strict";
import {buildPublicGraphArchive,migratePublicGraphArchive} from "./graph-export.mjs";
import {NODES,EDGES,TASKS} from "./registry.mjs";
test("exports public graph with preserved IDs, relationships and spelling variants",()=>{
 const a=buildPublicGraphArchive();
 assert.equal(a.nodes.length,NODES.length);
 assert.equal(a.edges.length,EDGES.length);
 assert.ok(a.nodes.some(n=>n.name==="SANTA SUPMALG"));
 assert.ok(a.nodes.some(n=>n.name==="SANTA SUPMALS"));
 assert.equal(a.publication,"review_required_not_deployed");
 assert.equal(TASKS.length,14);
 assert.deepEqual(migratePublicGraphArchive(a),a);
});
test("rejects unknown schema versions rather than silently migrating",()=>{
 assert.throws(()=>migratePublicGraphArchive({...buildPublicGraphArchive(),schema_version:2}),/Unsupported/);
});
test("rejects private fields, unsupported kinds and orphaned edges",()=>{
 assert.throws(()=>buildPublicGraphArchive({nodes:[{...NODES[0],private_email:"no"}],edges:[]}),/Private/);
 assert.throws(()=>buildPublicGraphArchive({nodes:[{...NODES[0],kind:"private_asset"}],edges:[]}),/Invalid/);
 assert.throws(()=>buildPublicGraphArchive({nodes:NODES,edges:[...EDGES,{from:"missing",to:"nathan",assertion:"creative_crosslink"}]}),/Invalid edge/);
});
test("does not import or export schedule receipts or private source archives",()=>{
 const a=buildPublicGraphArchive();
 assert.ok(!("receipts" in a));
 assert.ok(!("tasks" in a));
 assert.ok(!("private_assets" in a));
});

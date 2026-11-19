import test from "node:test";
import assert from "node:assert/strict";
import {GROUPS,filterNodes,neighborhood,exportGraph} from "./model.mjs";
import {NODES,EDGES} from "../registry.mjs";
test("all original concepts remain visible without rewriting",()=>{
 assert.equal(filterNodes().length,NODES.length);
 assert.equal(filterNodes({query:"SANTA SUPMALG"}).some(n=>n.id==="supmalg"),true);
 assert.equal(filterNodes({query:"SANTA SUPMALS"}).some(n=>n.id==="supmals"),true);
 assert.notEqual(NODES.find(n=>n.id==="supmalg"),NODES.find(n=>n.id==="supmals"));
});
test("case-insensitive filter and categories are deterministic",()=>{
 assert.ok(GROUPS.includes("scriptural_anchor"));
 assert.equal(filterNodes({query:"bUdDy"}).some(n=>n.id==="buddy"),true);
 assert.equal(filterNodes({kind:"scriptural_anchor"}).every(n=>n.kind==="scriptural_anchor"),true);
 assert.equal(filterNodes({query:"no-match-expected"}).length,0);
});
test("relationship neighborhood keeps direction and exact edge types",()=>{
 const result=neighborhood("buddy");assert.ok(result);
 assert.ok(result.neighbors.some(x=>x.node.id==="hunny"&&x.relation==="story_duo"));
 assert.ok(result.neighbors.some(x=>x.node.id==="dog-ai"&&x.relation==="thematic_not_identity"));
 assert.equal(neighborhood("__missing__"),null);
 for(const e of EDGES){assert.ok(NODES.some(n=>n.id===e.from));assert.ok(NODES.some(n=>n.id===e.to));}
});
test("export is public-safe source data, not a task completion report",()=>{
 const graph=JSON.parse(exportGraph());
 assert.equal(graph.nodes.length,NODES.length);assert.equal(graph.edges.length,EDGES.length);
 assert.ok(graph.canon_note.includes("SUPMALG"));assert.ok(graph.canon_note.includes("SUPMALS"));
 assert.equal(Object.hasOwn(graph,"private_assets"),false);
});

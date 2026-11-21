import assert from "node:assert/strict";import worker from "./src/index.mjs";
async function get(p){return worker.fetch(new Request("https://example.invalid"+p),{})}
assert.equal((await (await get("/api/halls")).json()).halls.length,8);
assert.equal((await (await get("/health")).json()).physical_compute_claim,false);
assert.equal((await get("/api/inventory")).status,503);
assert.equal((await get("/api/capacity-model?devices=2&watts_per_device=500&hours=1&pue=1.2")).status,200);
assert.equal((await (await get("/api/capacity-model?devices=2&watts_per_device=500&hours=1&pue=1.2")).json()).facility_kwh,1.2);
assert.equal((await get("/api/capacity-model?devices=-1")).status,400);
assert.equal((await worker.fetch(new Request("https://example.invalid/api/halls",{method:"POST"}),{})).status,405);
console.log("Virtual warehouse tests passed");

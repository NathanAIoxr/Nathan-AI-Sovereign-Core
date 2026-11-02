"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const catalog = require("./records.js");

test("21 unique, sequential records and exact 7/7/7 organization", () => {
  assert.equal(catalog.records.length,21);
  assert.deepEqual(catalog.records.map(r=>r.number),Array.from({length:21},(_,i)=>i+1));
  assert.equal(new Set(catalog.records.map(r=>r.number)).size,21);
  for(const [category,n] of Object.entries(catalog.counts)) assert.equal(catalog.records.filter(r=>r.category===category).length,n);
  assert.equal(catalog.categories.length,3);
});
test("each source Function and Rule is present and unmodified in its record", () => {
  for(const r of catalog.records){
    assert.ok(r.name&&r.epithet&&r.sourceFunction&&r.sourceRule);
    assert.ok(r.sourceFunction.length>40);
    assert.ok(r.sourceRule.length>40);
  }
  assert.equal(catalog.records[19].sourceFunction.startsWith("&#x53;erver"),true,"preserve original HTML entity exactly");
});
test("source does not imply deployment", () => {
  assert.match(catalog.ancestor,/TABOR ROOT/);
  assert.equal(catalog.records[2].name,"Git");
  assert.equal(catalog.records[17].name,"5G Advanced / 6G Cellular");
});

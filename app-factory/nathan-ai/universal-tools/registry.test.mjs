import test from 'node:test';
import assert from 'node:assert/strict';
import {COLLECTIONS,ARTIFACTS,STATUS,SCHEMA,searchArtifacts,MUSEUM_REFERENCES} from './registry.mjs';

test('publishes eight named sets, 13 slots each, and exactly 104 unique positions',()=>{
 assert.equal(SCHEMA,'nathan-ai-universal-tools.v1');
 assert.equal(COLLECTIONS.length,8);
 assert.equal(ARTIFACTS.length,104);
 assert.equal(new Set(ARTIFACTS.map(x=>x.id)).size,104);
 for(const [i,c] of COLLECTIONS.entries()){
  assert.equal(c.items.length,13,'box '+(i+1));
  assert.deepEqual(c.items.map(x=>x.number),Array.from({length:13},(_,j)=>j+1));
  assert.equal(c.items[12].role,'thirteenth centerpiece');
 }
});
test('preserves original cultural and collection names',()=>{
 assert.equal(COLLECTIONS[0].items[0].name,'Juji-Shuriken');
 assert.equal(COLLECTIONS[1].items[0].name,'Mula Chakram');
 assert.equal(COLLECTIONS[2].items[0].name,'Kpinga Baseline');
 assert.equal(COLLECTIONS[3].items[0].name,'Clovis Fluted');
 assert.equal(COLLECTIONS[4].items[0].name,'Classic Kylie');
 assert.equal(COLLECTIONS[5].items[0].name,'Gaucho Boleadoras');
 assert.equal(COLLECTIONS[6].items[0].name,'Basketmaker Atlatl');
 assert.equal(COLLECTIONS[7].items[0].name,'Prehistoric Talisman — Sacred Stick');
});
test('retains 13th centerpiece history for sets five through seven',()=>{
 for(const i of [4,5,6]){
  assert.equal(COLLECTIONS[i].items[12].name,'Fire-Drill Bow & Inertial Flywheel');
  assert.ok(COLLECTIONS[i].items[12].previousCenterpiece);
  assert.equal(COLLECTIONS[i].items[12].status,'O');
 }
});
test('every status has an explicit evidence label and all items have geometry and region',()=>{
 for(const x of ARTIFACTS){
  assert.ok(STATUS[x.status],x.id);
  assert.ok(x.name&&x.region&&x.shape,x.id);
  assert.ok(x.shape.length<130,x.id);
 }
});
test('search supports exact item, geography, set and evidence filters',()=>{
 assert.equal(searchArtifacts('BX01-01').length,1);
 assert.equal(searchArtifacts('kanzashi').length,1);
 assert.equal(searchArtifacts('',8).length,13);
 assert.ok(searchArtifacts('antarctica').length>=3);
 assert.ok(searchArtifacts('',0,'O').length>10);
 assert.equal(searchArtifacts('invented impossible string').length,0);
});

test('corrects fictional Royal Pingha without misrepresenting museum object',()=>{
 const x=COLLECTIONS[2].items[12],eight=COLLECTIONS[2].items[7];
 assert.equal(x.id,'BX03-13');
 assert.match(x.name,/Royal Pingha.*fictional/);
 assert.equal(x.status,'O');
 assert.equal(x.objectVerified,false);
 assert.equal(x.accession,null);
 assert.match(x.correction,/AI-created illustration/);
 assert.equal(eight.objectVerified,false);
 assert.match(eight.correction,/not verified/);
 const museum=MUSEUM_REFERENCES[0];
 assert.equal(museum.id,'CMA-2015.156');
 assert.equal(museum.overallCm,45.5);
 assert.match(museum.shape,/Asymmetrical/);
 assert.equal(museum.itemInCollectorCase,false);
});
test('no creative collector slot is wrongly claimed as an individually authenticated museum object',()=>{
 assert.ok(ARTIFACTS.every(x=>x.objectVerified===false&&x.accession===null&&x.authorialCatalogLabel===true));
 assert.equal(MUSEUM_REFERENCES.length,1);
});

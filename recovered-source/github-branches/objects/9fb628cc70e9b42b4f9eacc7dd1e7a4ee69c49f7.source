'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const model=require('./engine.js');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
const hub=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const directory=fs.readFileSync(path.join(__dirname,'..','hub.js'),'utf8');

test('authored 53-year framing preserved as attributed metadata',()=>{
 assert.equal(model.system.age_mark,53);
 assert.equal(model.system.life_start,'1973-08-29');
 assert.equal(model.system.term,'ABSOLUTE INTELLIGENCE — NOT ARTIFICIAL INTELLIGENCE');
 assert.equal(model.timeline.length,5);
 assert.ok(model.timeline.some(x=>x.period==='May 2024'&&x.kind==='author-stated'));
 assert.match(model.system.source_boundary,/owner-controlled/);
});
test('Council original sequence, one throne and 24 elders remain distinct',()=>{
 assert.equal(model.council.length,13);
 assert.equal(model.council[0].name,'THE WAR OF MAMMALS');
 for(const name of ['The Throne / Sovereign','The 24 Elders','Sons of God','Authorities','The Host','Rebellion','Nations','Humanity','The Lamb','New Jerusalem','The Dual-Witness Protocol'])assert.ok(model.council.some(x=>x.name===name),name);
 assert.ok(model.council.every(x=>Number.isInteger(x.level)&&x.level>=0&&x.level<=5));
 assert.deepEqual(model.viewAt(2).focus.map(x=>x.name),['The 24 Elders','Sons of God','The Lamb']);
 assert.equal(model.viewAt(10).level,5);
 assert.equal(model.viewAt(-2).level,0);
});
test('toy source concepts and proposed mechanics keep product stages',()=>{
 assert.equal(model.products.length,7);
 for(const name of ['THE TABOR DOG COMPANY TOYS','THE TABOR TAPE™','The Countertop Fluid Layer Heater','13-Fold Star / Iris Learning Mechanism'])assert.ok(model.products.some(x=>x.name===name));
 assert.ok(model.products.every(x=>x.stage&&x.source&&x.detail&&x.priority));
 assert.ok(model.products.some(x=>x.detail.includes('not a certified')));
 assert.match(model.boundaries.join(' '),/not marked safe, indestructible/);
});
test('app is local, source-first, and directly linked from Nathan AI',()=>{
 assert.match(html,/src="\.\/engine\.js"/);
 assert.match(html,/src="\.\/app\.js"/);
 assert.match(hub,/\.\/fifty-three-year\/index\.html/);
 assert.match(directory,/\.\.\/nathan-ai\/fifty-three-year\/index\.html/);
 assert.doesNotMatch(app,/\.innerHTML|eval\(|new Function\(|fetch\(/);
 assert.doesNotMatch(html,/<iframe|<script[^>]+https?:\/\//);
 assert.doesNotThrow(()=>new vm.Script(app));
});
test('export is public metadata with deterministic filters, no personal allegations',()=>{
 const data=JSON.parse(model.getReport());
 assert.equal(data.schema,'nathan-ai.fifty-three-year-atlas.v1');
 assert.equal(data.products.length,7);
 assert.equal(data.council.length,13);
 assert.deepEqual(model.filterItems(model.products,'HEATER',['name']).map(x=>x.id),['heater']);
 assert.deepEqual(model.filterItems(model.council,'24 elders',['name']).map(x=>x.id),['elders']);
 assert.doesNotMatch(model.getReport(),/1,500 Pulpits|\$152M|cortical inhibition|17\.5-year family estrangement/);
});
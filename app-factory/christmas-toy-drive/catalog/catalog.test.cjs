'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const c=require('./catalog-data.js');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const app=fs.readFileSync(path.join(__dirname,'catalog-app.js'),'utf8');
test('catalog has 30 ascending unique amounts, three fully mapped core categories',()=>{
 assert.equal(c.schema,'christmas-toy-drive.giving-catalog.v1');
 assert.equal(c.tiers.length,31);
 assert.equal(new Set(c.tiers.map(t=>t.amount)).size,30);
 for(let i=0;i<c.tiers.length;i++){
   const t=c.tiers[i];assert.ok(Number.isInteger(t.amount)&&t.amount>0);
   if(i)assert.ok(t.amount>c.tiers[i-1].amount);
   for(const category of ['toys','clothing','food']){
     assert.ok(t.items[category].title.length>4);
     assert.ok(t.items[category].summary.length>15);
   }
 }
 assert.equal(c.tiers.reduce((n,t)=>n+Object.keys(t.items).length,0),93);
});
test('existing Heifer reference levels and additional new levels remain distinct',()=>{
 const fromHeifer=[20,30,50,60,72,85,120,170,200,250,275,300,350,500,750,1000,1500,2500,5000,10000,25000,100000];
 const added=[5,10,15,25,40,75,100,150];
 for(const amount of fromHeifer){const t=c.tiers.find(x=>x.amount===amount);assert.equal(t.basis,'heifer');}
 for(const amount of added){const t=c.tiers.find(x=>x.amount===amount);assert.equal(t.basis,'added');}
 assert.equal(c.tiers.find(x=>x.amount===50000).basis,'platform');
 assert.equal(c.pricingStatus,'proposed-donation-levels-not-verified-bundle-costs');
});
test('prior operations-platform amounts are all included without renaming its legacy records',()=>{
 const previous=JSON.parse(fs.readFileSync(path.join(__dirname,'../platform/catalog.json'),'utf8'));
 assert.equal(previous.tiers.length,24);
 const current=new Set(c.tiers.map(x=>x.amount));
 for(const t of previous.tiers)assert.ok(current.has(t.amount_usd),'lost original amount '+t.amount_usd);
});
test('giving channel remains manual pending payment verification',()=>{
 assert.equal(c.cashApp.cashtag,'$DOGGODjnt');
 assert.equal(c.cashApp.verified,false);
 assert.equal(c.frequencies.length,3);
 assert.ok(c.frequencies.every(x=>x.automatic===false));
 for(const k of ['essentials','logistics','mostneeded'])assert.ok(c.flexible[k].name);
});
test('responsive original catalog and script remain local and safe',()=>{
 assert.match(html,/<meta name="viewport"/);
 assert.match(html,/31 proposed donation levels/);
 assert.match(html,/id="matrix-rows"/);
 assert.match(html,/id="program"/);
 assert.match(html,/id="frequency"/);
 assert.match(html,/catalog-data.js/);
 assert.match(html,/catalog-app.js/);
 assert.match(html,/not item price guarantees/);
 assert.match(html,/Tax-deductible nonprofit status has not been verified/);
 assert.doesNotMatch(html,/<form[^>]*\saction=|<input[^>]+type="email"/i);
 assert.doesNotThrow(()=>new vm.Script(app,{filename:'catalog-app.js'}));
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|navigator\.sendBeacon/);
});
test('main drive site and gateway link the original catalog without exposing donor PII',()=>{
 const home=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const giving=fs.readFileSync(path.join(__dirname,'../give/index.html'),'utf8');
 assert.match(home,/href="catalog\/"/);
 assert.match(giving,/href="\.\.\/catalog\/"/);
 assert.match(giving,/qs\.get\('amount'\)/);
 assert.doesNotMatch(giving,/<input[^>]+type="email"/i);
});

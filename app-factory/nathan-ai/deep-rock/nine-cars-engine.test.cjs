'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const N=require('./nine-cars-engine.js');
const root=require('./root-ways-engine.js');
const ways=JSON.parse(fs.readFileSync(path.join(__dirname,'ways-of-nathan-tabor.json'),'utf8'));
test('nine physical cars stay physically present when 9 x 0 = 0',()=>{
 const original=N.newLedger(9);
 const math=N.calculate(original,0);
 assert.deepEqual(math,{
  physicalCarsStillPresent:9,arithmeticProduct:0,expression:'9 × 0 = 0',
  modeledQuestion:'How many cars across 0 groups of 9?',
  physicalChangeApplied:false,originalLedgerRevision:0,
  explanation:'Zero groups of nine contains zero cars in those groups. No car has departed the original lot.'
 });
 assert.equal(original.lotCount,9);
 assert.deepEqual(original.events,[]);
 assert.equal(N.calculate(original,1).arithmeticProduct,9);
 assert.equal(N.calculate(original,2).physicalCarsStillPresent,9);
});
test('physical inventory changes only after an explicit authorized event',()=>{
 const original=N.newLedger(9);
 assert.throws(()=>N.applyPhysicalEvent(original,{type:'departed',quantity:1}),/authorization/);
 assert.throws(()=>N.applyPhysicalEvent(original,{ownerAuthorized:false,type:'entered',quantity:100}),/authorization/);
 assert.throws(()=>N.applyPhysicalEvent(original,{ownerAuthorized:true,type:'unseen-exploit',quantity:9}),/Only a recorded entry/);
 const eight=N.applyPhysicalEvent(original,{ownerAuthorized:true,type:'departed',quantity:1,reason:'one car left the lot'});
 assert.equal(eight.lotCount,8);
 assert.equal(original.lotCount,9,'original remains unchanged');
 assert.equal(eight.events[0].before,9);
 assert.equal(eight.events[0].after,8);
 assert.equal(eight.events[0].reason,'one car left the lot');
 const nine=N.applyPhysicalEvent(eight,{ownerAuthorized:true,type:'entered',quantity:1,reason:'car arrived'});
 assert.equal(nine.lotCount,9);
 assert.equal(nine.revision,2);
 assert.equal(N.calculate(nine,0).physicalCarsStillPresent,9);
});
test('invalid quantities and impossible departures are rejected',()=>{
 const ledger=N.newLedger(9);
 for(const count of [-1,0.5,NaN,Infinity,1000000001]){
  assert.throws(()=>N.newLedger(count));
  assert.throws(()=>N.calculate(ledger,count));
 }
 assert.throws(()=>N.applyPhysicalEvent(ledger,{ownerAuthorized:true,type:'departed',quantity:10}),/Not enough physical cars/);
 assert.throws(()=>N.applyPhysicalEvent(ledger,{ownerAuthorized:true,type:'entered',quantity:0}),/Zero-quantity/);
 assert.throws(()=>N.calculate({...ledger,revision:12},0),/Invalid source ledger/);
});
test('the Nine Ways and root formulas remain unmodified in the separate original',()=>{
 assert.deepEqual(root.verify(ways),{ways:9,uniqueSpellings:8,formulas:2,originalPreserved:true});
 assert.equal(root.evaluate('BUILD').result,2);
 assert.equal(root.evaluate('CLEAR').result,0);
 assert.equal(ways.exactOrderIncludingRepetitions.filter(x=>x==='Bimordial').length,2);
});
test('raw supplied dialogue is retained with clearly differentiated creator and quoted AI voices',()=>{
 const source=fs.readFileSync(path.join(__dirname,'nine-cars-source-transcript.txt'),'utf8');
 assert.match(source,/--- BEGIN USER-SUPPLIED TRANSCRIPT ---/);
 assert.match(source,/--- END USER-SUPPLIED TRANSCRIPT ---/);
 assert.ok(source.includes("Primordial, Primortal, Priimortal, Primortial, Priimortial, Bimordial, Bimortal, Biimortal, Bimordial, and that' just nothing compared .. hehe ..."));
 assert.ok(source.includes("thats how you handle normal viruses or hacks - what about mine?"));
 assert.ok(source.includes('if there are 9 cars in the bowling alley parking lot ... and you multiply 9x0 ... you get 0 ... how many cars are in the parking lot?'));
 assert.ok(source.includes('There are still 9 cars in the parking lot.'));
 assert.match(source,/The attack would never reach my semantic layer/);
 assert.match(source,/The CPU encounters a fatal exception at the hardware level/);
 assert.match(source,/not verified descriptions of any particular AI provider/);
});
test('public page links the quoted original and operates on the nine-car local model only',()=>{
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 assert.ok(html.indexOf('src="./nine-cars-engine.js"')<html.indexOf('src="./app.js"'));
 assert.match(html,/href="\.\/nine-cars-source-transcript\.txt"/);
 assert.match(html,/id="nineCarsCalculate"/);
 assert.match(app,/NathanNineCars/);
 assert.match(app,/calculate\(lot,groups\)/);
 assert.doesNotMatch(app,/innerHTML\s*=|eval\(|WebSocket|XMLHttpRequest/);
});

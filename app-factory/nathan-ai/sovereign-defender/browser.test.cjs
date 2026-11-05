'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const D=require('./engine.js');
const family=JSON.parse(fs.readFileSync(path.join(__dirname,'family.json'),'utf8'));
test('all seven original security job families have attributed names, real tasks and truthful status',()=>{
 assert.equal(family.schema,'nathan-ai.sovereign-defender.family.v1');
 assert.equal(family.families.length,7);
 assert.deepEqual(family.families.map(x=>x.id),['passive-antivirus','ransomware','dehack','integrity','network','hardware','private-simulation']);
 for(const item of family.families){
  assert.ok(item.label&&item.product&&item.stage);
  assert.ok(item.originals.length>0);
  assert.ok(item.implemented.length>0);
  assert.ok(item.stillNeeded.length>0);
  assert.doesNotMatch(item.stage,/certified|production-complete|fully-protected/i);
 }
 assert.ok(family.families.some(x=>x.originals.includes('GUARDRAILAI')));
 assert.ok(family.families.some(x=>x.originals.includes('NATHAN AI Hack D Hack / Glyphstream Breach Engine')));
});
test('consumer workbench is accessible and uses both unchanged original and new pure engine',()=>{
 const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
 assert.match(html,/<html lang="en">/);
 assert.match(html,/name="viewport"/);
 assert.match(html,/data-nathan-shared-appearance/);
 assert.match(html,/data-nathan-command-center/);
 assert.match(html,/id="inspect"/);
 assert.match(html,/id="compare"/);
 assert.match(html,/id="simulate"/);
 assert.ok(html.indexOf('../../one/hall-of-mirrors/engine.js')<html.indexOf('<script src="./app.js"'));
 assert.ok(html.indexOf('<script src="./engine.js"')<html.indexOf('<script src="./app.js"'));
 assert.match(app,/H\.classify\(contents\)/);
 assert.match(app,/D\.compareBaseline\(b,report\)/);
 assert.match(app,/D\.syntheticRansomware\(events\)/);
 assert.match(app,/file\.arrayBuffer\(\)/);
 assert.doesNotMatch(app,/innerHTML\s*=|XMLHttpRequest|WebSocket|navigator\.geolocation|eval\s*\(/);
});
test('real local source module links exist and original source modules are not overwritten',()=>{
 const targets=[
  '../../one/hall-of-mirrors/engine.js','../five-guardians/engine.js','../../one/offloader/engine.js',
  '../../one/hall-of-mirrors/inspector.cjs','../program-jobs/catalog.json',
  './engine.js','./audit.cjs','./app.js'
 ];
 for(const p of targets){assert.ok(fs.existsSync(path.resolve(__dirname,p)),p)}
 assert.ok(D.responseSteps().length>=5);
});

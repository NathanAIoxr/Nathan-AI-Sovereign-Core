'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const E=require('./engine.js');
test('five independent printer nodes start disconnected',()=>{
 const s=E.newState();
 assert.equal(E.NODE_COUNT,5);assert.equal(s.nodes.length,5);
 assert.deepEqual(s.nodes.map(x=>x.id),[1,2,3,4,5]);
 assert.ok(s.nodes.every(n=>n.physical==='DISCONNECTED'&&!n.connected&&n.layers===0));
 assert.equal(s.unified,false);assert.equal(E.summary(s).hardwareConnected,false);
});
test('five simulated jobs complete independently and then unify automatically',()=>{
 const s=E.newState('habitat');s.running=true;
 E.advance(s,1);
 assert.ok(s.nodes.every(n=>n.layers>0&&n.layers<E.MAX_LAYERS));
 assert.equal(s.unified,false);
 for(let i=0;i<10000&&!s.unified;i++)E.advance(s,.2);
 assert.equal(s.unified,true);
 assert.equal(s.running,false);
 assert.equal(E.isUnified(s),true);
 assert.ok(s.nodes.every(n=>n.connected&&n.layers===E.MAX_LAYERS));
 assert.equal(E.summary(s).globalState,'UNIFIED');
 assert.equal(E.summary(s).averagePercent,100);
});
test('pauses and restarts preserve node identities but clear progress',()=>{
 const s=E.newState('crate');s.running=true;E.advance(s,.25);
 s.running=false;const before=s.nodes[0].layers;E.advance(s,.3);
 assert.equal(s.nodes[0].layers,before);
 E.reset(s,'garden');
 assert.equal(s.shape,'garden');assert.equal(s.nodes.length,5);
 assert.equal(s.nodes[0].layers,0);assert.equal(s.gophers,0);
 assert.equal(s.unified,false);
});
test('all three abstract voxel models have valid layers',()=>{
 for(const shape of ['habitat','crate','garden']){
  const counts=Array.from({length:E.MAX_LAYERS},(_,z)=>E.sliceCount(shape,z));
  assert.ok(counts.some(x=>x>0),shape);
  assert.ok(counts.every(x=>x>=0&&x<=81),shape);
  assert.equal(E.voxel(shape,99,99,99),false);
 }
});
test('only verified reference URLs; no source execution or printer network client',()=>{
 assert.ok(E.REFS.length>=8);
 for(const s of E.REFS){
  assert.match(s.url,/^https:\/\//);
  assert.ok(s.name&&s.license&&s.relationship);
 }
 const source=fs.readFileSync(path.join(__dirname,'engine.js'),'utf8');
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.serial|navigator\.usb|child_process|eval\s*\(/);
});
test('website assets are local and GUI syntax parses without Node packages',()=>{
 const dir=__dirname,html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
 const css=fs.readFileSync(path.join(dir,'styles.css'),'utf8');
 assert.match(html,/<meta name="viewport"/);
 assert.match(html,/<canvas id="world"/);
 assert.match(html,/PHYSICAL HARDWARE DISCONNECTED/);
 assert.match(html,/id="source-list"/);
 assert.match(html,/id="inspect-rgba"/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotThrow(()=>new vm.Script(app,{filename:'app.js'}));
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.serial|navigator\.usb/);
 for(const rel of ['engine.js','app.js','styles.css'])assert.ok(fs.existsSync(path.join(dir,rel)),rel);
});
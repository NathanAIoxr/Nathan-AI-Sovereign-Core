import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classifyAirPath,HybridKineticEngine} from '../src/kinetic.mjs';
const closedCircle=Array.from({length:91},(_,i)=>({x:60*Math.cos(i*2*Math.PI/90),y:60*Math.sin(i*2*Math.PI/90)}));
const triangle=[{x:0,y:60},{x:-52,y:-30},{x:52,y:-30},{x:0,y:60}].flatMap((a,i,array)=>i===array.length-1?[]:Array.from({length:20},(_,j)=>({x:a.x+(array[i+1].x-a.x)*j/20,y:a.y+(array[i+1].y-a.y)*j/20}))).concat([{x:0,y:60}]);
const eight=Array.from({length:121},(_,i)=>({x:70*Math.sin(i*2*Math.PI/120),y:55*Math.sin(i*4*Math.PI/120)}));
const swish=Array.from({length:20},(_,i)=>({x:i,y:i<10?-i*5:-50+(i-10)*11}));
test('recognizes rotational gesture outlines in synthetic paths',()=>{
 assert.equal(classifyAirPath(closedCircle),'circle');
 assert.equal(classifyAirPath(triangle),'triangle');
 assert.equal(classifyAirPath(eight),'figureEight');
 assert.equal(classifyAirPath(swish),'swishFlick');
});
test('rejects undersampled, noisy patterns',()=>{
 assert.equal(classifyAirPath([]),'unknown');
 assert.equal(classifyAirPath(Array.from({length:30},(_,i)=>({x:i/200,y:i/200}))),'unknown');
});
test('requires a deliberate hold to arm virtual release',()=>{
 const fired=[],k=new HybridKineticEngine({onThrow:g=>fired.push(g)});
 k.setMode('throw');
 k.ingest({t:0,ay:1.2,az:0,rx:1,ry:2});
 k.ingest({t:30,ay:.1,az:0});
 assert.equal(fired.length,0);
 k.arm(true);
 k.ingest({t:1000,ay:1.2,az:0,rx:1,ry:2});
 k.ingest({t:1040,ay:.1,az:0});
 assert.equal(fired.length,1);assert.equal(fired[0].fingerCount,0);
 assert.equal(k.armed,false);
 k.ingest({t:1200,ay:1.3,az:0}); k.ingest({t:1240,ay:.1,az:0});
 assert.equal(fired.length,1);
});
test('captures only intentionally traced sensor samples',()=>{
 const paths=[],k=new HybridKineticEngine({onPattern:(shape,p)=>paths.push({shape,p})});
 k.setMode('trace');k.ingest({t:1,rx:4,rz:2});assert.equal(k.points.length,0);
 k.trace(true);
 for(let i=0;i<30;i++)k.ingest({t:100+i*10,rx:8,rz:3});
 k.trace(false);
 assert.equal(paths.length,1);assert.ok(paths[0].p.length>20);
 assert.equal(k.tracing,false);
});

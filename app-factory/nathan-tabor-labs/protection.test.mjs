import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {page,script} from './mind-game.mjs';
for (const title of ["Known","Unknown","Seen","Unseen","Scene","Unscene"]) assert.ok(page.includes('<h2>'+title+'</h2>'),title);
assert.ok(page.includes('Game of Protecting Innocence'));
const elems=new Map();
const context = {assert,document:{getElementById(id){
  if(!elems.has(id))elems.set(id,{value:'',options:id==='world'?Array.from({length:4},()=>({})):[],addEventListener(){},setAttribute(){},getContext:()=>({}),getBoundingClientRect:()=>({width:400,height:200})});
  return elems.get(id);
}},localStorage:{getItem:()=>null,setItem(){}},navigator:{},matchMedia:()=>({matches:true}),window:{addEventListener(){}},
ResizeObserver:class {observe(){}},devicePixelRatio:1,requestAnimationFrame(){}};
runInNewContext(script+`
beginShot();
for(let i=0;i<242&&shot;i++)tick();
assert.equal(history.outcome,"Hit");
assert.equal(progress.score,1);
shot={world:0,wind:0,phase:0,elapsed:0,x:SPARK.x-30,y:SPARK.y,vx:1200,vy:0,charged:true,release:{vx:1200,vy:0},blockers:[],path:[]};
for(let i=0;i<10&&shot;i++)tick();
assert.equal(history.outcome,"Spark contacted");
assert.equal(history.gained,0);
assert.equal(progress.score,1);
ui.scene.onclick();ui.field.onclick();
assert.match(get("unscene-readout").textContent,/Opposite view is active/);
assert.match(get("unseen").textContent,/Force overlay on/);
assert.equal(history.outcome,"Spark contacted");
get("what-if").onclick();
assert.equal(progress.score,1);
assert.equal(history.outcome,"Spark contacted");
clearAttempt();
assert.equal(progress.score,1);
assert.equal(charge,0);
`,context);
console.log('Public arcade passed all six panels, a protected hit, zero credit on contact, mirror, force overlay, alternate replay and clear.');

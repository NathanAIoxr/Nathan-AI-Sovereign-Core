import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluate, advance } from './public/physics.js';
const chapters=JSON.parse(await readFile(new URL('./public/chapters.json',import.meta.url)));
assert.equal(chapters.length,7);
assert.equal(new Set(chapters.map(ch=>ch.id)).size,7);
for(const ch of chapters){
  assert.equal(ch.narrative.length,3);
  const values=Object.fromEntries(ch.game.controls.map(c=>[c.key,c.value]));
  assert.equal(typeof evaluate(ch.game.mode,values).text,'string');
}
const solutions=[
  ['kiln',{silica:72,soda:16,heat:80}],
  ['solar',{index:1.5,distance:58,tilt:0}],
  ['pressure',{pressure:101,fill:55,index:1.4}],
  ['candle',{index:1.5,distance:58,tilt:-4}],
  ['weather',{temp:10,pressure:1013,density:1.01}],
  ['snow',{viscosity:8,density:1,size:1}],
  ['lava',{temp:75,viscosity:4,density:1.5}],
];
for(const [mode,v] of solutions)assert.equal(evaluate(mode,v,true).ok,true,mode);
assert.equal(evaluate('snow',solutions[5][1],false).ok,false);
const p={x:.9,y:.08,vx:3,vy:0};advance(p,.05,'snow',solutions[5][1],evaluate('snow',solutions[5][1]));
assert.ok(Math.hypot(p.x,p.y)<=.940000001);
const worker=(await import('./.release/worker.mjs')).default;
const get=(path,method='GET')=>worker.fetch(new Request('https://app.test'+path,{method}));
assert.equal(get('/').status,200);
assert.equal((await get('/chapters.json').json()).length,7);
assert.equal(get('/icon-512.png').headers.get('content-type'),'image/png');
assert.equal(await get('/','HEAD').text(),'');
assert.equal(get('/nope').status,404);
assert.equal(get('/','POST').status,405);
console.log('Seven solvable labs, asset routes and collision bounds passed.');

const { restoreProgress,saveProgress } = await import('./public/progress.js');
const state = new Map();
const storage={getItem:key=>state.get(key),setItem:(key,value)=>state.set(key,value)};
const saved = new Map([[5,{values:{viscosity:8,density:1,size:1},shaken:true}]]);
assert.equal(saveProgress(storage,chapters,saved,new Set([5])),true);
const reopened=restoreProgress(storage,chapters);
assert.deepEqual(reopened.labs.get(5),saved.get(5));
assert.deepEqual([...reopened.completed],[5]);
assert.equal(restoreProgress({getItem:()=>'{broken'},chapters).labs.size,0);
assert.equal(saveProgress({setItem(){throw Error('Blocked');}},chapters,saved,new Set()),false);
assert.equal(chapters.filter(ch=>ch.worksheet?.reflection).length,7);
assert.equal(get('/progress.js').status,200);
console.log('Saved progress and seven worksheets passed.');

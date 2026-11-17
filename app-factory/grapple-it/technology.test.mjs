import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {createClock,STEP,PHYSICS_HZ} from './public/fixed-clock.mjs';
import {freshLine,dailyCourse,linedUp,tensionBand,advanceLine} from './public/campaign.mjs';
import {checkDailyReplay,lineInput,MAX_TICKS} from './public/daily-replay.mjs';
import {beginStroke,sampleStroke,releaseStroke} from './public/tactile-input.mjs';
import {analyze} from './public/track-baller.mjs';
import {makeRope,stepRope} from './public/rope.mjs';
import {newBridge,pattern,bridgeShot,bridgeInput} from './public/precision-bridge.mjs';
import {dailyApi} from './daily-api.mjs';

for(const hz of [30,60,120,144]){
 const clock=createClock();
 let sum=0;
 for(let i=0;i<=hz;i++)clock.frame(i*1000/hz,step=>{assert.equal(step,STEP);sum+=step;});
 assert.equal(clock.ticks,PHYSICS_HZ);
 assert.ok(Math.abs(sum-1)<1e-10);
 clock.pause();clock.frame(40000,()=>assert.fail('Hidden time must not advance physics'));
}
const stroke=beginStroke({left:0,top:0,width:300,height:500});
sampleStroke(stroke,{clientX:100,clientY:180,timeStamp:0});
sampleStroke(stroke,{clientX:175,clientY:240,timeStamp:30});
sampleStroke(stroke,{clientX:280,clientY:370,timeStamp:44});
const stable=releaseStroke(stroke,{clientX:295-12,clientY:410,timeStamp:48});
assert.ok(stable.aim.x<.55,'lift-off jump must be ignored');
assert.equal(releaseStroke(stroke,{clientX:293,clientY:410,timeStamp:49}),null);
const loop=Array.from({length:50},(_,i)=>({x:.35*Math.cos(i/49*2*Math.PI),y:.35*Math.sin(i/49*2*Math.PI),t:i*9}));
assert.equal(analyze(loop).kind,'swirl');
const rope=makeRope([.5,.2],[.5,.43],.23);
for(let i=0;i<PHYSICS_HZ;i++)stepRope(rope,[.5,.2],[.60,.407],STEP);
assert.equal(rope.nodes.length,16);
assert.deepEqual(rope.nodes.map(({x,y})=>[x,y]).filter((_,i)=>i===0||i===15),[[.5,.2],[.60,.407]]);
assert.ok(rope.nodes.every(({x,y})=>Number.isFinite(x)&&Number.isFinite(y)));

const bridge=newBridge();
assert.equal(bridgeShot(bridge,75),75);
assert.equal(bridgeShot(bridge,75),null);
for(const key of pattern(bridge))bridgeInput(bridge,key);
assert.equal(bridge.ammo,1);
assert.equal(bridge.buff,1);
assert.equal(bridge.shield,1);
bridgeInput(bridge,(pattern(bridge)[0]+1)%3);
assert.equal(bridge.integrity,3);
assert.equal(bridge.shield,0);
assert.equal(bridgeShot(bridge,75),90);
assert.equal(bridgeShot(bridge,75),null);

const day='2026-11-17';
function winningReplay(day){
 const course=dailyCourse(day), state=freshLine(course), moves=[];
 const [low,high]=tensionBand(course);
 for(let tick=0;tick<MAX_TICKS&&state.phase!=='won';tick++){
  let action;
  if(state.phase==='aim'&&linedUp(state))action='cast';
  if(state.phase==='reel'){
   if(!state.hold&&state.stress<low+.03)action='reel';
   if(state.hold&&state.stress>high-.13)action='ease';
  }
  if(action){moves.push([tick,action]);lineInput(state,action);}
  advanceLine(state,STEP);
 }
 assert.equal(state.phase,'won');
 return moves;
}
for(let date=10;date<20;date++){
 const today='2026-11-'+date;
 assert.equal(checkDailyReplay(today,winningReplay(today)).grade,3);
}
const moves=winningReplay(day), expected=checkDailyReplay(day,moves);
assert.equal(checkDailyReplay(day,[[MAX_TICKS+1,'cast']]),null);
assert.equal(checkDailyReplay(day,[[1,'reel']]),null);
assert.equal(checkDailyReplay(day,[[0,'cast'],[0,'cast']]),null);

const sqlite=new DatabaseSync(':memory:');
sqlite.exec(await readFile(new URL('./migrations/0001_daily_scores.sql',import.meta.url),'utf8'));
const DB={prepare(sql){
 const stmt=sqlite.prepare(sql);
 return {bind(...args){return {
  async all(){return {results:stmt.all(...args)};},
  async run(){return {meta:stmt.run(...args)};},
 };}};
}};
const origin='https://g.example',url=origin+'/api/daily';
const now=new Date(day+'T03:00:00Z');
const req=(body,from=origin)=>new Request(url,{method:'POST',headers:{Origin:from,'Content-Type':'application/json'},body:JSON.stringify(body)});
const data={alias:'Test Player',day,player:'a'.repeat(32),moves};
assert.equal((await dailyApi(req(data,'https://other.example'),{DB},now)).status,403);
assert.equal((await dailyApi(req({...data,moves:[]}),{DB},now)).status,422);
assert.equal((await dailyApi(req(data),{DB,DAILY_POST:{limit:()=>({success:false})}},now)).status,429);
assert.equal((await (await dailyApi(req(data),{DB},now)).json()).improved,true);
assert.equal((await (await dailyApi(req(data),{DB},now)).json()).improved,false);
const board=await (await dailyApi(new Request(url),{DB},now)).json();
assert.deepEqual(board.scores,[{alias:data.alias,medal:'Gold',ms:Math.round(expected.ticks/PHYSICS_HZ*1000)}]);
assert.equal((await (await dailyApi(new Request(url),{DB},new Date('2026-11-18'))).json()).scores.length,0);
sqlite.close();
console.log('240 Hz display-independent clock, touch filtering, trackball, rope, Universal Bridge and Daily replay/database tests passed.');

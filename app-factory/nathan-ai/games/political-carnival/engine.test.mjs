import test from 'node:test';
import assert from 'node:assert/strict';
import {ORIGINAL_TITLES,GAMES,DEMO_ROSTER,scorePlacement,makeRound,normalizeRoster} from './engine.mjs';
import {BRIDGE_SCHEMA,EVENT_NAME,readScores,saveScore,toScoreMessage} from './bridge.mjs';
test('preserves both original titles and leaves other booths planned',()=>{
 assert.deepEqual(ORIGINAL_TITLES,['Pin the Donkey on the Tail','Pin the Tail on the ASS']);
 assert.equal(GAMES.filter(g=>g.stage==='browser-demo').length,2);
 assert.equal(GAMES.filter(g=>g.stage==='planned').length,3);
});
test('demo roster never pretends to be a complete current roster',()=>{
 assert.ok(DEMO_ROSTER.length<596);
 assert.ok(DEMO_ROSTER.some(x=>x.name==='Donald Trump'));
 assert.ok(DEMO_ROSTER.some(x=>x.name==='JD Vance'));
});
test('score positions deterministically and bounds invalid coordinates',()=>{
 assert.equal(scorePlacement({x:.6,y:.5,targetX:.6,targetY:.5}).points,100);
 assert.ok(scorePlacement({x:0,y:0,targetX:1,targetY:1}).points===0);
 assert.ok(scorePlacement({x:999,y:-7,targetX:1,targetY:0}).points===100);
});
test('only active flagship games create round receipts',()=>{
 const round=makeRound({gameId:'pin_tail_on_ass',characterId:'trump',x:.5,y:.5,targetX:.5,targetY:.5});
 assert.equal(round.points,100);
 assert.throws(()=>makeRound({...round,gameId:'dunking_booth'}),/not playable/);
});
test('imported roster validates unique IDs, length, and text',()=>{
 const rows=normalizeRoster({characters:[{id:'gov-nc',name:'Governor sample',office:'Governor',state:'NC'}]});
 assert.equal(rows[0].source,'owner-imported');
 assert.throws(()=>normalizeRoster([{id:'x',name:'A'},{id:'x',name:'B'}]),/Invalid or repeated/);
 assert.throws(()=>normalizeRoster(new Array(701).fill({id:'x',name:'x'})),/700/);
});
test('score bridge shares structured receipts without touching other games',()=>{
 const round=makeRound({gameId:'pin_donkey_on_tail',characterId:'vance',x:.5,y:.5,targetX:.5,targetY:.5});
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const saved=saveScore(round,storage);
 assert.equal(saved.schema,BRIDGE_SCHEMA);
 assert.equal(readScores(storage).length,1);
 assert.equal(toScoreMessage(round).points,100);
 assert.equal(EVENT_NAME,'nathan:arcade:score');
 assert.deepEqual(readScores(null),[]);
});

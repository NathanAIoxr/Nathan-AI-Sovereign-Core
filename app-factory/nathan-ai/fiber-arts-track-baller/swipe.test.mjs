import test from 'node:test';
import assert from 'node:assert/strict';
import {swipeFrame} from './swipe.mjs';
const p=(x,y,time)=>({x,y,time});
test('classifies cardinal swipes',()=>{
 assert.equal(swipeFrame(p(0,0,0),p(30,1,100)).direction,'right');
 assert.equal(swipeFrame(p(0,0,0),p(-30,1,100)).direction,'left');
 assert.equal(swipeFrame(p(0,0,0),p(1,-30,100)).direction,'up');
 assert.equal(swipeFrame(p(0,0,0),p(1,30,100)).direction,'down');
});
test('rejects short, slow and reversed-time movements',()=>{
 assert.equal(swipeFrame(p(0,0,0),p(5,0,100)).valid,false);
 assert.equal(swipeFrame(p(0,0,0),p(40,0,601)).valid,false);
 assert.equal(swipeFrame(p(0,0,100),p(40,0,0)).valid,false);
});
test('rejects invalid input and thresholds',()=>{
 assert.throws(()=>swipeFrame(p(NaN,0,0),p(20,0,100)),TypeError);
 assert.throws(()=>swipeFrame(p(0,0,0),p(20,0,100),{maxDuration:0}),RangeError);
});

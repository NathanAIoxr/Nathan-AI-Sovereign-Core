import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WristFlipEngine} from '../src/engine.mjs';
import {evaluateThrow} from '../src/games.mjs';
function scene() {const throws=[];return {e:new WristFlipEngine({onThrow:g=>throws.push(g),padWidth:300}),throws};}
test('three contacts: maximum screen Y is inferred bottom anchor',()=>{
 const {e,throws}=scene();
 e.down(10,135,290,0);e.down(11,100,140,0);e.down(12,165,145,0);
 assert.equal(e.snapshot().bottomId,10);
 e.move(11,100,110,20);e.move(12,165,112,20);
 e.move(11,104,75,40);e.move(12,172,80,40);
 e.up(10,135,290,45);e.up(11,104,50,70);e.up(12,172,58,72);
 assert.equal(throws.length,1);assert.equal(throws[0].fingerCount,3);
 assert.ok(throws[0].power>0);assert.equal(throws[0].motionUsed,false);
});
test('one-touch upward swipe works without sensors',()=>{
 const {e,throws}=scene();e.down(1,120,250,0);e.move(1,120,205,25);e.move(1,120,155,55);e.up(1,120,150,70);
 assert.equal(throws.length,1);assert.equal(throws[0].fingerCount,1);assert.ok(throws[0].power>.5);
});
test('two-contact release also works',()=>{
 const {e,throws}=scene();e.down(1,140,290,0);e.down(2,150,160,0);
 e.move(2,150,130,30);e.move(2,150,100,50);
 e.up(1,140,290,55);e.up(2,150,98,70);
 assert.equal(throws.length,1);assert.equal(throws[0].fingerCount,2);
});
test('the last 14ms noisy lift-off is ignored in trajectory',()=>{
 const {e,throws}=scene();e.down(1,140,250,0);e.move(1,140,210,30);
 e.move(1,140,170,55);e.up(1,140,900,65); // bogus spike
 assert.equal(throws.length,1);assert.ok(throws[0].power>.5);assert.ok(throws[0].velocity.y<0);
});
test('cancel never fires a throw',()=>{
 const {e,throws}=scene();e.down(1,100,100,0);e.cancel();assert.equal(throws.length,0);
});
test('three game cartridges produce bounded scores',()=>{
 const g={aimX:.52,power:.68,spin:0,loft:.4};
 for(const [game,max] of [['ten_pin_bowling',10],['beanbag_toss',3],['pub_darts',60]]){
  const out=evaluateThrow(game,g);assert.ok(out.score>=0&&out.score<=max);assert.ok(Number.isFinite(out.x));
 }
});
test('motion does not contribute without explicit enable',()=>{
 const {e,throws}=scene();e.motion({beta:200,gamma:120,t:50});e.down(1,160,230,0);e.up(1,160,230,50);
 assert.equal(throws[0].motionUsed,false);assert.equal(throws[0].power,0);
});
test('baseball virtual pitch produces bounded arcade strike-zone score',()=>{
 const out=evaluateThrow('baseball_pitching',{aimX:.5,power:.68,spin:.1,loft:.5});
 assert.ok([0,1].includes(out.score));assert.ok(['STRIKE ZONE','BALL'].includes(out.kind));
});

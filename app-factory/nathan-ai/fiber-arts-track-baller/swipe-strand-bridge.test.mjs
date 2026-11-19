import test from 'node:test';
import assert from 'node:assert/strict';
import { attachSwipeStrandNavigation } from './swipe-strand-bridge.mjs';
function target() {
  const handlers = new Map();
  return { addEventListener(n, fn) { handlers.set(n, fn); }, removeEventListener(n, fn) { if (handlers.get(n) === fn) handlers.delete(n); }, emit(n, e) { handlers.get(n)?.(e); }, get count() { return handlers.size; } };
}
const e = (id,x,y,t) => ({pointerId:id,clientX:x,clientY:y,timeStamp:t,pointerType:'touch',button:0});
function swipe(t, dx, dy) { t.emit('pointerdown',e(1,0,0,10)); t.emit('pointerup',e(1,dx,dy,100)); }
const strands = [{id:'a'},{id:'b'},{id:'c'}];
test('swipes advance and wrap without mutating craft strands', () => {
  const t=target(), out=[], before=JSON.stringify(strands);
  const s=attachSwipeStrandNavigation(t,strands,x=>out.push(x));
  swipe(t,30,0); swipe(t,30,0); swipe(t,30,0); swipe(t,30,0);
  assert.deepEqual(out.map(x=>x.id),['a','b','c','a']);
  assert.equal(s.getSelectedId(),'a'); assert.equal(JSON.stringify(strands),before);
  assert.equal(out[0].simulated,true); s.dispose();
});
test('reverse swipe starts at final strand and wraps',()=>{
  const t=target(), out=[]; attachSwipeStrandNavigation(t,strands,x=>out.push(x));
  swipe(t,-30,0); swipe(t,0,-30);
  assert.deepEqual(out.map(x=>x.id),['c','b']);
});
test('short swipe and empty catalog emit nothing',()=>{
  const t=target(), out=[]; attachSwipeStrandNavigation(t,[],x=>out.push(x)); swipe(t,30,0); assert.equal(out.length,0);
  const u=target(); attachSwipeStrandNavigation(u,strands,x=>out.push(x)); swipe(u,3,0); assert.equal(out.length,0);
});
test('rejects duplicate IDs and invalid callback',()=>{
  assert.throws(()=>attachSwipeStrandNavigation(target(),[{id:'a'},{id:'a'}],()=>{}),TypeError);
  assert.throws(()=>attachSwipeStrandNavigation(target(),strands,null),TypeError);
});
test('dispose is idempotent and detaches all listeners',()=>{
  const t=target(), out=[], s=attachSwipeStrandNavigation(t,strands,x=>out.push(x));
  s.dispose(); s.dispose(); swipe(t,30,0);
  assert.equal(t.count,0); assert.equal(out.length,0); assert.equal(s.getSelectedId(),null);
});

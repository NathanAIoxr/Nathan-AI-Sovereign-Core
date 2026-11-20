import test from 'node:test';
import assert from 'node:assert/strict';
import {attachKeyboardStrandNavigation} from './keyboard-strand-navigation.mjs';
function fixture(strands=[{id:'a'},{id:'b'},{id:'c'}]) {
  const listeners = new Map(), calls=[];
  const element={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name,fn)=>{if(listeners.get(name)===fn)listeners.delete(name);}};
  const nav=attachKeyboardStrandNavigation(element,strands,(...args)=>calls.push(args));
  function send(key,extra={}) {let prevented=false;const e={key,target:{tagName:'DIV'},preventDefault(){prevented=true;},...extra};listeners.get('keydown')?.(e);return prevented;}
  return {nav,calls,send,listeners};
}
test('cycles, wraps, Home and End without changing input strands',()=>{
 const strands=[{id:'a'},{id:'b'},{id:'c'}], f=fixture(strands);
 for(const k of ['ArrowRight','ArrowRight','End','ArrowRight','ArrowLeft','Home']) assert.equal(f.send(k),true);
 assert.deepEqual(f.calls.map(c=>c[0].id),['a','b','c','a','c','a']);
 assert.equal(f.nav.getSelectedId(),'a');assert.deepEqual(strands,[{id:'a'},{id:'b'},{id:'c'}]);
});
test('Enter activates only an already selected strand',()=>{
 const f=fixture();assert.equal(f.send('Enter'),false);f.send('ArrowDown');assert.equal(f.send('Enter'),true);assert.equal(f.calls[1][0].activated,true);
});
test('does not intercept typing, modified keys or prevented events',()=>{
 const f=fixture();assert.equal(f.send('ArrowRight',{target:{tagName:'INPUT'}}),false);
 assert.equal(f.send('ArrowRight',{ctrlKey:true}),false);assert.equal(f.send('ArrowRight',{defaultPrevented:true}),false);
 assert.equal(f.send('ArrowRight',{target:{isContentEditable:true}}),false);assert.equal(f.calls.length,0);
});
test('dispose is idempotent and removes listener',()=>{
 const f=fixture();f.nav.dispose();f.nav.dispose();assert.equal(f.listeners.size,0);assert.equal(f.nav.getSelectedId(),null);
});
test('rejects invalid and duplicate strand ids',()=>{
 assert.throws(()=>fixture([{id:'x'},{id:'x'}]),TypeError);
 assert.throws(()=>fixture([{id:''}]),TypeError);
});
test('empty catalog safely ignores navigation',()=>{
 const f=fixture([]);assert.equal(f.send('ArrowRight'),false);assert.equal(f.calls.length,0);
});

test('rejected selection preserves prior keyboard index',()=>{
 const listeners=new Map();
 const element={addEventListener:(k,fn)=>listeners.set(k,fn),removeEventListener:(k)=>listeners.delete(k)};
 const seen=[];
 const nav=attachKeyboardStrandNavigation(element,[{id:'a'},{id:'b'}],selection=>{seen.push(selection.id);return selection.id!=='b';});
 const event=key=>({key,target:{tagName:'DIV'},preventDefault(){}});
 listeners.get('keydown')(event('ArrowRight'));
 assert.equal(nav.getSelectedId(),'a');
 listeners.get('keydown')(event('ArrowRight'));
 assert.equal(nav.getSelectedId(),'a');
 assert.deepEqual(seen,['a','b']);
 nav.dispose();
});

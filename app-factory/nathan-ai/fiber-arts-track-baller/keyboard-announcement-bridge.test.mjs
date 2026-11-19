import test from 'node:test';
import assert from 'node:assert/strict';
import { attachAccessibleKeyboardStrands } from './keyboard-announcement-bridge.mjs';
function setup(callback = () => {}) {
 const listeners = new Map(), announcements = [];
 const element = { addEventListener:(k,fn)=>listeners.set(k,fn), removeEventListener:(k,fn)=>{if(listeners.get(k)===fn) listeners.delete(k);} };
 const bridge = attachAccessibleKeyboardStrands(element,[{id:'first'},{id:'second'}],{announce:s=>{announcements.push(s.id);return true;}},callback);
 const send = (key,extra={}) => {let prevented=false;listeners.get('keydown')?.({key,target:{tagName:'DIV'},preventDefault(){prevented=true;},...extra});return prevented;};
 return {bridge,listeners,announcements,send};
}
test('announces navigation and activation without mutating IDs',()=>{const f=setup();f.send('ArrowRight');f.send('ArrowRight');f.send('Enter');assert.deepEqual(f.announcements,['first','second','second']);assert.equal(f.bridge.getSelectedId(),'second');});
test('consumer rejection suppresses announcements',()=>{const f=setup(()=>false);f.send('ArrowRight');assert.deepEqual(f.announcements,[]);});
test('ignores typing and unrelated keys',()=>{const f=setup();assert.equal(f.send('ArrowRight',{target:{tagName:'INPUT'}}),false);assert.equal(f.send('Escape'),false);assert.deepEqual(f.announcements,[]);});
test('dispose removes listener and is idempotent',()=>{const f=setup();f.bridge.dispose();f.bridge.dispose();assert.equal(f.listeners.size,0);assert.equal(f.send('ArrowRight'),false);});
test('rejects missing announcer or callback',()=>{assert.throws(()=>attachAccessibleKeyboardStrands({},[],null),TypeError);assert.throws(()=>attachAccessibleKeyboardStrands({},[],{announce(){}},null),TypeError);});

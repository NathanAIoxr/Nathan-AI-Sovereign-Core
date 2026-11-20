import test from 'node:test';
import assert from 'node:assert/strict';
import {attachKeyboardStrandNavigation} from './keyboard-strand-navigation.mjs';
function setup() {
 const listeners=new Map(), actions=[];
 const element={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:(name)=>listeners.delete(name)};
 const nav=attachKeyboardStrandNavigation(element,[{id:'one'},{id:'two'}],s=>actions.push(s));
 const send=(key,repeat=false)=>{let prevented=false;listeners.get('keydown')?.({key,repeat,target:{tagName:'DIV'},preventDefault(){prevented=true;}});return prevented;};
 return {nav,actions,send,listeners};
}
test('held Enter does not repeat activation',()=>{const f=setup();f.send('ArrowRight');f.send('Enter');assert.equal(f.send('Enter',true),true);assert.equal(f.actions.filter(x=>x.activated).length,1);f.nav.dispose();});
test('held Space does not repeat activation or scroll',()=>{const f=setup();f.send('ArrowRight');f.send(' ');assert.equal(f.send(' ',true),true);assert.equal(f.actions.filter(x=>x.activated).length,1);f.nav.dispose();});
test('distinct key presses still activate',()=>{const f=setup();f.send('ArrowRight');f.send('Enter');f.send('Enter');assert.equal(f.actions.filter(x=>x.activated).length,2);f.nav.dispose();});
test('repeated arrow navigation still works',()=>{const f=setup();f.send('ArrowRight');f.send('ArrowRight',true);assert.equal(f.nav.getSelectedId(),'two');f.nav.dispose();});

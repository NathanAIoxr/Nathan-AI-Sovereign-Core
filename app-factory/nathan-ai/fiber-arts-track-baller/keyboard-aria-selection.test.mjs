import test from 'node:test';
import assert from 'node:assert/strict';
import { attachKeyboardAriaSelection } from './keyboard-aria-selection.mjs';
function element() {
  const listeners = new Map();
  return { addEventListener(k,f) { listeners.set(k,f); }, removeEventListener(k,f) { if (listeners.get(k)===f) listeners.delete(k); }, fire(key) { listeners.get('keydown')?.({key,preventDefault(){},target:{tagName:'DIV'}}); }, listeners };
}
function region() { const attrs = new Map(); return {textContent:'',setAttribute(k,v){attrs.set(k,v)},getAttribute(k){return attrs.get(k)??null}}; }
const strands = [{id:'a'},{id:'b'}];
test('opt-in disabled by default',()=>{const e=element(),r=region();const a=attachKeyboardAriaSelection(e,strands,r);e.fire('ArrowRight');assert.equal(r.textContent,'');a.dispose();});
test('enabled selection announces labeled strand',()=>{const e=element(),r=region();const a=attachKeyboardAriaSelection(e,strands,r,{enabled:true,labels:{b:'Blue wool'}});e.fire('ArrowRight');assert.match(r.textContent,/strand/);a.dispose();});
test('rejected selection never announces',()=>{const e=element(),r=region();const a=attachKeyboardAriaSelection(e,strands,r,{enabled:true,onSelection:()=>false});e.fire('ArrowRight');assert.equal(r.textContent,'');a.dispose();});
test('disposal removes listener and disables future updates',()=>{const e=element(),r=region();const a=attachKeyboardAriaSelection(e,strands,r,{enabled:true});a.dispose();assert.equal(e.listeners.size,0);assert.equal(a.setEnabled(true),false);});
test('rejects invalid options',()=>{assert.throws(()=>attachKeyboardAriaSelection(element(),strands,region(),{enabled:1}),TypeError);});

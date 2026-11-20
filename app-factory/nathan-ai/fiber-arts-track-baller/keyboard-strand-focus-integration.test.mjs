import test from 'node:test';
import assert from 'node:assert/strict';
import { attachKeyboardStrandNavigation } from './keyboard-strand-navigation.mjs';
function fixture() {
  let handler; const selected=[];
  const element={addEventListener:(_,fn)=>handler=fn,removeEventListener:()=>{handler=undefined}};
  const nav=attachKeyboardStrandNavigation(element,[{id:'a'},{id:'b'}],s=>selected.push(s));
  function send(key, props={}) {let prevented=false;handler?.({key,target:{tagName:'DIV'},preventDefault(){prevented=true},...props});return prevented;}
  return {nav,selected,send};
}
test('editable ARIA roles preserve arrow and activation keys',()=>{const f=fixture();for(const role of ['textbox','searchbox','combobox','spinbutton']) for(const key of ['ArrowRight','Enter',' ']) assert.equal(f.send(key,{target:{tagName:'DIV',getAttribute:()=>role}}),false);assert.equal(f.selected.length,0);});
test('IME composition and legacy keycode 229 are ignored',()=>{const f=fixture();assert.equal(f.send('ArrowRight',{isComposing:true}),false);assert.equal(f.send('ArrowRight',{keyCode:229}),false);assert.equal(f.selected.length,0);});
test('regular navigation still selects and activates',()=>{const f=fixture();assert.equal(f.send('ArrowRight'),true);assert.equal(f.send('Enter'),true);assert.equal(f.selected[0].id,'a');assert.equal(f.selected[1].activated,true);});
test('role property fallback and disposal',()=>{const f=fixture();assert.equal(f.send('ArrowDown',{target:{role:'textbox'}}),false);f.nav.dispose();assert.equal(f.send('ArrowDown'),false);});

import test from 'node:test';
import assert from 'node:assert/strict';
import { guardedKeyboardViewportFrame } from './keyboard-focus-guard.mjs';
const base = Object.freeze({ zoom: 1, panX: 0, panY: 0, orientation: Object.freeze([1, 0, 0, 0]) });
test('plain arrow keys navigate', () => { const f = guardedKeyboardViewportFrame(base, {key:'ArrowRight'}); assert.equal(f.panX,16); assert.equal(f.handled,true); assert.equal(f.blockedByFocus,false); });
test('editable fields and accessible text roles preserve typing', () => { for (const focus of [{tagName:'input'},{tagName:'TEXTAREA'},{tagName:'select'},{isContentEditable:true},{role:'textbox'},{role:'combobox'}]) { const f=guardedKeyboardViewportFrame(base,{key:'ArrowLeft',...focus}); assert.equal(f.panX,0); assert.equal(f.handled,false); assert.equal(f.blockedByFocus,true); } });
test('modifiers and IME composition do not hijack shortcuts', () => { for(const flag of ['ctrlKey','metaKey','altKey','shiftKey','isComposing']) { const f=guardedKeyboardViewportFrame(base,{key:'+', [flag]:true}); assert.equal(f.zoom,1); assert.equal(f.blockedByFocus,true); } });
test('reduced-motion options pass through to existing engine', () => { const f=guardedKeyboardViewportFrame(base,{key:'ArrowDown'},{reducedMotion:true}); assert.equal(f.panY,4); assert.equal(f.simulated,true); assert.equal(f.verifiedPhysics,false); });
test('input and output validation remain immutable', () => { assert.throws(()=>guardedKeyboardViewportFrame(base,null),TypeError); assert.throws(()=>guardedKeyboardViewportFrame(base,{key:'+',tagName:3}),TypeError); const f=guardedKeyboardViewportFrame(base,{key:'+'}); assert.equal(Object.isFrozen(f),true); assert.equal(Object.isFrozen(f.orientation),true); assert.equal(base.zoom,1); });

import test from 'node:test';
import assert from 'node:assert/strict';
import {describeFiberAction} from './accessibility.mjs';
test('swipe descriptions and non-recognition',()=>{assert.equal(describeFiberAction({type:'swipe',valid:true,direction:'left'}),'Swiped left');assert.equal(describeFiberAction({type:'swipe',valid:false}),'Swipe not recognized')});
test('strand selection descriptions',()=>{assert.equal(describeFiberAction({type:'strand',id:'warp-2'}),'Selected strand warp-2');assert.equal(describeFiberAction({type:'strand',id:null}),'No strand selected')});
test('zoom is readable and deterministic',()=>{assert.equal(describeFiberAction({type:'zoom',scale:1.255},{precision:1}),'Viewport zoom 125.5 percent')});
test('rejects invalid and unknown actions',()=>{assert.throws(()=>describeFiberAction(null),TypeError);assert.throws(()=>describeFiberAction({type:'zoom',scale:Infinity}),RangeError);assert.throws(()=>describeFiberAction({type:'swipe',valid:true,direction:'diagonal'}),TypeError);assert.throws(()=>describeFiberAction({type:'unknown'}),RangeError)});

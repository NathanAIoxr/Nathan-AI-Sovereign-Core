import test from 'node:test';import assert from 'node:assert/strict';import {boot,dispatch} from '../src/engine.js';
test('mission starts playing',()=>{const s=boot({id:'wood-splinter',seconds:299});assert.equal(s.state,'playing');assert.equal(s.remaining,299)});
test('stop cannot resume',()=>{const s=dispatch(boot({id:'wood-splinter',seconds:30}),{type:'stop'});assert.equal(dispatch(s,{type:'tap',hit:true}).score,0)});
test('stress escalates to fictional ER handoff',()=>{let s=boot({id:'wood-splinter',seconds:30});for(let i=0;i<3;i++)s=dispatch(s,{type:'tap',hit:false});assert.equal(s.state,'er_handoff')});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../engine.js'),F=require('./engine.js'),U=require('../uct/engine.js'),C=require('../sovereign-continuum/engine.js'),M=require('./merge-packs.js');
test('all parallel field root packs coexist without overwriting pre-existing source',()=>{
 const start=R.create();const out=M.install(R,F,U,C,start);
 assert.ok(out.added>175);
 assert.ok(out.crosslinks>=8);
 assert.equal(out.conflicts.length,0,out.conflicts.join('; '));
 assert.ok(out.state.nodes.length<R.LIMIT);
 assert.equal(start.nodes.length,15);
 for(const id of out.roots)assert.ok(out.state.nodes.some(n=>n.id===id),id);
 assert.ok(out.state.nodes.some(n=>n.id==='word:dirty'));
 assert.ok(out.state.edges.some(e=>e.from==='field:pinch'&&e.to==='uct:plasma'));
});
test('repeat graft preserves every old ID and creates no duplicates',()=>{
 const first=M.install(R,F,U,C,R.create());
 const second=M.install(R,F,U,C,first.state);
 assert.equal(second.added,0);
 assert.equal(second.linked,0);
 assert.deepEqual(second.conflicts,[]);
 assert.deepEqual(second.state,first.state);
});
test('a missing engine or invalid state never mutates caller',()=>{
 const original=R.create();
 assert.throws(()=>M.install(R,F,U,null,original));
 assert.throws(()=>M.install(R,F,U,C,{schema:'wrong'}));
 assert.equal(original.nodes.length,15);
});

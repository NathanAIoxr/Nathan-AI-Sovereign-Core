'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('./engine.js');
test('seed record is preserved with distinct exact and symbolic links',()=>{
 const a=E.create();assert.equal(a.schema,E.SCHEMA);
 assert.equal(a.nodes.find(n=>n.id==='formula:arithmetic').glyphs,'AAND');
 assert.equal(a.edges.find(e=>e.to==='word:aaron').type,'cipher');
 assert.equal(a.nodes.find(n=>n.id==='formula:geometric').glyphs,'GAR');
});
test('sucker cups reject false literal matches and duplicates',()=>{
 const a=E.create();
 assert.equal(E.check(a,{from:'formula:arithmetic',to:'word:aaron',type:'exact'}).ok,false);
 assert.equal(E.check(a,{from:'formula:geometric',to:'word:gar',type:'exact'}).ok,false);
 const b=E.addNode(a,{id:'word:gar2',label:'GAR',kind:'word',origin:'test'}).state;
 assert.equal(E.check(b,{from:'formula:geometric',to:'word:gar2',type:'exact'}).ok,true);
 assert.equal(E.check(b,{from:'word:dirty',to:'word:clean',type:'word-order'}).ok,false);
});
test('crumb bin catches failures without deleting source and allows correction',()=>{
 const a=E.create();const b=E.attach(a,{from:'formula:arithmetic',to:'word:aaron',type:'exact'});
 assert.equal(b.ok,false);assert.equal(b.state.cookie.length,1);
 assert.equal(a.cookie.length,0);assert.equal(b.state.nodes.length,a.nodes.length);
 const c=E.retry(b.state,b.state.cookie[0].id,{from:'word:moses',to:'word:gar',type:'symbolic',note:'Test symbolic cross-reference'});
 assert.equal(c.ok,true);assert.equal(c.state.cookie.length,0);
 assert.equal(c.state.edges.at(-1).review,'repaired');
});
test('documented sources are labeled supplied, not verified',()=>{
 const a=E.create();
 assert.equal(E.check(a,{from:'word:aaron',to:'word:abba',type:'documented',source:'I say so'}).ok,false);
 assert.equal(E.check(a,{from:'word:aaron',to:'word:abba',type:'documented',source:'https://example.org/item'}).ok,true);
});
test('sprout is lazy, repeatable and bounded',()=>{
 const a=E.create(),b=E.grow(a,'word:dirty',3);
 assert.equal(b.added,3);assert.equal(a.nodes.length,15);
 assert.equal(b.state.nodes.length,18);
 assert.equal(E.grow(b.state,'word:dirty',3).added,1);
 assert.equal(E.grow(a,'core:middle').added,0);
});
test('snapshots retain identity but mark imported edges as unverified',()=>{
 const a=E.create(),b=E.load(E.save(a));
 assert.equal(b.nodes.length,a.nodes.length);
 assert.ok(b.edges.every(e=>e.review==='imported-unverified'));
 assert.equal(E.adapter(a,'formula').nodes.length,4);
 assert.throws(()=>E.adapter(a,'../bad'));
 const broken=E.create();broken.edges.push({from:'missing:node',to:'word:gar',type:'symbolic'});
 assert.throws(()=>E.load(broken));
});
test('reversal, order reversal and id uniqueness stay distinct',()=>{
 const a=E.create(),b=E.addNode(a,{id:'word:rag',label:'RAG',kind:'word',origin:'Test'}).state;
 assert.equal(E.check(b,{from:'word:gar',to:'word:rag',type:'reversal'}).ok,true);
 const c=E.addNode(b,{id:'word:rag',label:'dup',kind:'word',origin:'Test'});
 assert.equal(c.ok,false);
});
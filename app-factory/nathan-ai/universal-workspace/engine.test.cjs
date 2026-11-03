const test=require('node:test');
const assert=require('node:assert/strict');
const e=require('./engine.js');
test('sentences and deterministic key passages',()=>{
 const t='Source records preserve original information. Source records permit careful review. The application protects the original text.';
 assert.ok(e.highlights(t).length>0);assert.ok(e.highlights(t).every(s=>t.includes(s)));
 assert.deepEqual(e.highlights(t),e.highlights(t));
});
test('literal search preserves source excerpts',()=>{
 const t='Alpha beta gamma. Alpha delta.';
 assert.equal(e.search(t,'alpha').length,2);
 assert.deepEqual(e.search(t,''),[]);
});
test('comparing does not invent model output',()=>{
 const c=e.compare('one two','one three');
 assert.equal(c.shared,1);assert.equal(c.identical,false);
 assert.equal(e.compare('same','same').identical,true);
});

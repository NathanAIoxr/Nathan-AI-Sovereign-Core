'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'five-matrices.html'),'utf8');
const match=html.match(/const stages=(\[[\s\S]*?\]);\s*let index=/);
if(!match)throw Error('Five-matrices stage manifest not found');
const stages=vm.runInNewContext(match[1]);
test('exactly five distinct matrices in canonical lifecycle order',()=>{
 assert.equal(stages.length,5);
 assert.deepEqual(Array.from(stages,s=>s.id),['BCE','BC','AC','CE','AD']);
 assert.equal(new Set(stages.map(s=>s.id)).size,5);
});
test('every matrix has era, failure state, correction, invariant and handoff',()=>{
 for(const stage of stages){
  for(const k of ['name','subtitle','era','error','fix','rule','handoff'])assert.ok(stage[k].trim(),stage.id+'.'+k);
  assert.equal(stage.steps.length,3);assert.equal(stage.fail.length,3);
 }
});
test('controls and accessible interaction hooks exist',()=>{
 for(const id of ['matrixGrid','previous','next','reverse','era','error','reset','export'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes("setAttribute('aria-pressed'"));
 assert.ok(html.includes('@media(prefers-reduced-motion:reduce)'));
});
test('offline module separates interpretation from documented history',()=>{
 assert.ok(html.includes('Scripture does not name BCE/BC/AC/CE/AD'));
 assert.ok(html.includes('theological/creative interpretation'));
 assert.ok(!/\bfetch\s*\(/.test(html));assert.ok(!/\bXMLHttpRequest\b/.test(html));
});

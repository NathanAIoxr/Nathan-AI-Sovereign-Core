const test=require('node:test'),assert=require('node:assert/strict');
const A=require('./binary-anchor.js');
test('pins exact UTF-8 bytes, binary and independently calculated digest',async()=>{
  const crypto=require('node:crypto');
  assert.equal(A.ANCHOR.text,'1+1=2\n1-1=0');
  assert.equal(Buffer.from(A.ANCHOR.text).length,11);
  assert.equal(A.ANCHOR.binary.split(' ').length,11);
  assert.equal(Buffer.from(A.ANCHOR.binary.split(' ').map(x=>parseInt(x,2))).toString(),'1+1=2\n1-1=0');
  assert.equal(crypto.createHash('sha256').update(A.ANCHOR.text).digest('hex'),A.ANCHOR.sha256);
  assert.equal((await A.verify(A.ANCHOR,crypto.webcrypto.subtle)).ok,true);
});
test('BUILD and CLEAR operate exactly on whole values, including beyond Number precision',()=>{
  assert.equal(A.calculate('build',1,1).value,'2');assert.equal(A.calculate('build',1,1).binary,'10');
  assert.equal(A.calculate('clear',1,1).value,'0');assert.equal(A.calculate('clear',1,1).binary,'0');
  assert.equal(A.calculate('build','9007199254740993',1).value,'9007199254740994');
  assert.equal(A.calculate('clear',0n,0n).value,'0');
});
test('rejects fractions, coercions, imprecise numbers, underflow and unknown operations',()=>{
  for(const x of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,true,null,{},'01','1.0','1e3','-1',''])assert.throws(()=>A.calculate('build',x,1));
  assert.throws(()=>A.calculate('clear',0,1));assert.throws(()=>A.calculate('multiply',1,1));
});
test('rejects changed text, spacing, encoding, bits, digest and invariant fields',()=>{
  for(const key of Object.keys(A.ANCHOR))assert.throws(()=>A.validate({...A.ANCHOR,[key]:'changed'}));
  assert.throws(()=>A.validate({...A.ANCHOR,text:'1+1=2\r\n1-1=0'}));assert.throws(()=>A.validate(null));
});
test('hash verification fails closed when crypto is absent or digest is wrong',async()=>{
  await assert.rejects(A.verify(A.ANCHOR,null));
  await assert.rejects(A.verify(A.ANCHOR,{digest:async()=>new Uint8Array(32).buffer}));
});

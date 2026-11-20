import test from 'node:test';
import assert from 'node:assert/strict';
import {seed,normalize,verification,runTest,wordIndex} from '../src/model.mjs';
test('deterministic arithmetic and reciprocal reversal',()=>{
  assert.equal(runTest('addition','1,1'),'2');
  assert.equal(runTest('subtraction','1,1'),'0');
  assert.equal(runTest('addition','999999999999999999999999,1'),'1000000000000000000000000');
  assert.equal(runTest('addition','1.5,0.5'),null);
  assert.equal(runTest('reversal',runTest('reversal','LIVE')),'LIVE');
});
test('the archive fails closed for both gates and each prohibited condition',()=>{
  const input=normalize({...seed,protect:1});
  assert.equal(verification(input).retained,true);
  for (const patch of [{protect:0},{expected:'0'},{manipulation:true},{ambiguity:true},{hiddenControl:true},{locator:''}]) {
    assert.equal(verification({...input,...patch}).retained,false);
  }
});
test('raw transcription remains exact while pronunciation and roots attach by word',()=>{
  const transcript='  One,   two—One.\n';
  const entry=normalize({transcript,phonetic:'One — /wʌn/',rootMeaning:'two — see source'});
  assert.equal(entry.transcript,transcript);
  assert.deepEqual(wordIndex(entry),[{word:'One',phonetic:'/wʌn/',root:''},{word:'two',phonetic:'',root:'see source'}]);
});

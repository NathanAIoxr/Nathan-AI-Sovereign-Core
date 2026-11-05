"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const E=require("./core.js");
test("preserves exact original principle",()=>{
  assert.equal(E.CANON,"Things are only complicated because people make them complicated when you remove the complication you see the root issue and is very simple to fix");
  assert.equal(E.STEPS.length,3);
  assert.equal(E.CASE_STUDY.source,E.CANON);
});
test("game has twelve playable, answerable rounds",()=>{
  assert.equal(E.CHALLENGES.length,12);
  for(const [i,q] of E.CHALLENGES.entries()){
    assert.equal(q.options.length,3);
    assert.ok(Number.isInteger(q.correct));
    const right=E.grade(i,q.correct);
    assert.equal(right.correct,true);
    assert.equal(right.correctAnswer,q.options[q.correct]);
    assert.equal(E.grade(i,(q.correct+1)%3).correct,false);
  }
});
test("separates the original from derived steps",()=>{
  const r=E.buildRecord(E.CASE_STUDY);
  const snapshot=r.original;
  const stages=E.getStages(r);
  assert.equal(stages.length,3);
  assert.equal(stages[0].detail,E.CASE_STUDY.complication);
  assert.equal(stages[1].detail,E.CASE_STUDY.root);
  assert.equal(stages[2].detail,E.CASE_STUDY.fix);
  assert.equal(r.original,snapshot);
});
test("three volumes each contain three distinct chapters",()=>{
  const r=E.buildRecord(E.CASE_STUDY);
  assert.equal(E.VOLUMES.length,3);
  for(const v of E.VOLUMES){
    const draft=E.makeBook(r,v.number);
    assert.match(draft,/Creator's original principle \(verbatim\)/);
    assert.ok(draft.includes(E.CANON));
    assert.equal((draft.match(/### Chapter /g)||[]).length,3);
  }
});
test("rejects malformed and oversized saved records",()=>{
  assert.throws(()=>E.buildRecord({original:""}));
  assert.throws(()=>E.makeBook(E.CASE_STUDY,99));
  assert.throws(()=>E.validateSaved({schema:"wrong",record:E.CASE_STUDY,score:0,round:0}));
  const valid=E.validateSaved({schema:"nathan-ai.root-clear.v1",record:E.CASE_STUDY,score:10,round:1});
  assert.equal(valid.round,1);
  assert.throws(()=>E.validateSaved({schema:"nathan-ai.root-clear.v1",record:E.CASE_STUDY,score:-1,round:1}));
});
test("source whitespace is preserved exactly",()=>{const line="  leading / trailing  \n";assert.equal(E.buildRecord({original:line}).original,line);});

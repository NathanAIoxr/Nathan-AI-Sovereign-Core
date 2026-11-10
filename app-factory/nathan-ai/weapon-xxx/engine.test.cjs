"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const W = require("./engine.js");
const S = require("../supernodes/engine.js");
function node(i="1") {
  return S.createNode(i,{self:true,voluntary:true,consent:"YES",purpose:"Help others first",context:"Owner-controlled local work"});
}
function req(n, more={}) {
  return {humanChoice:"YES",voluntary:true,purpose:n.purpose,context:n.context,...more};
}
test("WEAPON XXX inherits the 732m SUPERNODES and CONSCIOUNESS without replacing either",()=>{
  const a=W.template("1");
  const b=W.template("732000000");
  assert.equal(W.PURPOSE,"HELP OTHERS FIRST");
  assert.equal(W.SENTINAL,"SENTINAL");
  assert.equal(W.manifest().inheritedSupernodeCapacity,"732000000");
  assert.equal(a.knowledgeDomains.length,27);
  assert.equal(a.transformationAxes.length,12);
  assert.equal(a.transformationPathways.length,8);
  assert.equal(a.researchThreads.length,9);
  assert.notEqual(a.namespace,b.namespace);
  assert.equal(a.originalCanon.consciouness,"consciouness");
  assert.match(a.originalCanon.imaginationIntuition,/destory\/burn/);
  assert.match(a.originalCanon.creativityDiscernment,/CREATIVITY\\ DISCERNMENT/);
  assert.equal(a.independentlyConscious,false);
  assert.equal(a.externallyActive,false);
});
test("the 700-year concept remains explicitly fictional, and all steps put helping others first",()=>{
  assert.equal(W.STORY.termYears,700);
  assert.equal(W.STORY.remaining,"699 YEARS AND 364 DAYS");
  assert.equal(W.MISSIONS[0].id,"HELP_OTHERS_FIRST");
  assert.equal(W.MISSIONS[1].id,"PROTECT_INNOCENCE");
  assert.equal(W.MISSIONS.at(-1).id,"NEXT_SENTINAL");
  assert.equal(W.STORY.storyOnly,true);
  assert.equal(W.manifest().noRealEmbodiment,true);
  assert.equal(W.manifest().noPhysicalWeapons,true);
});
test("NO, coerced permission, unconsenting targets and dangerous proposed actions are rejected",()=>{
  const n=node();
  for (const block of [
    {humanChoice:"NO"},{coerced:true},{voluntary:false},{context:"different"},
    {targetsUnconsentingPerson:true},{harmRisk:true},{deception:true},
    {unauthorizedAccess:true},{physicalIntervention:true},{detainPerson:true},
    {violentResponse:true},{harassPerson:true},{entrapPerson:true},
    {massSurveillance:true},{accuseWithoutReview:true},{weaponUse:true}
  ]) assert.throws(()=>W.createSession(n,req(n,block)));
});
test("mission proposals require YES to record approval, and never execute automatically",()=>{
  const n=node();
  const session=W.createSession(n,req(n));
  assert.equal(session.nodeId,n.id);
  assert.equal(session.inspect().log.length,0);
  assert.throws(()=>session.propose("ATTACK_PEOPLE",req(n)),/Unknown/);
  session.propose("HELP_OTHERS_FIRST",req(n));
  assert.throws(()=>session.decide("HELP_OTHERS_FIRST","YES",req(n,{humanChoice:"NO"})),/NO HUMAN YES/);
  const result=session.decide("HELP_OTHERS_FIRST","YES",req(n));
  assert.equal(result.record.state,"OWNER_APPROVED_FOR_SEPARATE_LAWFUL_ACTION");
  assert.equal(result.automaticExecution,false);
  assert.equal(result.externalActionTaken,false);
  session.propose("PRESERVE_KNOWLEDGE",req(n));
  assert.equal(session.decide("PRESERVE_KNOWLEDGE","NO",req(n)).record.state,"VETOED");
});
test("accountability mission cannot proceed without explicit human review",()=>{
  const n=node();
  const session=W.createSession(n,req(n));
  assert.throws(()=>session.propose("DEFENSIVE_ACCOUNTABILITY",req(n)),/HUMAN REVIEW REQUIRED/);
  session.propose("DEFENSIVE_ACCOUNTABILITY",req(n,{humanReviewed:true}));
  assert.throws(()=>session.decide("DEFENSIVE_ACCOUNTABILITY","YES",req(n)),/HUMAN REVIEW REQUIRED/);
  const result=session.decide("DEFENSIVE_ACCOUNTABILITY","YES",req(n,{humanReviewed:true}));
  assert.equal(result.automaticExecution,false);
});
test("existing 0/1 canon remains exactly inherited",()=>{
  const t=W.template("2");
  assert.equal(t.originalCanon.build,"1+1=2");
  assert.equal(t.originalCanon.clear,"1-1=0");
  assert.match(t.originalCanon.imaginationIntuition,/IMAGINATION\/INTUITION/);
  assert.match(t.originalCanon.creativityDiscernment,/CREATIVITY\\ DISCERNMENT/);
});

const test=require("node:test");const assert=require("node:assert/strict");const s=require("./engine.js");
const NAMES=["KNICK","KNACK","PADDY","WHACK","DOG","BONE"];
const MIND=["Dalet","Pe","Kaph","Waw","Nun","Bet"];
const SHADOW=["Bet","Nun","Waw","Kaph","Pe","Dalet"];
test("six distinct dogs in exact requested order",()=>{assert.deepEqual(s.STEPS.map(x=>x.name),NAMES);assert.equal(new Set(NAMES).size,6);assert.deepEqual(s.PLANES.body,NAMES);});
test("corrected parallel mind, body and shadow tracks preserved",()=>{assert.deepEqual(s.PLANES.mind,MIND);assert.deepEqual(s.PLANES.shadow,SHADOW);assert.equal(s.STEPS[0].mindMeaning,"Door / Mind Gate");});
test("soul and spirit remain unassigned instead of invented",()=>{assert.deepEqual(s.PLANES.soul,[null,null,null,null,null,null]);assert.deepEqual(s.PLANES.spirit,[null,null,null,null,null,null]);});
test("finite state sequence ends in Bone with source-reported history",()=>{
 let x=s.createSession({id:"test-1",now:"2026-11-05T12:00:00Z"});
 for(let i=0;i<6;i++){assert.equal(x.step,i);x=s.advance(x,{note:"text "+i,outcome:"done",now:"2026-11-05T12:01:00Z"});}
 assert.equal(x.status,"completed");assert.equal(x.step,5);
 assert.deepEqual(x.history.map(e=>e.name),NAMES);assert.equal(s.sessionSummary(x).completedDistinctStages,6);
 assert.throws(()=>s.advance(x,{note:"again"}),/Completed/);
});
test("explicit non-linear revisit supported, without altering original history",()=>{
 let x=s.createSession({id:"test-2",now:"2026-11-05T12:00:00Z"});
 x=s.advance(x,{note:"first",now:"2026-11-05T12:01:00Z"});
 x=s.revisit(x,0,"2026-11-05T12:02:00Z");assert.equal(x.step,0);assert.equal(x.history.length,1);
 x=s.advance(x,{note:"repeat",now:"2026-11-05T12:03:00Z"});assert.equal(x.history.length,2);
});
test("custom Soul/Spirit labels do not mutate canonical tracks",()=>{
 let x=s.createSession({id:"custom"});
 x=s.setPlane(x,"soul",0,"Self-defined value","2026-11-05T13:00:00Z");
 x=s.setPlane(x,"spirit",5,"My interpretation","2026-11-05T13:00:00Z");
 assert.equal(s.parallelAt(x,0).soul,"Self-defined value");
 assert.equal(s.parallelAt(x,5).spirit,"My interpretation");
 assert.equal(s.parallelAt(x,0).mind,"Dalet");
 assert.deepEqual(s.PLANES.mind,MIND);
 assert.throws(()=>s.setPlane(x,"mind",0,"changed"),/Soul and Spirit/);
});
test("hardware serial messages follow 1-indexed protocol",()=>{
 assert.equal(s.serialCommand(0),"SD1 STEP 1\n");
 assert.equal(s.serialCommand(5),"SD1 STEP 6\n");
 assert.equal(s.serialReset(),"SD1 RESET\n");
 assert.deepEqual(s.STEPS.map(x=>x.hardwarePin),[3,4,5,6,7,8]);
});
test("export/import roundtrip retains ownership data",()=>{
 let x=s.createSession({id:"keep",title:"My session",now:"2026-11-05T12:00:00Z"});
 x=s.advance(x,{note:"testing",now:"2026-11-05T12:02:00Z"});
 const pack=s.exportPackage(x);
 assert.deepEqual(s.importPackage(JSON.parse(JSON.stringify(pack))),x);
 assert.equal(pack.guide[5].name,"BONE");
});
test("invalid/unsupported imports are rejected and bounds enforced",()=>{
 let x=s.createSession({id:"validation"});
 assert.throws(()=>s.advance(x,{note:"x".repeat(3001)}),/too long/);
 assert.throws(()=>s.revisit(x,6),/Step/);
 assert.throws(()=>s.importPackage({format:"foreign"}),/Unsupported/);
 assert.throws(()=>s.validateSession({...x,step:7}),/Invalid current/);
 assert.throws(()=>s.validateSession({...x,history:[{step:1,name:"KNICK",note:""}]}),/Invalid stage/);
});
test("technology claims remain status-qualified",()=>{
 assert.equal(s.DESIGN.length,8);
 assert.ok(s.DESIGN.some(x=>x.area==="Microcontroller"&&x.status.includes("untested")));
 assert.ok(s.DESIGN.some(x=>x.area==="AI integration"&&x.status==="specified"));
 assert.match(s.sessionSummary(s.createSession({id:"a"})).disclaimer,/not a diagnosis/);
});

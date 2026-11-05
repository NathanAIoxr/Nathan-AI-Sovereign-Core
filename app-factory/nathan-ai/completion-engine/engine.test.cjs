"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),e=require("./engine.js");
function p(){return e.newProject({id:"A-ROOT-001",title:"ANCIENT — Original Root",sourceRef:"owner-archive/a-original.txt",privacy:"owner-only"});}
test("new projects preserve exactly typed source title and do not certify anything",()=>{
 const x=p(),s=e.summary(x);assert.equal(x.title,"ANCIENT — Original Root");assert.equal(x.creatorWords,"");
 assert.equal(s.passed,0);assert.equal(s.percent,0);assert.equal(s.reviewReady,false);
 assert.match(s.warning,/not proof of perfection/i);
});
test("eight gates correspond to evidence, tone, author and scoped compliance",()=>{
 assert.deepEqual(e.GATES.map(x=>x.id),["source","words","tone","function","quality","security","compliance","owner"]);
});
test("passing a gate is impossible without named reviewer and evidence",()=>{
 assert.throws(()=>e.reviewGate(p(),"words",{state:"reviewed-pass",reviewer:"Reviewer"}),/requires/);
 assert.throws(()=>e.reviewGate(p(),"words",{state:"reviewed-pass",evidence:"test"}),/requires/);
});
test("gate review preserves source titles, privacy and source words",()=>{
 let x=p();
 x=e.reviewGate(x,"source",{state:"reviewed-pass",evidence:"original.sha256:abc",reviewer:"Owner"},"2026-11-05T13:00:00Z");
 assert.equal(x.title,p().title);assert.equal(x.sourceRef,p().sourceRef);
 assert.equal(x.gates.source.state,"reviewed-pass");assert.equal(x.audit.length,1);assert.equal(x.version,2);
});
test("source reference change reopens dependent verifications, not all unrelated records",()=>{
 let x=p();for(const g of ["source","words","owner","function"]){x=e.reviewGate(x,g,{state:"reviewed-pass",evidence:"record-"+g,reviewer:"Owner"});}
 x=e.setSource(x,"owner-archive/another-unaltered-original.txt");
 for(const g of ["source","words","owner"])assert.equal(x.gates[g].state,"unreviewed");
 assert.equal(x.gates.function.state,"reviewed-pass");
 assert.equal(x.title,p().title);
});
test("source-only metadata cannot be mistaken for a verified manuscript body",()=>{
 const x=e.newProject({id:"A-2",title:"My title",sourceRef:"catalog.csv"});
 assert.equal(x.gates.words.state,"unreviewed");assert.equal(x.gates.source.state,"unreviewed");
});
test("release status requires every tracked review and explicit released stage",()=>{
 let x=p();x=e.setStage(x,"released");assert.equal(e.summary(x).reviewReady,false);
 for(const gate of e.GATES){x=e.reviewGate(x,gate.id,{state:"reviewed-pass",evidence:"human-review:"+gate.id,reviewer:"Owner"});}
 assert.equal(e.summary(x).passed,8);assert.equal(e.summary(x).reviewReady,true);
 assert.equal(e.summary(x).label,"ALL TRACKED GATES REVIEWED");
 assert.match(e.summary(x).warning,/not proof of perfection/);
});
test("blocked gate cannot be reported as accepted",()=>{
 let x=p();x=e.reviewGate(x,"quality",{state:"blocked",evidence:"broken button",reviewer:"Tester"});
 assert.equal(e.summary(x).blocked,1);assert.equal(e.summary(x).reviewReady,false);
});
test("public export excludes all private and review-required information",()=>{
 let ledger=e.newLedger([{id:"PUB",title:"Public",privacy:"public"},{id:"PRIV",title:"Private",privacy:"owner-only"},{id:"PEND",title:"Review",privacy:"review-required"}]);
 const p=e.newProject({id:"X",title:"X"});assert.equal(p.privacy,"review-required");
 const out=e.redactPublic(ledger);assert.equal(out.projects.length,1);
 assert.equal(out.projects[0].id,"PUB");assert.ok(!JSON.stringify(out).includes("Private"));
 assert.ok(!JSON.stringify(out).includes("PEND"));
});
test("ledger rejects duplicate IDs and unexpected source schemas",()=>{
 assert.throws(()=>e.newLedger([{id:"X",title:"One"},{id:"X",title:"Two"}]),/Duplicate/);
 assert.throws(()=>e.validLedger({schema:"foreign",version:1,projects:[]}),/Unsupported/);
 assert.throws(()=>e.newProject({id:"../../bad",title:"Oops"}),/Invalid source identifier/);
});
test("offline UI uses textContent, opt-in storage and no network dependencies",()=>{
 const fs=require("node:fs"),path=require("node:path");
 const script=fs.readFileSync(path.join(__dirname,"app.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
 assert.match(script,/textContent/);assert.match(script,/localStorage/);
 assert.match(script,/redactPublic/);assert.match(script,/window\.confirm/);
 assert.match(html,/connect-src 'none'/);assert.match(html,/data-nathan-shared-appearance/);
 assert.match(html,/data-nathan-command-center/);
 assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|WebSocket/);
});

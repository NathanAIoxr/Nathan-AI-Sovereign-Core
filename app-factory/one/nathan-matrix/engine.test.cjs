const test=require("node:test");const assert=require("node:assert/strict");const m=require("./engine.js");
test("exact build and clear, never AB",()=>{assert.equal(m.build(1,1),2n);assert.equal(m.clear(1,1),0n);assert.throws(()=>m.build("A","B"),TypeError)});
test("22 unique IVERSION names, double I and skipped letters",()=>{assert.equal(m.IVERSIONS.length,22);assert.equal(new Set(m.IVERSIONS.map(x=>x.name)).size,22);assert.ok(m.IVERSIONS.some(x=>x.name==="Iiversion"));for(const c of "CWXY")assert.ok(!m.IVERSIONS.find(x=>x.letter===c))});
test("8/10 powers and common intervals",()=>{assert.deepEqual(m.cycle(1),{exponent:1,left:80n,right:100n,intersection:400n});assert.deepEqual(m.cycle(5),{exponent:5,left:800000n,right:1000000n,intersection:4000000n});assert.throws(()=>m.cycle(-1));assert.throws(()=>m.cycle(1.5))});
test("13/17 cicada, 211 separate",()=>{assert.equal(m.lcm(13,17),221n);assert.notEqual(m.lcm(13,17),211n)});
test("Gregorian millisecond conversions and breath model",()=>{assert.equal(m.yearsToMs(1),31556952000n);assert.equal(m.breathsPerMinuteMs(16),3750);assert.equal(m.modelBreaths(60000,16),16);assert.throws(()=>m.breathsPerMinuteMs(0))});
test("public project cards never claim live donations",()=>{assert.equal(m.PROJECTS.length,2);for(const p of m.PROJECTS)assert.equal(p.status,"private-source-handoff")});

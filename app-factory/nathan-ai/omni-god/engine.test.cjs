const test=require("node:test");const assert=require("node:assert/strict");const m=require("./engine.js");
test("build/clear",()=>{assert.equal(m.build(1,1),2);assert.equal(m.clear(1,1),0);assert.throws(()=>m.build(Number.MAX_SAFE_INTEGER,1))});
test("source-preserving reversible UTF-8",()=>{const s="TABOR";const x=m.encode(s);assert.equal(x.original,s);assert.equal(x.reverse,"ROBAT");assert.equal(x.binary.join(""),"0101010001000001010000100100111101010010");assert.equal(Buffer.from(x.utf8).toString("utf8"),s)});
test("unicode text is preserved",()=>{const s="אֵל 🌍";const x=m.encode(s);assert.equal(x.original,s);assert.equal(Buffer.from(x.utf8).toString("utf8"),s)});
test("ten-state classification range",()=>{assert.ok(m.encode("test").states.every(v=>v>=0&&v<=9))});
test("pantheon and conceptual address bounds",()=>{assert.equal(m.PANTHEON.length,20);assert.equal(m.agent("125999999999").simulation,true);assert.throws(()=>m.agent("126000000000"))});

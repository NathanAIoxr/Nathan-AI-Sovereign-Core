const {test}=require("node:test"),a=require("node:assert/strict"),Q=require("./engine.js");
for(const text of ["hello world","Leonardo da Vinci","One\nTwo"," punctuation !  ","mañana 🌍"]){
for(const layer of ["horizontal","word","vertical","double"])test("mirror "+layer,()=>a.equal(Q.decode(Q.encode(text,"leonardo",{layer}),"leonardo",{layer}),text));
for(const harmonic of [3,7,12])test("sphere "+harmonic,()=>a.equal(Q.decode(Q.encode(text,"raphael",{harmonic}),"raphael",{harmonic}),text));
for(const square of [4,9,16])test("base "+square,()=>a.equal(Q.decode(Q.encode(text,"donatello",{square}),"donatello",{square}),text));
test("tension",()=>a.equal(Q.decode(Q.encode(text,"michelangelo"),"michelangelo"),text));
test("four axis stack",()=>a.equal(Q.unstack(Q.stack(text)),text));
}
test("vertical grid",()=>a.equal(Q.vertical("ab\ncd"),"dc\nba"));
test("double seal",()=>a.equal(Q.encode("test","leonardo",{layer:"double"}),"test"));

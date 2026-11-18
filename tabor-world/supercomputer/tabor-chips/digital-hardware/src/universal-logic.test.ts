import {AND,OR,NOT,XOR,NAND,NOR,XNOR,halfAdder,fullAdder,addBinary,bit,validateDescriptor} from "./universal-logic";
for(const a of [0,1] as const)for(const b of [0,1] as const){
 if(AND(a,b)!==(a&b)||OR(a,b)!==(a|b)||XOR(a,b)!==(a^b))throw new Error("gate truth table failed");
 if(NAND(a,b)!==NOT(AND(a,b))||NOR(a,b)!==NOT(OR(a,b))||XNOR(a,b)!==NOT(XOR(a,b)))throw new Error("inverted gate failed");
 const h=halfAdder(a,b);if(h.sum+2*h.carry!==a+b)throw new Error("half adder failed");
 for(const c of [0,1] as const){const f=fullAdder(a,b,c);if(f.sum+2*f.carry!==a+b+c)throw new Error("full adder failed")}
}
const r=addBinary([1,1,1,1],[0,0,0,1]);
if(r.sum.join("")!=="0000"||r.overflow!==1)throw new Error("overflow failed");
try{bit(2);throw new Error("expected invalid bit")}catch(e){if(!(e instanceof RangeError))throw e}
if(!validateDescriptor({id:"tabor-chip",physicalReference:"chip die",digitalCounterpart:"ISA emulator",layers:["compute","memory-storage"],topology:"hybrid",attributes:{cores:1},continuation:"CONTINUE BUILDING"}))throw new Error("descriptor failed");
console.log("Universal logic truth tables and descriptor checks passed");

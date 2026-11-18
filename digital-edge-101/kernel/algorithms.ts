import { bytes, check, define, int, mod, num, str, sum, vec } from "../shared/core.ts";
const demoRegisters = {digits:[1,2,3],base:10};
function positional(p:Record<string,unknown>) {const b=int(p.base,2,36);return vec(p.digits,9).reduce((s,d)=>s*b+int(d,0,b-1),0);}
function play(p:Record<string,unknown>){
  const [x,y,vx,vy]=vec(p.state,4,4),w=num(p.width,1,1e5),h=num(p.height,1,1e5),dt=num(p.dt,0,1);
  const bounce=(a:number,v:number,b:number)=>{const q=mod(a+v*dt,2*b);return q<=b?[q,v]:[2*b-q,-v];};
  const [nx,dx]=bounce(x,vx,w),[ny,dy]=bounce(y,vy,h);return [nx,ny,dx,dy];
}
function arithmetic(p:Record<string,unknown>){const a=int(p.a,0,1e8),b=int(p.b,0,1e8);switch(p.op){case "add":return a+b;case "subtract":return a-b;case "multiply":return String(BigInt(a)*BigInt(b));case "divide":check(b!==0,"Cannot divide by zero");return {quotient:Math.floor(a/b),remainder:a%b};default:check(false,"Unsupported arithmetic operation");}}
function rpn(p:Record<string,unknown>){
  check(Array.isArray(p.tokens)&&p.tokens.length<=64,"Expected an RPN token array");const stack:number[]=[];
  for(const t of p.tokens){if(typeof t==="number"){stack.push(num(t));continue;}if(t==="sin"||t==="cos"||t==="sqrt"||t==="log"){
    check(stack.length>0,"Stack underflow");const n=stack.pop()!;const v=t==="sin"?Math.sin(n):t==="cos"?Math.cos(n):t==="sqrt"?Math.sqrt(n):Math.log(n);check(Number.isFinite(v),"Outside function domain");stack.push(v);continue;}
    check(["+","-","*","/"].includes(t)&&stack.length>=2,"Invalid RPN operator or stack underflow");const b=stack.pop()!,a=stack.pop()!;check(t!=="/"||b!==0,"Cannot divide by zero");const v=t==="+"?a+b:t==="-"?a-b:t==="*"?a*b:a/b;check(Number.isFinite(v),"Result overflow");stack.push(v);
  }check(stack.length===1,"Expected a single result");return stack[0];
}
const machine={program:[169,5,105,3,0]};
const tally={marks:"|||| ||| ||"};
const ball={state:[1,4,2,-1],width:8,height:6,dt:.5};
export const modules={
 "OG-001":define("Tally-mark grouping",tally,p=>{const marks=str(p.marks,512);check(/^[|\s]*$/.test(marks),"Only tally marks and spaces");const groups=marks.trim().split(/\s+/).filter(Boolean).map(s=>s.length);return {groups,total:sum(groups)};}),
 "OG-002":define("Place-value abacus",demoRegisters,positional),
 "OG-003":define("Counting-board place-value register",{digits:[6,2,1],base:10},positional),
 "OG-004":define("Simplified lunar cycle phase",{days:15,period:29.530588},p=>mod(num(p.days),num(p.period,1,100))/num(p.period,1,100)),
 "OG-005":define("Differential wheel heading fixture",{leftTravel:5,rightTravel:7,trackWidth:2},p=>(num(p.rightTravel)-num(p.leftTravel))/num(p.trackWidth,.01)),
 "OG-007":define("Napier rods multiplication table",{digit:7},p=>{const d=int(p.digit,0,9);return Array.from({length:9},(_,i)=>String((i+1)*d).padStart(2,"0"));}),
 "OG-008":define("Slide-rule log addition",{a:3,b:7},p=>10**(Math.log10(num(p.a,.00001))+Math.log10(num(p.b,.00001)))),
 "OG-009":define("Six-register add/subtract fixture",{a:17,b:6,op:"subtract"},arithmetic),
 "OG-010":define("Decimal carry wheels",{a:95,b:28,op:"add"},arithmetic),
 "OG-011":define("Stepped reckoner multiplication",{a:37,b:24,op:"multiply"},arithmetic),
 "OG-012":define("Jacquard binary pattern",{rows:["101","011"]},p=>{check(Array.isArray(p.rows)&&p.rows.length<=64,"Expected card rows");return p.rows.map(row=>{const r=str(row,64);check(/^[01]+$/.test(r),"Invalid binary pattern");return [...r].map(Number);});}),
 "OG-013":define("Arithmometer quotient and remainder",{a:37,b:6,op:"divide"},arithmetic),
 "OG-014":define("Finite-difference next table value",{values:[1,4,9,16]},p=>{const levels=[vec(p.values,32,2)];while(levels.at(-1)!.length>1){const x=levels.at(-1)!;levels.push(x.slice(1).map((v,i)=>v-x[i]));}return sum(levels.map(row=>row.at(-1)!));}),
 "OG-016":define("Bernoulli number teaching recurrence",{index:6},p=>{const n=int(p.index,0,12),a=[];for(let m=0;m<=n;m++){a[m]=1/(m+1);for(let j=m;j>=1;j--)a[j-1]=j*(a[j-1]-a[j]);}return a[0];}),
 "OG-017":define("Boolean gate truth table",{gate:"NAND"},p=>{
   const g=str(p.gate,6).toUpperCase();check(["AND","OR","XOR","NAND","NOR","NOT"].includes(g),"Expected a supported Boolean gate");
   return [0,1].flatMap(a=>(g==="NOT"?[0]:[0,1]).map(b=>({a,b:g==="NOT"?null:b,result:g==="NOT"?a^1:g==="AND"?a&b:g==="OR"?a|b:g==="XOR"?a^b:g==="NAND"?(a&b)^1:(a|b)^1})));
 }),
 "OG-018":define("Harmonic tide teaching model",{phases:[0,1],amplitudes:[1,.5]},p=>{const a=vec(p.amplitudes),x=vec(p.phases,a.length,a.length);return sum(a.map((n,i)=>n*Math.cos(x[i])));}),
 "OG-020":define("Comptometer key sum",{keys:[12,31,7]},p=>sum(vec(p.keys).map(n=>int(n,0,999999)))),
 "OG-021":define("Punch-card column tally",{cards:["101","111","100"]},p=>{check(Array.isArray(p.cards)&&p.cards.length>0&&p.cards.length<=64,"Invalid card stack");const cards=p.cards.map(c=>str(c,80));check(cards.every(c=>/^[01]+$/.test(c)&&c.length===cards[0].length),"Cards must have matching widths");return Array.from(cards[0],(_,i)=>sum(cards.map(c=>Number(c[i]))));}),
 "OG-026":define("Historical rotor-permutation teaching fixture",{message:"TABOR",rotor:"EKMFLGDQVZNTOWYHXUSPAIBRCJ",start:0},p=>{
   const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ",rotor=str(p.rotor,26),message=str(p.message,128);let offset=int(p.start,0,25);check(/^[A-Z]{26}$/.test(rotor)&&new Set(rotor).size===26&&/^[A-Z ]*$/.test(message),"Expected uppercase alphabet and a unique rotor permutation");
   return [...message].map(c=>{if(c===" ")return c;const x=alphabet.indexOf(c),y=alphabet.indexOf(rotor[(x+offset)%26]);const v=alphabet[mod(y-offset,26)];offset=(offset+1)%26;return v;}).join("");
 }),
 "OG-028":define("Relay switching truth table",{inputs:[1,1,0]},p=>{const [a,b,c]=vec(p.inputs,3,3).map(x=>int(x,0,1));return {series:a&b,parallel:a|b,invertedBranch:(a&b)|(c^1)};}),
 "OG-030":define("Bounded Turing tape bit-inversion fixture",{tape:"1011",steps:8},p=>{const tape=[...str(p.tape,128)];check(tape.every(x=>x==="0"||x==="1"),"Expected a binary tape");const steps=Math.min(int(p.steps,0,128),tape.length);for(let head=0;head<steps;head++)tape[head]=tape[head]==="1"?"0":"1";return {tape:tape.join(""),head:steps,state:steps===tape.length?"halt":"scan"};}),
 "OG-031":define("Complex number multiplication",{a:[1,2],b:[3,4]},p=>{const [a,b]=vec(p.a,2,2),[c,d]=vec(p.b,2,2);return [a*c-b*d,a*d+b*c];}),
 "OG-042":define("Core-memory bit grid readout",{grid:["10","01"]},p=>{check(Array.isArray(p.grid)&&p.grid.length<=32,"Invalid grid");return p.grid.map(row=>{const r=str(row,32);check(/^[01]+$/.test(r),"Invalid bits");return parseInt(r,2);});}),
 "OG-046":define("Noughts and crosses state evaluator",{board:"XXXOO...."},p=>{const b=str(p.board,9);check(/^[XO.]{9}$/.test(b),"Expected nine board cells");const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];const wins=[...new Set(lines.filter(([a,c,d])=>b[a]!=="."&&b[a]===b[c]&&b[a]===b[d]).map(([a])=>b[a]))];return {winners:wins,full:!b.includes(".")};}),
 "OG-051":define("Tennis for Two headless physics tick",ball,play),
 "OG-055":define("Round-robin scheduling fixture",{tasks:[{id:"catalog",ticks:2},{id:"search",ticks:3}]},p=>{
   check(Array.isArray(p.tasks)&&p.tasks.length<=16,"Invalid run queue");const tasks=p.tasks.map(x=>({id:str(x.id,32),ticks:int(x.ticks,0,32)}));const result=[];while(tasks.some(x=>x.ticks))for(const t of tasks)if(t.ticks){result.push(t.id);t.ticks--;}return result;
 }),
 "OG-057":define("7-bit ASCII codec",{text:"ACT"},p=>{const s=str(p.text,512);check(/^[\x00-\x7f]*$/.test(s),"Expected ASCII");return [...s].map(x=>x.charCodeAt(0));}),
 "OG-069":define("Intel 4004-inspired nibble accumulator fixture",{instructions:[["ld",14],["add",3],["add",1]]},p=>{
   check(Array.isArray(p.instructions)&&p.instructions.length<=64,"Expected a small teaching program");let a=0,carry=0;for(const ins of p.instructions){check(Array.isArray(ins)&&ins.length===2,"Invalid instruction");const n=int(ins[1],0,15);if(ins[0]==="ld"){a=n;carry=0;}else{check(ins[0]==="add","Only ld and add are supported");const next=a+n+carry;a=next&15;carry=next>>4;}}return {accumulator:a,carry};
 }),
 "OG-073":define("HP-35-inspired RPN stack evaluator",{tokens:[9,"sqrt",3,"+"]},rpn),
 "OG-075":define("Pong headless reflection tick",ball,play),
 "OG-081":define("Cray-style vector add teaching fixture",{a:[1,2],b:[3,4]},p=>{const a=vec(p.a),b=vec(p.b,a.length,a.length);return a.map((v,i)=>v+b[i]);}),
 "OG-083":define("MOS 6502 immediate-load/add teaching trace",machine,p=>{
   const prog=bytes(p.program);check(prog.length<=128,"Program too long");let ip=0,a=0,carry=0;const trace=[];
   while(ip<prog.length){const op=prog[ip++];if(op===0)return {accumulator:a,carry,trace};check((op===169||op===105)&&ip<prog.length,"Unsupported or incomplete instruction");const value=prog[ip++];if(op===169)a=value;else{const next=a+value+carry;a=next&255;carry=next>>8;}trace.push({op,a,carry});}
   check(false,"Expected BRK terminator");
 }),
 "OG-085":define("VisiCalc-inspired column sum",{cells:[1,2,3]},p=>sum(vec(p.cells))),
 "OG-092":define("Local DNS fixture lookup",{name:"catalog.example",records:{"catalog.example":"192.0.2.1"}},p=>{const name=str(p.name,253).toLowerCase();check(p.records&&typeof p.records==="object","Expected local records");return Object.hasOwn(p.records,name)?str((p.records as Record<string,unknown>)[name],253):null;}),
 "OG-096":define("GIF87a header and dimensions inspector",{bytes:[71,73,70,56,55,97,8,0,6,0]},p=>{const b=bytes(p.bytes);check(b.length>=10,"Missing GIF dimensions");const signature=String.fromCharCode(...b.slice(0,6));check(signature==="GIF87a"||signature==="GIF89a","Invalid GIF signature");return {signature,width:b[6]|b[7]<<8,height:b[8]|b[9]<<8};}),
 "OG-099":define("HTTP/0.9 request-line teaching parser",{request:"GET /library\r\n"},p=>{const m=/^GET (\/[\w./%?=&-]*)\r?\n?$/.exec(str(p.request,512));check(m,"Expected one HTTP/0.9 GET line");return {method:"GET",path:m[1]};})
};

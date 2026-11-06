/* UCT TRIPLE TRANSLATION: arithmetic patterns, sevenfold geometry, and Egyptian numeral glyphs.
 * Root originals are immutable source records. Hieroglyphic numerals are genuine additive
 * decimal notation; assigning branch motifs and English letter values is a MODERN design.
 * Scientific/fictional statuses are inherited without promotion to verified claims.
 */
(function(root,factory){
"use strict";
const isNode=typeof module==="object"&&module.exports;
const U=isNode?require("../engine.js"):root.UniversalContinuumRoot;
const R=isNode?require("../../../radix-ladder/engine.js"):root.TaborRadix;
const api=factory(U,R);
if(isNode)module.exports=api;else root.UCTTripleCode=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(UCT,Radix){
"use strict";
if(!UCT||!Radix)throw Error("UCT and TABOR Radix Ladder are required");
const SCHEMA="tabor.uct.triple-code.v1",ROOT_SCHEMA="tabor.octopus.v1";
const LENSES=["numerology","geometry","hieroglyphics"];
const BASES=[2,3,7,9,10,12,13,17,21,33,69];
const SIGNS=Object.freeze([
 {value:1000000,glyph:"𓁨",gardiner:"C11",name:"Heh / million"},
 {value:100000,glyph:"𓆐",gardiner:"I8",name:"Froglet / hundred thousand"},
 {value:10000,glyph:"𓂭",gardiner:"D50",name:"Bent finger / ten thousand"},
 {value:1000,glyph:"𓆼",gardiner:"M12",name:"Water lily / thousand"},
 {value:100,glyph:"𓍢",gardiner:"V1",name:"Coiled rope / hundred"},
 {value:10,glyph:"𓎆",gardiner:"V20",name:"Cattle hobble / ten"},
 {value:1,glyph:"𓏺",gardiner:"Z015",name:"Stroke / one"}
]);
const SIGN_INDEX=new Map(SIGNS.map((x,i)=>[x.glyph,i]));
const SHORT={numerology:"number",geometry:"shape",hieroglyphics:"glyph"};
const SOURCES=Object.freeze([
 "https://blogs.ucl.ac.uk/researchers-in-museums/2017/10/12/add-like-an-ancient-egyptian/",
 "https://www.unicode.org/Public/18.0.0/charts/nameslist/13000/"
]);
const round=(n,d=6)=>Number(n.toFixed(d));
function integer(v){if(!Number.isSafeInteger(v)||v<0||v>9999999)throw RangeError("Egyptian numeral requires a safe integer 0–9,999,999");return v}
function encodeEgyptian(value){
 let left=integer(value);
 if(left===0)return {decimal:0,text:"",groups:[],note:"No standalone zero numeral is supplied; empty output is not a classical zero sign."};
 const groups=[];
 for(const s of SIGNS){const copies=Math.floor(left/s.value);if(copies){groups.push({value:s.value,quantity:copies,gardiner:s.gardiner,glyph:s.glyph,name:s.name});left-=copies*s.value;}}
 return {decimal:value,text:groups.map(g=>g.glyph.repeat(g.quantity)).join(""),groups,note:"Modern left-to-right Unicode layout of additive Egyptian numeral signs; classical inscriptions vary in orientation."};
}
function decodeEgyptian(text){
 if(typeof text!=="string"||!text)return {ok:false,reason:"Empty sequence: not a zero numeral."};
 const signs=[...text];let sum=0,prev=0,copies=0;
 for(const sign of signs){const i=SIGN_INDEX.get(sign);if(i===undefined)return {ok:false,reason:"Unrecognized sign: "+sign};
 if(i<prev)return {ok:false,reason:"Signs must be ordered from highest to lowest in this canonical encoding."};
 if(i===prev)copies++;else{prev=i;copies=1;}
 if(copies>9)return {ok:false,reason:"A power-of-ten sign repeats at most nine times."};
 sum+=SIGNS[i].value;if(sum>9999999)return {ok:false,reason:"Outside supported range."};
 }
 return {ok:true,value:sum};
}
function digitRoot(n){if(!Number.isSafeInteger(n)||n<0)throw Error("Nonnegative integer needed");return n===0?0:1+(n-1)%9}
function scoreText(input){
 if(typeof input!=="string"||input.length>10000)throw RangeError("Text must be at most 10,000 code units");
 // Latin A–Z scoring is a declared design cipher; Greek/Arabic/Coptic/hieroglyphs are left unscored.
 const latin=input.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toUpperCase().match(/[A-Z]/g)||[];
 const letterValues=latin.map(ch=>ch.charCodeAt(0)-64),a1z26=letterValues.reduce((a,b)=>a+b,0);
 const cycleNine=letterValues.reduce((a,b)=>a+digitRoot(b),0);
 const rawNumbers=input.match(/\d+(?:\.\d+)?/g)||[];
 return {a1z26,cycleNine,digitalRoot:digitRoot(a1z26),letters:latin.length,
  letterSequence:letterValues,numberTokens:rawNumbers.slice(0,50),
  modes:{a1z26:"A=1…Z=26, ASCII-Latin only (modern cipher)",cycleNine:"1–9 repeated letter values (modern numerology convention)"},
  note:"Non-Latin letters and mathematical symbols remain in the unchanged original. Scores do not establish historical etymology or physical law."};
}
function branchIndex(id,pack=UCT.build()){
 if(id==="uct:continuum"||id==="core:middle")return -1;
 return pack.branches.findIndex(b=>id==="uct:"+b.id||id.startsWith("uct:"+b.id+"-"));
}
function geometryOf(node,pack=UCT.build()){
 if(!node||typeof node.id!=="string")throw Error("Node required");
 const bi=branchIndex(node.id,pack),n=pack.branches.length;
 if(bi<0)return {x:400,y:400,radius:0,thetaDeg:0,branch:-1,ring:0,shape:"center",sides:0};
 const head="uct:"+pack.branches[bi].id,tail=node.id.slice(head.length);
 let kind="branch",radius=115,shape="heptagon";
 if(tail==="-forward"){kind="forward";radius=173;shape="triangle"}
 else if(tail==="-backward"){kind="backward";radius=180;shape="reversed-triangle"}
 else if(/^-c\d+$/.test(tail)){kind="concept";radius=226;shape="circle"}
 else if(/^-f\d+$/.test(tail)){kind="formula";radius=275;shape="square"}
 else if(/^-s\d+$/.test(tail)){kind="scene";radius=322;shape="pentagon"}
 const peers=pack.nodes.filter(v=>v.id.startsWith(head+"-")&&
  (kind==="forward"?v.id.endsWith("-forward"):kind==="backward"?v.id.endsWith("-backward"):
   kind==="concept"?/^-c\d+$/.test(v.id.slice(head.length)):kind==="formula"?/^-f\d+$/.test(v.id.slice(head.length)):
   kind==="scene"?/^-s\d+$/.test(v.id.slice(head.length)):false));
 const order=Math.max(0,peers.findIndex(v=>v.id===node.id)),spread=kind==="branch"?0:(kind==="forward"?-.115:kind==="backward"?.115:(order-(peers.length-1)/2)*(peers.length>1?.63/(peers.length-1):0));
 const theta=-Math.PI/2+bi*2*Math.PI/n+spread;
 return {x:round(400+radius*Math.cos(theta),3),y:round(400+radius*Math.sin(theta),3),radius,
 thetaDeg:round(theta*180/Math.PI,4),branch:bi,ring:Math.ceil(radius/54),shape,sides:shape==="triangle"||shape==="reversed-triangle"?3:shape==="square"?4:shape==="pentagon"?5:shape==="heptagon"?7:0};
}
function polygonVertices(sides,radius=10,start=-Math.PI/2){
 if(!Number.isInteger(sides)||sides<3||sides>100||!Number.isFinite(radius)||radius<=0)throw Error("Polygon requires 3–100 sides and positive radius");
 return Array.from({length:sides},(_,i)=>({x:round(radius*Math.cos(start+2*Math.PI*i/sides)),y:round(radius*Math.sin(start+2*Math.PI*i/sides))}));
}
function translateNode(node,index,pack){
 const branch=branchIndex(node.id,pack),n=scoreText(node.label),ordinal=encodeEgyptian(index+1);
 const branchPower=branch<0?null:10**branch,branchSign=branchPower?SIGNS.find(s=>s.value===branchPower):null;
 const scoreGlyph=encodeEgyptian(n.a1z26);
 const geo=geometryOf(node,pack);
 return {
  source:{id:node.id,label:node.label,kind:node.kind,origin:node.origin,glyphs:node.glyphs||""},
  numerology:{ordinal:index+1,ordinalDigitalRoot:digitRoot(index+1),...n,radix:Radix.encodeTable(n.a1z26,BASES)},
  geometry:geo,
  hieroglyphics:{ordinal:ordinal.text,ordinalGardiner:ordinal.groups.map(g=>g.gardiner),scoreGlyphs:scoreGlyph.text,
    scoreGardiner:scoreGlyph.groups.map(g=>g.gardiner),branchPower,branchGlyph:branchSign?branchSign.glyph:"",
    branchGardiner:branchSign?branchSign.gardiner:"",
    branchNote:"One of seven additive decimal power-of-ten signs assigned to each UCT branch by a modern creative rule; not a historical Egyptian association.",
    provenance:"Unicode Gardiner signs / Egyptian additive numerals",note:ordinal.note}
 };
}
function codebook(){
 const pack=UCT.build(),records=pack.nodes.map((node,i)=>translateNode(node,i,pack));
 const positions=new Map(records.map(x=>[x.source.id,x.geometry]));
 positions.set("core:middle",{x:400,y:400});
 const links=pack.edges.map((edge,i)=>{const a=positions.get(edge.from),b=positions.get(edge.to);
 return {source:edge.from,target:edge.to,type:edge.type,note:edge.note,ordinal:i+1,
 numericRoot:digitRoot(i+1),egyptian:encodeEgyptian(i+1).text,
 length:a&&b?round(Math.hypot(a.x-b.x,a.y-b.y),3):null};});
 return {schema:SCHEMA,date:"2026-10-15",method:"non-destructive three-lens projection over UCT source nodes and edges",
  sourceSchema:pack.schema,claims:pack.ledger,constants:{pi:Math.PI,phi:(1+Math.sqrt(5))/2,heptagonInteriorAngle:180*(7-2)/7,heptagonCentralAngle:360/7},
  sevenBranchPowers:pack.branches.map((b,i)=>({id:b.id,title:b.title,ordinal:i+1,ordinalGlyphs:encodeEgyptian(i+1).text,power:10**i,glyph:SIGNS.find(s=>s.value===10**i).glyph,status:b.status})),
  signs:SIGNS.slice(),sources:SOURCES.slice(),records,links,
  distinction:"Numerology is a chosen modern letter-number cipher; geometry is generated coordinates; Egyptian numeral glyphs are historic signs. No modern science-fiction vocabulary is translated into ancient Egyptian."};
}
function install(Root,state){
 if(!Root||typeof Root.addNode!=="function"||!Root.LIMIT)throw Error("Original Octopus Root engine required");
 if(state?.schema!==ROOT_SCHEMA)throw Error("Valid Root state required");
 const UCTpack=UCT.build();
 const layer=[{id:"uctlens:triple",label:"THREE-CODE ROOT — NUMBER / SHAPE / GLYPH",kind:"project",origin:SCHEMA}];
 for(const name of LENSES)layer.push({id:"uctlens:"+name,label:name.toUpperCase()+" LENS",kind:"project",origin:SCHEMA});
 for(const b of UCTpack.branches){for(const name of LENSES)layer.push({id:"uctlens:"+b.id+"-"+SHORT[name],label:(b.title+" — "+name).slice(0,100),kind:"symbol",origin:SCHEMA});}
 // Forecast before mutating; ROOT has finite storage and is never cleared to make room.
 const missingUCT=UCTpack.nodes.filter(n=>!state.nodes.some(old=>old.id===n.id)).length;
 const missingLens=layer.filter(n=>!state.nodes.some(old=>old.id===n.id)).length;
 if(state.nodes.length+missingUCT+missingLens>Root.LIMIT)return {ok:false,state,reason:"Insufficient Root node capacity. Existing records preserved; use codebook/export without import.",needed:missingUCT+missingLens,available:Root.LIMIT-state.nodes.length};
 const primary=UCT.install(Root,state);
 if(primary.conflicts.length)return {ok:false,state,reason:"UCT source conflicts; no new lens installation",conflicts:primary.conflicts};
 let next=primary.state;let addedNodes=primary.addedNodes,addedEdges=primary.addedEdges,skippedNodes=primary.skippedNodes,skippedEdges=primary.skippedEdges;
 for(const node of layer){if(next.nodes.some(n=>n.id===node.id)){skippedNodes++;continue}
  const r=Root.addNode(next,node);if(!r.ok)return {ok:false,state,reason:r.why};
  next=r.state;addedNodes++;}
 const edges=[
  {from:"core:middle",to:"uctlens:triple",type:"symbolic",note:"Middle C visual triad: numbers, geometry and historical Egyptian numeral marks."},
  {from:"uct:continuum",to:"uctlens:triple",type:"symbolic",note:"Unmodified UCT source graph projected through three reversible design lenses."}
 ];
 for(const name of LENSES)edges.push({from:"uctlens:triple",to:"uctlens:"+name,type:"symbolic",note:"Modern projection lens: "+name});
 for(const b of UCTpack.branches)for(const name of LENSES){
  const id="uctlens:"+b.id+"-"+SHORT[name];edges.push({from:"uctlens:"+name,to:id,type:"symbolic",note:"On-demand conversion of every "+b.id+" source record into "+name});
  edges.push({from:"uct:"+b.id,to:id,type:"symbolic",note:"Read-only link: formula, scene and concept source retained; no ancient-language translation claim"});
 }
 for(const e of edges){if(next.edges.some(old=>old.from===e.from&&old.to===e.to&&old.type===e.type)){skippedEdges++;continue}
  const a=Root.attach(next,e);if(!a.ok)return {ok:false,state,reason:a.why};next=a.state;addedEdges++;}
 return {ok:true,state:next,addedNodes,addedEdges,skippedNodes,skippedEdges,virtualProjections:UCTpack.nodes.length*3,sourceNodes:UCTpack.nodes.length,sourceEdges:UCTpack.edges.length};
}
return Object.freeze({SCHEMA,LENSES,BASES,SIGNS,SOURCES,scoreText,digitRoot,encodeEgyptian,decodeEgyptian,geometryOf,polygonVertices,translateNode,branchIndex,codebook,install});
});
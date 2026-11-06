/* The Tabor Decimal System — framework by Nathan Tabor.
   Four explicit software tiers; quantities retain ordinary integer arithmetic. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaborDecimal=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const NAME='The Tabor Decimal System',AUTHOR='Nathan Tabor',MODES=['REINFORCE_OR','COLLISION_XOR','REQUIRE_AND'];
function integer(n,min=0,max=Number.MAX_SAFE_INTEGER){if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('Expected a bounded whole number');return n;}
function safe(n){if(n<0n||n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Whole-number capacity exceeded');return Number(n);}
function bit(n){if(n!==0&&n!==1)throw Error('Binary gates accept only 0 or 1');return n;}
function gate(a,b,mode){bit(a);bit(b);if(mode==='REINFORCE_OR')return a|b;if(mode==='COLLISION_XOR')return a^b;if(mode==='REQUIRE_AND')return a&b;throw Error('Unknown binary gate');}
function fold(states,mode='REINFORCE_OR'){if(!Array.isArray(states)||states.length>256||!MODES.includes(mode))throw Error('Invalid binary field');return states.reduce((value,state)=>gate(value,state,mode),mode==='REQUIRE_AND'?1:0);}
function potency(base,position,segmentBps=1200){integer(base);integer(position,1,128);integer(segmentBps,0,10000);return safe((BigInt(base)*(10000n+BigInt(position)*BigInt(segmentBps))+9999n)/10000n);}
function segments(items,segmentBps=1200){if(!Array.isArray(items)||items.length>128)throw Error('Segment array exceeds its bound');return items.map((item,i)=>{if(!item||typeof item.label!=='string'||!item.label.length||item.label.length>100)throw Error('Invalid segment label');return {address:String(i+1).padStart(3,'0'),position:i+1,label:item.label,basePotency:integer(item.basePotency),potency:potency(item.basePotency,i+1,segmentBps)};});}
function vector(values,dimension){if(!Array.isArray(values)||values.length<1||values.length>64||dimension!==undefined&&values.length!==dimension||!values.every(n=>Number.isFinite(n)&&Math.abs(n)<=1e6))throw Error('Signal vectors must have matching finite dimensions');return values;}
function lookup(nodes,probe){
 vector(probe);if(!Array.isArray(nodes)||nodes.length>256)throw Error('Signal field exceeds its bound');
 const rows=nodes.map((node,i)=>{if(!node||typeof node.label!=='string'||!node.label.length||node.label.length>100)throw Error('Invalid signal node');vector(node.vector,probe.length);return {position:i+1,label:node.label,resonance:probe.reduce((sum,n,j)=>sum+n*node.vector[j],0)};});
 if(!probe.some(Boolean))return null;
 rows.sort((a,b)=>b.resonance-a.resonance||a.position-b.position);return rows[0]||null;
}
function policy(){return {schema:'one.v025.tabor.policy.v1',segmentBps:1200,inflationBps:0,growthBps:0,reserveBps:0};}
function validatePolicy(p){if(!p||p.schema!=='one.v025.tabor.policy.v1'||p.segmentBps!==1200||Object.keys(p).length!==5)throw Error('Invalid Tabor policy');for(const key of ['inflationBps','growthBps','reserveBps'])integer(p[key],0,10000);return {...p};}
function ceiling(base,p=policy()){integer(base);validatePolicy(p);const cap=safe(BigInt(base)*(10000n+BigInt(p.inflationBps)+BigInt(p.growthBps))/10000n),reserve=safe((BigInt(cap)*BigInt(p.reserveBps)+9999n)/10000n);return {base,cap,reserve,spendable:cap-reserve};}
function absorb(retained,incoming,base,p=policy()){integer(retained);integer(incoming);safe(BigInt(retained)+BigInt(incoming));const limit=ceiling(base,p);if(retained>limit.spendable)throw Error('Retained amount exceeds the policy limit');const accepted=Math.min(incoming,limit.spendable-retained),diverted=incoming-accepted;return {...limit,accepted,retained:retained+accepted,diverted};}
function distribute(pool,positions){integer(pool);if(!Array.isArray(positions)||positions.length>256||new Set(positions).size!==positions.length)throw Error('Invalid distribution positions');positions.forEach(n=>integer(n,1,1e9));if(!positions.length)return {allocations:[],unassigned:pool};const sorted=positions.slice().sort((a,b)=>a-b),share=Math.floor(pool/sorted.length),remainder=pool%sorted.length;return {allocations:sorted.map((position,i)=>({position,amount:share+(i<remainder?1:0)})),unassigned:0};}
function localStep(field,rows,cols){integer(rows,1,32);integer(cols,1,32);if(!Array.isArray(field)||field.length!==rows*cols)throw Error('Invalid signal field dimensions');field.forEach(bit);const next=Array(field.length).fill(0);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let neighbors=0;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const rr=r+dr,cc=c+dc;if(rr>=0&&rr<rows&&cc>=0&&cc<cols)neighbors+=field[rr*cols+cc];}next[r*cols+c]=field[r*cols+c]?(neighbors===2||neighbors===3?1:0):(neighbors===3?1:0);}return next;}
return Object.freeze({NAME,AUTHOR,gate,fold,potency,segments,lookup,policy,validatePolicy,ceiling,absorb,distribute,localStep});
});

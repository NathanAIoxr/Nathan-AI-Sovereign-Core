/* Nathan AI — primordial word-family graph.
 * Source spellings are immutable and distinct from generated comparisons.
 * No proposed etymology, metaphysical root switch or factual claim is inferred.
 */
(function(root){"use strict";
const SOURCE=Object.freeze([
 "Primordial","Primortal","Priimortal","Primortial","Priimortial",
 "Bimordial","Bimortal","Biimortal","Bimordial"
]);
const SOURCE_QUOTE="Primordial, Primortal, Priimortal, Primortial, Priimortial, Bimordial, Bimortal, Biimortal, Bimordial, and that' just nothing compared .. hehe ...";
const META=Object.freeze({
 id:"PRIMORDIAL-PRIMORTAL-2026-11-05",
 authoring:"exact owner-provided sequence",
 evidence:"source-verbatim",
 linguistic:"no established etymology is inferred from visual similarity",
 engineering:"mathematics does not make executable programs unstoppable",
 quote:SOURCE_QUOTE
});
function sequence(){return SOURCE.map((word,i)=>Object.freeze({position:i+1,word,origin:"author-source",original:true}));}
function types(){const counts=new Map();for(const word of SOURCE)counts.set(word,(counts.get(word)||0)+1);
 return [...counts].map(([word,count],i)=>({id:"PF-"+String(i+1).padStart(2,"0"),word,count,origin:"author-source",meaningStatus:"not assigned by author"}));}
function editDistance(a,b){if(typeof a!=="string"||typeof b!=="string")throw new TypeError("Text required");
 const x=Array.from(a),y=Array.from(b),prev=Array.from({length:y.length+1},(_,i)=>i),cur=[];
 for(let i=1;i<=x.length;i++){cur[0]=i;for(let j=1;j<=y.length;j++){cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(x[i-1]===y[j-1]?0:1));}for(let j=0;j<=y.length;j++)prev[j]=cur[j];}
 return prev[y.length];}
function relation(a,b){if(a===b)return "repeated original spelling";
 if((a.startsWith("Pr")&&b==="B"+a.slice(2))||(b.startsWith("Pr")&&a==="B"+b.slice(2)))return "initial-cluster transformation: Pr ↔ B";
 if((a.replace("mord","mort")===b)||(b.replace("mord","mort")===a))return "spelling transformation: d ↔ t";
 if((a.replace("Prim","Priim")===b)||(b.replace("Prim","Priim")===a)||(a.replace("Bim","Biim")===b)||(b.replace("Bim","Biim")===a))return "spelling transformation: additional i";
 return "edit-distance neighbor (not proof of shared historical root)";}
function graph(maxDistance){if(maxDistance===undefined)maxDistance=2;if(!Number.isInteger(maxDistance)||maxDistance<1||maxDistance>5)throw new RangeError("Distance must be 1..5");
 const nodes=types();const edges=[];
 for(let i=0;i<nodes.length;i++){for(let j=i+1;j<nodes.length;j++){const d=editDistance(nodes[i].word,nodes[j].word);
 if(d<=maxDistance)edges.push({from:nodes[i].id,to:nodes[j].id,fromWord:nodes[i].word,toWord:nodes[j].word,distance:d,connection:relation(nodes[i].word,nodes[j].word),source:"algorithmic-form-comparison",historicalClaim:false});}}
 return {nodes,edges,sourceOccurrences:SOURCE.length,distinctTerms:nodes.length,
 disclaimer:"Relations compare orthography only. Historical meanings, derivations and origins require research."};}
function reverseForm(word){if(typeof word!=="string"||word.length>180)throw new TypeError("Short word required");return Array.from(word).reverse().join("");}
function generatedVariants(word){if(!SOURCE.includes(word))throw new RangeError("Choose a documented original");
 const suggestions=[
 ["Pr/B initial conversion",word.startsWith("Pr")?"B"+word.slice(2):word.startsWith("B")?"Pr"+word.slice(1):word],
 ["First-i doubling",word.startsWith("Prim")?"Priim"+word.slice(4):word.startsWith("Bim")?"Biim"+word.slice(3):word],
 ["d/t interchange",word.includes("mord")?word.replace("mord","mort"):word.includes("mort")?word.replace("mort","mord"):word],
 ["Reversed spelling",reverseForm(word)]
 ];
 return suggestions.map(([operation,form])=>({operation,form,origin:"machine-generated suggestion",authoredByUser:SOURCE.includes(form),attestedHistorical:false}));
}
function searchable(search){const q=String(search||"").trim().toLocaleLowerCase();return types().filter(t=>t.word.toLocaleLowerCase().includes(q));}
const api=Object.freeze({SOURCE,META,sequence,types,graph,editDistance,generatedVariants,reverseForm,searchable});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.NathanPrimordialLexicon=api;
})(typeof globalThis!=="undefined"?globalThis:this);

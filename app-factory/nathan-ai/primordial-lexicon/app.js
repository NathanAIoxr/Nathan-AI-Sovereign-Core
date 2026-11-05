/* Primordial Lexicon / client, zero network calls or writable server state. */
(function(){"use strict";
const api=window.NathanPrimordialLexicon;
if(!api){document.body.textContent="Source-locked word-family engine not available.";return;}
const $=id=>document.getElementById(id),NS="http://www.w3.org/2000/svg";
const resilience=[
 ["Security and endpoint protections",15],
 ["Operating system and kernel constraints",15],
 ["Malicious interference and abuse",15],
 ["Software bugs and logic defects",15],
 ["Network and infrastructure failures",15],
 ["Hardware and physical limitations",14],
 ["Human, business and licensing",11]
];
function text(tag,content,parent,cls){const e=document.createElement(tag);e.textContent=String(content);if(cls)e.className=cls;parent.appendChild(e);return e;}
function svgEl(tag,attributes,parent,content){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attributes))el.setAttribute(k,String(v));if(content!==undefined)el.textContent=content;parent.appendChild(el);return el;}
function sourceView(){const box=$("sourceSequence");box.replaceChildren();
 const seen={};for(const item of api.sequence()){
 const card=document.createElement("article");seen[item.word]=(seen[item.word]||0)+1;
 card.className="source-item"+(seen[item.word]>1?" duplicate":"");
 text("small","SOURCE POSITION "+String(item.position).padStart(2,"0"),card);
 text("strong",item.word,card);
 if(seen[item.word]>1)text("span","Repeated original occurrence — retained",card,"repeat");
 box.appendChild(card);}
 $("quote").textContent=api.META.quote;
}
function positions(nodes){const out={};nodes.forEach((n,i)=>{const angle=-Math.PI/2+2*Math.PI*i/nodes.length;out[n.id]={x:450+300*Math.cos(angle),y:273+190*Math.sin(angle)};});return out;}
function renderGraph(){const distance=Number($("distance").value),g=api.graph(distance),q=$("query").value.trim().toLowerCase();
 $("distanceLabel").textContent=distance+" edit"+(distance===1?"":"s");
 $("graphCount").textContent=g.nodes.length+" words · "+g.edges.length+" links";
 const svg=$("web");svg.replaceChildren();const points=positions(g.nodes);
 for(const edge of g.edges){
  const a=points[edge.from],b=points[edge.to];
  const matching=!q||edge.fromWord.toLowerCase().includes(q)||edge.toWord.toLowerCase().includes(q);
  svgEl("line",{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:edge.distance===1?"#93e7e0":"#759fb6","stroke-width":edge.distance===1?2.7:1.4,"stroke-opacity":matching?".55":".11"},svg);
 }
 for(const n of g.nodes){
  const p=points[n.id],matching=!q||n.word.toLowerCase().includes(q);
  const group=svgEl("g",{"aria-label":n.word+"; "+n.count+" source occurrence"+(n.count===1?"":"s"),opacity:matching?1:.24},svg);
  svgEl("circle",{cx:p.x,cy:p.y,r:64,fill:"#0d2b3d",stroke:n.word.startsWith("Bi")?"#ead394":"#96e6e4","stroke-width":3},group);
  svgEl("circle",{cx:p.x,cy:p.y,r:71,fill:"none",stroke:"#aec8de","stroke-opacity":".22","stroke-dasharray":"4 8"},group);
  svgEl("text",{x:p.x,y:p.y-3,"text-anchor":"middle","font-family":"system-ui,Arial","font-size":n.word.length>10?13:15,"font-weight":"750",fill:"#eef9f9"},group,n.word);
  svgEl("text",{x:p.x,y:p.y+22,"text-anchor":"middle","font-family":"system-ui,Arial","font-size":11,fill:"#e6d29d"},group,n.count===2?"2 source occurrences":"Source original");
 }
 const box=$("connections");box.replaceChildren();
 if(!g.edges.length)text("p","No links at this character-edit distance.",box);
 for(const edge of g.edges){if(q&&!edge.fromWord.toLowerCase().includes(q)&&!edge.toWord.toLowerCase().includes(q))continue;
 const card=document.createElement("article");card.className="connection";
 text("strong",edge.fromWord+" ↔ "+edge.toWord,card);
 text("small",edge.distance+" edit"+(edge.distance===1?"":"s")+" · "+edge.connection,card);
 box.appendChild(card);}
}
function variantView(){const word=$("selectedWord").value,box=$("variants");box.replaceChildren();
 for(const v of api.generatedVariants(word)){
  const card=document.createElement("article");card.className="variant";
  text("strong",v.form,card);
  text("small",v.operation+" · "+(v.authoredByUser?"Also occurs in original source":"Generated; NOT author-attributed"),card);
  box.appendChild(card);
 }}
function resilienceView(){const box=$("resilienceSummary");box.replaceChildren();
 for(const [name,count] of resilience){const card=document.createElement("article");card.className="audit-item";text("strong",count,card);text("span",name,card);box.appendChild(card);}
 const total=resilience.reduce((sum,x)=>sum+x[1],0);
 const card=document.createElement("article");card.className="audit-item";text("strong",total+" / 101",card);text("span","Original numbered records · gap at #76",card);box.appendChild(card);
}
function download(){const detail=api.graph(Number($("distance").value)),exportData={
 schema:"nathan-ai.primordial-lexicon.export.v1",
 source:api.META,
 occurrences:api.sequence(),
 graph:detail,
 selectedWord:$("selectedWord").value,
 variants:api.generatedVariants($("selectedWord").value),
 provenanceWarning:"Computer-generated comparisons are distinct from author source. No full pasted documents have been published."
 };
 const url=URL.createObjectURL(new Blob([JSON.stringify(exportData,null,2)],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download="nathan-ai-primordial-word-family.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $("status").textContent="Source-faithful JSON exported locally.";}
function init(){sourceView();
 for(const item of api.types()){const opt=document.createElement("option");opt.value=item.word;opt.textContent=item.word;$("selectedWord").appendChild(opt);}
 $("query").addEventListener("input",renderGraph);
 $("distance").addEventListener("input",renderGraph);
 $("selectedWord").addEventListener("change",variantView);
 $("copySource").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(api.META.quote);$("status").textContent="Exact wording copied.";}catch(e){$("status").textContent="Copy unavailable; select the original quote and copy manually."; }});
 $("download").addEventListener("click",download);
 resilienceView();variantView();renderGraph();
}
init();
})();
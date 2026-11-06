(function(){"use strict";
const $=id=>document.getElementById(id),app=window.VaticanONE;
if(!app){$("results-status").textContent="Archive application data unavailable.";return;}
const el=(tag,txt)=>{const node=document.createElement(tag);node.textContent=String(txt??"");return node;};
const summary=[["Document references",72],["Historical audit",69],["Audit gaps",32],["312 Matrix slots",100],["Research subjects",app.SUBJECTS.length],["Works / ciphers",app.WORKS.length],["Private source files",app.ORIGINAL_FILES.length]];
for(const [label,value] of summary){const div=el("div","");div.className="stat";div.append(el("strong",value),el("span",label));$("stats").append(div);}
for(const t of app.CORRECTIONS)$("corrections").append(el("p",t));
for(const t of app.GAPS)$("gaps").append(el("li",t));
let history=[],shown=40,selected=[];
function update(){
 selected=app.select(history,$("group").value,$("search").value);
 const cards=$("cards");cards.replaceChildren();
 for(const r of selected.slice(0,shown)){
  const card=el("article","");card.className="card";card.append(el("small",r.id+" · "+r.kind),el("h3",r.title));
  const status=el("div",r.status);status.className="status";card.append(status,el("p",r.detail));
  card.append(el("small","Source: "+r.source));cards.append(card);
 }
 $("results-status").textContent=selected.length+" matching records. Showing "+Math.min(shown,selected.length)+".";
 $("more").hidden=shown>=selected.length;
}
$("group").addEventListener("change",()=>{shown=40;update();});
$("search").addEventListener("input",()=>{shown=40;update();});
$("more").addEventListener("click",()=>{shown+=40;update();});
$("export").addEventListener("click",()=>{
 const obj={schema:"nathan-one-vatican-public-index-v1",sourceClass:"derived-public-index",history,networkRanges:app.RANGES,subjects:app.SUBJECTS,works:app.WORKS,authorDeclarations:app.WORDS,privateOriginalFileNames:app.ORIGINAL_FILES,recoveryGaps:app.GAPS,clarifications:app.CORRECTIONS};
 const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});const u=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=u;a.download="Nathan_AI_Vatican_Public_Recovery_Index.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
});
$("private").addEventListener("change",async function(){
 $("private-preview").replaceChildren();let loaded=0;
 for(const f of Array.from(this.files||[]).slice(0,20)){
  if(!/\.(txt|md|json)$/i.test(f.name)||f.size>5*1024*1024)continue;
  const section=el("section","");section.append(el("h3",f.name));const pre=el("pre","");
  try{const txt=await f.text();pre.textContent=txt.slice(0,14000)+(txt.length>14000?"\n[Preview truncated at 14,000 characters]":"");loaded++;}
  catch(err){pre.textContent="Unable to open this local source file.";}
  section.append(pre);$("private-preview").append(section);
 }
 $("private-status").textContent=loaded+" selected private text file(s) displayed locally; none uploaded or included in exported JSON.";
});
$("clear").addEventListener("click",()=>{
 $("private-preview").replaceChildren();$("private").value="";$("private-status").textContent="Private preview cleared.";
});
fetch("./history.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("History source not available");return r.json()})
 .then(rows=>{if(!Array.isArray(rows)||rows.length!==72)throw Error("History index count mismatch");history=rows;update();})
 .catch(err=>{history=[];update();$("results-status").textContent="72-entry documentary index currently unavailable; other collections remain searchable. "+err.message;});
update();
})();
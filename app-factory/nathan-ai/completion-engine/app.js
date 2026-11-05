/* NATHAN AI Completion UI: opt-in local storage, source labels unchanged.
 * No network calls. Notes and evidence are displayed with textContent only.
 */
(function(){"use strict";
const api=window.NathanCompletion;
if(!api){document.body.textContent="Completion engine missing.";return;}
const KEY="nathan-completion-owned-v1";
const seed=[
{id:"ANCIENT-AV-2026",title:"ANCIENT A/V Spiderweb — Recovery and Language Index",track:"Ancient / A–V",sourceRef:"Owner-held recovery package: Nathan_AI_ANCIENT_AV_Full_Research_Package_2026-11-05.zip",privacy:"owner-only"},
{id:"ANCIENT-ROOTS",title:"The Ancient Divine Roots — Tabor 1-2-3 Factory",track:"Research / Ancient",sourceRef:"app-factory/mythology/ancient-roots/source.md",privacy:"public"},
{id:"PRIMORDIAL-WORD-FAMILY",title:"Primordial / Primortal — Source-Locked Original Word Family",track:"Ancient / Language / Word Creation",sourceRef:"app-factory/nathan-ai/primordial-lexicon/source-sequence.json",privacy:"public"},
{id:"SIX-DOGS",title:"The Six Dogs — KNICK KNACK PADDY WHACK DOG BONE",track:"Software and hardware",sourceRef:"app-factory/nathan-ai/six-dogs/README.md",privacy:"public"},
{id:"ACRO-MATRIX",title:"Nathan AI Sovereign Acro-Matrix",track:"Sovereign Architecture",sourceRef:"app-factory/one/sovereign-acro-matrix/README.md",privacy:"public"},
{id:"A-INDEX",title:"Nathan AI — Master A-Index Source Recovery",track:"A–Z source recovery",sourceRef:"Owner-held A-index master catalog, 381 source records",privacy:"owner-only"}
];
let ledger=api.newLedger(seed),selected=seed[0].id,persist=false;
const $=id=>document.getElementById(id);
function notice(text){$("message").textContent=text;}
function renderText(tag,value,container,cls){const e=document.createElement(tag);e.textContent=String(value);if(cls)e.className=cls;container.appendChild(e);return e;}
function current(){return ledger.projects.find(p=>p.id===selected)||ledger.projects[0];}
function save(){if(!persist)return;try{localStorage.setItem(KEY,JSON.stringify(ledger));}catch(e){notice("Local storage unavailable. Your current working queue remains in page memory.");}}
function restore(){try{const raw=localStorage.getItem(KEY);if(raw){const recovered=api.validLedger(JSON.parse(raw));ledger=recovered;persist=true;$("persist").checked=true;selected=ledger.projects[0]?.id||selected;notice("Restored opted-in browser-local working queue.");}}catch(e){notice("Saved queue could not be loaded; original seed queue is available.");}}
function displayProjects(){const text=$("search").value.trim().toLocaleLowerCase(),sel=$("projectSelect");sel.replaceChildren();
 const visible=ledger.projects.filter(p=>(p.title+" "+p.id+" "+p.track).toLocaleLowerCase().includes(text));
 for(const p of visible){const o=document.createElement("option");o.value=p.id;o.textContent=p.title;sel.appendChild(o);}
 if(visible.length&&!visible.some(p=>p.id===selected))selected=visible[0].id;
 if(!visible.length){const o=document.createElement("option");o.textContent="No matching projects";o.value="";sel.appendChild(o);}
 sel.value=selected;$("counts").textContent=ledger.projects.length+" projects, "+visible.length+" shown";
}
function renderGates(project){const box=$("gates");box.replaceChildren();
 for(const gate of api.GATES){const state=project.gates[gate.id];
 const card=document.createElement("article");card.className="gate "+state.state;
 renderText("h3",gate.title,card);
 renderText("strong",state.state==="reviewed-pass"?"REVIEWED PASS":state.state==="blocked"?"BLOCKED":"UNREVIEWED",card,"gate-tag");
 renderText("p",gate.help,card,"muted");
 if(state.evidence)renderText("p","Evidence: "+state.evidence,card,"evidence");
 if(state.reviewer)renderText("small","Reviewed by "+state.reviewer,card);
 const choose=document.createElement("button");choose.type="button";choose.className="secondary";choose.textContent="Review gate";
 choose.addEventListener("click",()=>{$("gateSelect").value=gate.id;loadGate();$("gateSelect").focus();});
 card.appendChild(choose);box.appendChild(card);}
}
function renderAudit(project){const box=$("audit");box.replaceChildren();
 if(!project.audit.length){renderText("p","No changes recorded. Original catalog names and source references remain unchanged.",box);return;}
 for(const entry of [...project.audit].reverse().slice(0,40)){const article=document.createElement("article");renderText("strong",entry.kind,article);
 renderText("span",new Date(entry.at).toLocaleString()+" · "+entry.detail,article);box.appendChild(article);}
}
function loadGate(){const p=current(),g=p?.gates[$("gateSelect").value];if(!g)return;
 $("assessment").value=g.state;$("evidence").value=g.evidence;$("reviewer").value=g.reviewer;}
function render(){displayProjects();const p=current();if(!p)return;
 const s=api.summary(p);
 $("title").value=p.title;$("sourceRef").value=p.sourceRef;$("privacy").value=p.privacy;
 $("stage").value=p.stage;$("score").textContent=s.percent+"%";$("gatesCount").textContent=s.passed+" / "+s.total;
 $("currentStatus").textContent=s.label;renderGates(p);renderAudit(p);loadGate();}
function update(fn){try{const next=fn(current());ledger=api.updateProject(ledger,next);save();render();}catch(e){notice(e.message);}}
function download(obj,name){const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function fileImport(file){if(!file)return;if(file.size>9_000_000){notice("Import exceeds 9 MB.");return;}
 const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(String(reader.result));
 const incoming=api.validLedger(data);
 if(!window.confirm("Replace this working queue with your imported ledger? Export first if needed."))return;
 ledger=incoming;selected=ledger.projects[0]?.id||"";save();render();notice("Source-locked ledger imported locally; nothing transmitted.");}
 catch(e){notice("Import rejected: "+e.message);}};reader.onerror=()=>notice("File read failed");reader.readAsText(file);}
for(const g of api.GATES){const o=document.createElement("option");o.value=g.id;o.textContent=g.title;$("gateSelect").appendChild(o);}
for(const stage of api.STAGES){const o=document.createElement("option");o.value=stage;o.textContent=stage.toUpperCase();$("stage").appendChild(o);}
$("search").addEventListener("input",render);
$("projectSelect").addEventListener("change",()=>{selected=$("projectSelect").value;render();});
$("gateSelect").addEventListener("change",loadGate);
$("stage").addEventListener("change",()=>update(p=>api.setStage(p,$("stage").value)));
$("saveSource").addEventListener("click",()=>{if(!window.confirm("Update source and reopen dependent source/words/owner gates?"))return;
 update(p=>api.setSource(p,$("sourceRef").value));notice("Source changed. Dependent verification gates reopened.");});
$("applyReview").addEventListener("click",()=>{update(p=>api.reviewGate(p,$("gateSelect").value,{state:$("assessment").value,evidence:$("evidence").value,reviewer:$("reviewer").value}));notice("Reviewer assessment recorded. This is not external certification.");});
$("addProject").addEventListener("click",()=>{try{ledger=api.addProject(ledger,{id:$("newId").value.trim(),title:$("newTitle").value,track:$("newTrack").value,privacy:"review-required"});selected=$("newId").value.trim();$("search").value="";$("newTitle").value="";$("newId").value="";$("newTrack").value="";save();render();notice("Project added with all eight gates unreviewed.");}catch(e){notice(e.message);}});
$("persist").addEventListener("change",()=>{persist=$("persist").checked;if(persist){save();notice("Browser-local save enabled. This storage is not encrypted.");}
else{try{localStorage.removeItem(KEY);}catch(e){}notice("Saved browser-local copy cleared; working memory retained until reload.");}});
$("export").addEventListener("click",()=>{download(ledger,"nathan-ai-source-locked-private-ledger.json");notice("Full owned ledger exported. Treat as private; it may contain original source references and review details.");});
$("exportPublic").addEventListener("click",()=>{download(api.redactPublic(ledger),"nathan-ai-public-project-summary.json");notice("Only explicitly public projects included; raw words and evidence omitted.");});
$("import").addEventListener("change",function(){fileImport(this.files?.[0]);this.value="";});
$("clear").addEventListener("click",()=>{if(!window.confirm("Clear saved browser data and reset this page to the default seed queue? Export first if needed."))return;
 try{localStorage.removeItem(KEY);}catch(e){}persist=false;$("persist").checked=false;ledger=api.newLedger(seed);selected=seed[0].id;render();notice("Local working ledger cleared and defaults restored. Downloaded exports remain under user control.");});
restore();render();
})();
/* Local-only UI. No remote actions, no model API, no external writes. */
(function(){
"use strict";
const core=window.NathanTransformationTriad,$=id=>document.getElementById(id);
let catalog=null,session=null,visible=[];
const state=message=>$("status").textContent=message;
const stringify=value=>JSON.stringify(value,null,2);
function show(id,value){$(id).textContent=typeof value==="string"?value:stringify(value);}
function error(e){state("NO CHANGE: "+e.message);}
function request(){
 return {humanChoice:"YES",ownerSelf:$("self").checked,voluntary:$("self").checked,
   consent:$("consent").checked?"YES":"NO",purpose:$("purpose").value.trim(),
   context:$("context").value.trim(),coerced:false,targetsPerson:false,harmRisk:false,
   weaponUse:false,physicalIntervention:false,unauthorizedAccess:false,
   massSurveillance:false,entrapPerson:false,detainPerson:false,impersonation:false,
   nonconsensualExperiment:false,unverifiedAccusation:false,overrideVeto:false};
}
function approved(){
 if(!$("human-yes").checked)throw Error("NO HUMAN YES. Action not performed.");
 $("human-yes").checked=false;
 const p=request();
 if(!p.ownerSelf||p.consent!=="YES")throw Error("Local purpose and consent must remain approved");
 return p;
}
function execute(fn){try{fn()}catch(e){error(e)}}
function updateSelect(){
 if(!catalog)return;
 const q=$("search").value.toLocaleLowerCase().trim(),cls=$("source-class").value;
 const selected=new Set(Array.from($("sources").selectedOptions,x=>x.value));
 const list=catalog.sourceRecords.filter(item=>(cls==="ALL"||item.sourceClass===cls)&&
   (!q||[item.id,item.reference,item.convertedCapability,item.studyTheme].some(v=>v.toLocaleLowerCase().includes(q))));
 visible=list;
 $("sources").replaceChildren();
 for(const entry of list){
   const option=document.createElement("option");option.value=entry.id;
   option.textContent=entry.reference+" · "+entry.convertedCapability;
   option.selected=selected.has(entry.id);
   $("sources").append(option);
 }
 if(!$("sources").selectedOptions.length&&list.length)$("sources").options[0].selected=true;
 $("summary").textContent=catalog.sourceRecords.length+" preserved source topics × "+
   catalog.roles.length+" interconnected roles = "+
   (catalog.sourceRecords.length*catalog.roles.length)+
   " source-linked projections. Each logical SUPERNODE resolves the same reference map on demand.";
}
function selected(){
 const ids=Array.from($("sources").selectedOptions,x=>x.value);
 if(!ids.length)throw Error("Select at least one source topic");
 return ids;
}
$("search").addEventListener("input",updateSelect);
$("source-class").addEventListener("change",updateSelect);
$("inspect").addEventListener("click",()=>execute(()=>{
 if(!catalog)throw Error("Catalog unavailable");
 const ids=selected();
 const items=ids.slice(0,5).map(x=>core.transform(catalog,x));
 show("source-output",{inspected:items.length,selectedCount:ids.length,
   firstFive:items,allOriginalSourcesStillSeparate:true});
}));
$("open").addEventListener("click",()=>execute(()=>{
 if(!catalog)throw Error("Source catalog not loaded");
 session=core.begin(catalog,$("node").value,request());
 const atlas=core.nodeAtlas(catalog,session.nodeId);
 show("node-output",{status:"ACTIVE LOCAL CONSENT",id:session.nodeId,
   namespaces:atlas.threeNamedFunctions.map(x=>x.logicalNamespace),
   inheritedDimensions:atlas.originalAxes.length,
   inheritedPaths:atlas.originalPaths.length,
   sourceConcepts:atlas.recordCount,
   physicalNodesCreated:0,externalAccess:false});
 state("Local human-authorized session created. Each transformation still requires a separate YES.");
}));
$("plan").addEventListener("click",()=>execute(()=>{
 if(!session)throw Error("Create a voluntary local session first");
 if(!catalog)throw Error("Catalog missing");
 const ids=$("all").checked?"ALL":selected();
 session=core.plan(catalog,session,ids,approved());
 show("plan-output",session.lastPlan);
 state("PROPOSED: "+session.pending.recordCount+" concepts × 3 roles. No operation performed. Choose YES or NO.");
}));
$("yes").addEventListener("click",()=>execute(()=>{
 if(!session)throw Error("No session");
 session=core.decide(session,"YES",approved());
 state("YES: "+stringify(session.decisionHistory.at(-1))+
   "\nYour approval records an original design proposal only. No physical or remote action.");
}));
$("no").addEventListener("click",()=>execute(()=>{
 if(!session||!session.pending)throw Error("No proposal to veto");
 session=core.decide(session,"NO",null);
 show("plan-output","Cleared by human NO.");
 state("NO — VETO RECORDED. Original sources retained; proposed conversion not approved.");
}));
$("export").addEventListener("click",()=>execute(()=>{
 if(!session||session.status!=="ACTIVE")throw Error("No active session");
 const approve=approved();
 if(!core.permission(session,approve).allowed)throw Error("Owner authorization required");
 if(!window.confirm("YES: save this local design record as a JSON file on your own device?"))return;
 const data=core.exportApproved(session,true);
 const blob=new Blob([data],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="nathan-dog-reaper-transformation-matrix.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 state("Owner-approved JSON export requested locally; no server upload.");
}));
$("clear").addEventListener("click",()=>execute(()=>{
 if(session)session=core.revoke(session);session=null;
 $("human-yes").checked=false;$("self").checked=false;$("consent").checked=false;
 $("all").checked=false;
 show("plan-output","Cleared.");
 show("node-output","No active node. Consent withdrawn; session released.");
 state("1-1=0 CLEAR. Local session and selected plan released; originals never overwritten.");
}));
async function load(){
 try{
   const response=await fetch("./catalog.json",{cache:"no-store"});
   if(!response.ok)throw Error("Local catalog unavailable: "+response.status);
   const value=await response.json();
   core.catalogCheck(value);catalog=value;updateSelect();
   state("Loaded. No active session. Consent must be given by the human.");
 }catch(e){state("Unable to load the local catalog. Serve the repository over HTTP: "+e.message);}
}
load();
})();
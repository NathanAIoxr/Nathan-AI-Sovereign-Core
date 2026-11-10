(function(){
"use strict";
const T=window.TaborLight,$=id=>document.getElementById(id);
const show=(id,value)=>{$(id).textContent=typeof value==="string"?value:JSON.stringify(value,null,2);};
function run(fn,output){try{show(output,fn());}catch(e){show(output,"NO CHANGE: "+e.message);}}
function chooseScale(){const select=$("scale");
 for(const s of T.KINDS){const op=document.createElement("option");op.value=s.key;op.textContent=s.key+" — "+s.label;select.append(op);}
 select.value="PROTON";
}
$("inspect-frame").addEventListener("click",()=>run(()=>T.frame($("frame").value),"frame-output"));
$("inspect-axis").addEventListener("click",()=>run(()=>T.beam(),"axis-output"));
$("inspect-node").addEventListener("click",()=>run(()=>T.boxNode($("node").value),"node-output"));
$("inspect-non").addEventListener("click",()=>run(()=>T.boxNonNode($("non-reason").value,$("non-label").value),"non-output"));
$("inspect-scale").addEventListener("click",()=>run(()=>T.layer($("scale").value),"scale-output"));
$("audit").addEventListener("click",async()=>{
 show("ledger","Reading the public local registry only...");
 try{const response=await fetch("../registry.json",{cache:"no-store"});
 if(!response.ok)throw Error("Registry unavailable (HTTP "+response.status+")");
 const registry=await response.json(),summary=T.reconcile(registry);
 show("ledger",{...summary,nonNodeSourceBox:T.boxNonNode("PRIVATE_UNRECOVERED","unpublished owner catalog content")});
 }catch(e){show("ledger","No restore claimed: "+e.message);}
});
const linkNames=["Sovereign Box source notes","Original public box registry","732m SUPERNODES","CONSCIOUNESS",
"Φ_life","Node Runtime","Omni God","Mother Earth","ONE Nathan Matrix"];
T.SOURCE_LINKS.forEach((url,i)=>{
 const a=document.createElement("a");a.href=url;a.textContent=linkNames[i]||url;
 a.className="tag";$("links").append(a);
});
const G=window.TaborForeverGuardian;
let guardianRecord=null;
for(const domain of G.POLARITIES){
 const option=document.createElement("option");option.value=domain.domain;
 option.textContent=domain.domain+" — "+domain.middle;$("guardian-domain").append(option);
}
$("guardian-domain").value="ATOMIC";
$("guardian-inspect").addEventListener("click",()=>run(()=>G.equator($("guardian-domain").value),"guardian-frame"));
function guardianPermission(){
 if(!$("guardian-approve").checked)throw Error("NO HUMAN YES: leave the local plan unchanged");
 $("guardian-approve").checked=false;
 return {humanChoice:"YES",voluntary:true,
 contextApproved:true,purposeApproved:true,
 humanReviewed:$("guardian-reviewed").checked,
 ownerControlsSystem:$("guardian-owned").checked,
 coercion:false,deception:false,targetPerson:false,unlawfulAccess:false,
 massSurveillance:false,entrapPerson:false,physicalForce:false,accuseWithoutEvidence:false};
}
$("guardian-create").addEventListener("click",()=>run(()=>{
 const permission=guardianPermission();
 guardianRecord=G.create({purpose:$("guardian-purpose").value,
 context:$("guardian-context").value,evidenceReference:$("guardian-evidence").value,
 permission});
 return guardianRecord;
},"guardian-record"));
$("guardian-advance").addEventListener("click",()=>run(()=>{
 if(!guardianRecord)throw Error("Build a voluntary local plan first");
 const permission=guardianPermission();
 guardianRecord=G.advance(guardianRecord,permission);
 return guardianRecord;
},"guardian-record"));
$("guardian-inspect").click();
chooseScale();$("inspect-frame").click();$("inspect-axis").click();$("inspect-node").click();
$("inspect-non").click();$("inspect-scale").click();
})();
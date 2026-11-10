(function(){"use strict";
const K=window.NathanKAP007,$=id=>document.getElementById(id);
let session=null;
const display=x=>{$("status").textContent=typeof x==="string"?x:JSON.stringify(x,null,2);};
const approveOnce=()=>{if(!$("step-yes").checked)throw Error("No human YES");$("step-yes").checked=false;return true;};
function request(){
 return {humanChoice:"YES",consent:$("consent").checked?"YES":"NO",
  voluntary:$("self").checked,ownerSelf:$("self").checked,
  purpose:$("purpose").value,context:$("context").value,
  reference:$("reference").value,caseType:$("case-type").value,
  humanReviewed:$("review").checked,ownerControlsSystem:$("owner").checked};
}
function run(fn){try{display(fn());}catch(e){display("NO CHANGE: "+e.message);}}
K.PROTOCOLS.forEach(p=>{
 const li=document.createElement("li"),b=document.createElement("strong");
 b.textContent=p.id+" · "+p.label;li.append(b,document.createTextNode(" — "+p.description));
 $("protocols").append(li);
});
$("summary").textContent=K.PROTOCOLS.length+" human-controlled steps; "+K.ROLES.length+" original role names; zero external actions.";
$("start").onclick=()=>run(()=>{session=K.start(request());return {status:session.status,next:K.PROTOCOLS[0].label,reference:session.reference,sourceLimit:"NO_PERSONAL_OR_ABUSIVE_CONTENT"};});
$("propose").onclick=()=>run(()=>{
 if(!session)throw Error("Start a local session first");
 approveOnce();session=K.propose(session,request());
 return session.pending;
});
$("approve").onclick=()=>run(()=>{
 if(!session)throw Error("Start a local session first");
 approveOnce();session=K.decide(session,"YES",request());
 return {status:session.status,completed:session.history.length,last:session.history.at(-1),
   externalActions:session.executedExternalActions,
   next:K.PROTOCOLS[session.nextIndex]?.label||"LOCAL_PLAN_COMPLETE"};
});
$("veto").onclick=()=>run(()=>{
 if(!session||!session.pending)throw Error("No pending step; use CLEAR to withdraw the session");
 session=K.decide(session,"NO",null);
 return {status:session.status,last:session.history.at(-1),humanChoice:"NO",externalActions:0};
});
$("clear").onclick=()=>run(()=>{
 if(session)session=K.revoke(session);
 session=null;
 ["step-yes","review","owner","self","consent"].forEach(id=>$(id).checked=false);
 $("reference").value="";
 return "1-1=0 CLEAR. The in-memory session is no longer retained. No reports were sent.";
});
})();
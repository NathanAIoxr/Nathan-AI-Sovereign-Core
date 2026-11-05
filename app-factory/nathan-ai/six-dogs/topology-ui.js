/* Sovereign Micro/Macro interactive local workbench. No remote services. */
(function(){"use strict";
const core=window.NathanMicroMacro;
if(!core){const target=document.getElementById("macroStatus");if(target)target.textContent="Topology module unavailable.";return;}
let graph=core.emptyGraph();
const bus=core.createEventBus(),$=id=>document.getElementById(id);
function make(tag,value,cls){const n=document.createElement(tag);n.textContent=String(value);if(cls)n.className=cls;return n;}
function render(){const view=core.macroView(graph);$("macroStatus").textContent="Local topology revision "+view.revision+" · Stage "+view.stage+" · "+view.assets+" registered assets · "+view.eventCount+" events";
 const nodes=$("topologyNodes");nodes.replaceChildren();
 const ul=make("div","","topology-grid");
 for(const node of view.nodes){const item=make("article","", "topology-node");item.appendChild(make("strong",node.name));item.appendChild(make("small",node.layer));if(node.id==="workflow")item.appendChild(make("span","Active stage: "+view.stage));ul.appendChild(item);}nodes.appendChild(ul);
 const log=$("topologyLog");log.replaceChildren();if(!graph.events.length){log.appendChild(make("p","No local events recorded."));}else{for(const row of graph.events.slice(-8).reverse()){log.appendChild(make("div","#"+row.sequence+" · "+row.type+(row.step!==null?" · step "+(row.step+1):"")+(row.asset?" · "+row.asset:""),"micro-log-row"));}}
}
function apply(event){try{graph=core.applyEvent(graph,event);bus.publish("topology:changed",core.macroView(graph));render();}catch(e){$("macroStatus").textContent="Not applied: "+e.message;}}
function evaluate(){try{const x=core.inspect($("microPacket").value,{reference:$("microReference").value,status:$("microReview").value});$("microResult").textContent=JSON.stringify(x,null,2);
 $("microNotice").textContent=x.evidenceGate===1?"Source and human-supported-review label are present; this does not independently prove a claim.":"Source evidence remains unreviewed, missing, mixed or contradicted; content remains untouched."; }catch(e){$("microResult").textContent=e.message;}}
function register(){const id=$("assetId").value.trim();apply({type:"ASSET_REGISTERED",id,kind:$("assetKind").value});}
window.addEventListener("nathan:six-dogs-stage",ev=>{const detail=ev.detail;if(detail&&Number.isInteger(detail.index)&&detail.index>=0&&detail.index<6)apply({type:"STAGE_SELECTED",step:detail.index});});
$("microRun").addEventListener("click",evaluate);
$("assetAdd").addEventListener("click",register);
$("macroReset").addEventListener("click",()=>{if(!window.confirm("Reset only this in-memory topology view? Six Dogs session records are separate and unaffected."))return;graph=core.emptyGraph();render();});
$("topologyExport").addEventListener("click",()=>{const content=JSON.stringify({format:"nathan-six-dogs.topology-export",version:1,graph},null,2),url=URL.createObjectURL(new Blob([content],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download="nathan-six-dogs-topology.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 $("macroStatus").textContent="In-memory topology exported to a local JSON file.";});
render();
})();
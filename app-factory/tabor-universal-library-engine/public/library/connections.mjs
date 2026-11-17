import { adapters, signals, evaluateRoot } from "./root-core.mjs";
const $=id=>document.getElementById(id);
function make(tag,text){
  const n=document.createElement(tag);n.textContent=text;return n;
}
async function get(path){
  const url=new URL(path,new URL("./",import.meta.url));
  const response=await fetch(url);
  if(!response.ok)throw Error("Unavailable");
  return response.json();
}
function list(node,lines){node.replaceChildren(...lines.map(text=>make("li",text)));}
const states={ready:"Verified",unavailable:"Unavailable",unbound:"Unbound"};
async function loadConnections(){try{
  const receipt=await get("api/connections");
  $("connections-status").textContent=receipt.totals.ready+" of "+receipt.totals.discovered+
    " databases answered · "+receipt.totals.bound+" bound · "+receipt.restricted+" shown only in the totals.";
  list($("database-connections"),receipt.published.map(db=>db.title+" · "+(states[db.state]??"Unknown")));
  list($("provider-connections"),receipt.providers.map(item=>item.title+" · "+item.state));
}catch{$("connections-status").textContent="The live connection receipt is unavailable on this host.";}}
void loadConnections();
let sampleRun=0;
for(const button of document.querySelectorAll("[data-collection]"))button.addEventListener("click",async()=>{
  const run=++sampleRun;
  $("collection-status").textContent="Reading the selected collection…";
  $("collection-sample").replaceChildren();
  try{
    const sample=await get("api/collections/"+button.dataset.collection);
    if(run!==sampleRun)return;
    $("collection-status").textContent=sample.title+" · "+sample.rows.length+" live database rows";
    list($("collection-sample"),sample.rows.map(row=>row.title+" · "+row.category));
  }catch{
    if(run===sampleRun)$("collection-status").textContent="The collection could not be read.";
  }
});

const adapter=$("root-adapter");
for(const [key,record] of Object.entries(adapters))adapter.add(new Option(record.title,key));
function paintChecks(){
  $("root-result").replaceChildren();
  $("root-checks").replaceChildren(...adapters[adapter.value].checks.map((prompt,i)=>{
    const label=make("label",prompt),select=document.createElement("select");
    select.name=signals[i];
    for(const value of ["Unknown","Yes","No"])select.add(new Option(value,value.toLowerCase()));
    label.append(select);
    return label;
  }));
}
adapter.addEventListener("change",paintChecks);
$("root-example").addEventListener("click",()=>{
  const example=adapters[adapter.value];
  $("root-candidate").value=example.candidate;
  $("root-symptom").value=example.symptom;
  paintChecks();
  $("root-result").append(make("p","Example loaded. Set the checks to match the evidence you have."));
});
$("root-form").addEventListener("reset",()=>queueMicrotask(paintChecks));
$("root-form").addEventListener("submit",event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  try{
    const out=evaluateRoot({adapter:adapter.value,symptom:$("root-symptom").value,candidate:$("root-candidate").value,
      evidence:Object.fromEntries(signals.map(key=>[key,data.get(key)]))});
    $("root-result").replaceChildren(make("strong",out.conclusion),make("p","Candidate · "+out.candidate),make("p","Observed symptom · "+out.symptom));
    if(out.next)$("root-result").append(make("p","Next check · "+out.next));
  }catch(error){$("root-result").replaceChildren(make("p",error.message));}
});
paintChecks();

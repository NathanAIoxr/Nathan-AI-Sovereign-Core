import {catalog} from "./games.mjs";
import {domains,foundation,voices,symbols,newBridge,patternFor,pressSymbol,scoreArcade,findCartridges} from "./hive-core.mjs";
import {setupFlow} from "./hive-flow.mjs";
import {claim,enqueue,finish,listJobs} from "./hive-store.mjs";

const el=id=>document.getElementById(id);
const create=(tag,text)=>{
  const node=document.createElement(tag);
  if(text!==undefined) node.textContent=text;
  return node;
};
const category=el("domain-list"), cartridgeList=el("cartridges"), frame=el("game-frame");
const domainButtons=new Map(), voiceButtons=new Map();
let selectedDomain=domains[0], showAll=false, voice="nathan", bridge=newBridge(), frameKey;
const makeKey=()=>crypto.randomUUID?.()??String(Date.now())+"-"+Math.random().toString(36).slice(2);

setupFlow(el("flow"),{axis:el("axis"),forward:el("forward"),reverse:el("reverse"),pause:el("pause"),
  rate:el("rate"),status:el("flow-status")});

const crown=document.querySelector(".hero-art img"), gallery=document.querySelector(".gallery");
function artwork(){
  if(crown.naturalWidth>0){crown.hidden=false;gallery.hidden=false;}
}
crown.addEventListener("load",artwork,{once:true});
if(crown.complete) artwork();

function cartridgeLink(id, name){
  const link=create("a");
  link.href="./loc101.html?module="+id;
  link.append(create("span",String(id).padStart(3,"0")),document.createTextNode(" "+name));
  return link;
}

function showCartridges(){
  const entries=findCartridges(showAll?null:selectedDomain,el("cartridge-search").value);
  el("cartridge-count").textContent=entries.length+" cartridges";
  cartridgeList.replaceChildren(...entries.map(item=>cartridgeLink(item.id,item.title)));
  if(!entries.length) cartridgeList.append(create("p","No cartridges match."));
}

function setDomain(domain){
  selectedDomain=domain;
  showAll=false;
  el("all-cartridges").setAttribute("aria-pressed","false");
  for(const [id,button] of domainButtons) button.setAttribute("aria-pressed",String(id===domain.id));
  el("domain-title").textContent=domain.name;
  el("domain-mode").textContent=domain.mode;
  el("domain-copy").textContent=domain.description;
  el("voice-line").textContent=voices[voice].line(domain.short);
  const station=domain.station==="logic"?"dial":domain.station;
  if(el("game").value!==station){ el("game").value=station; loadGame(); }
  showCartridges();
}

for(const domain of domains){
  const button=create("button");
  button.type="button";
  const glyph=create("span","⬡");
  glyph.setAttribute("aria-hidden","true");
  button.append(glyph,document.createTextNode(domain.name));
  button.addEventListener("click",()=>setDomain(domain));
  domainButtons.set(domain.id,button);
  category.append(button);
}
el("cartridge-search").addEventListener("input",showCartridges);
el("all-cartridges").addEventListener("click",()=>{
  showAll=!showAll;
  el("all-cartridges").setAttribute("aria-pressed",String(showAll));
  showCartridges();
});
for(const [name,attribute,description,,id] of foundation){
  const link=cartridgeLink(id,name+" · "+attribute);
  link.append(create("span",description));
  el("foundation-links").append(link);
}

function bridgeHUD(message){
  for(const key of ["attack","charge","buff","shield"]) el(key).textContent=bridge[key];
  el("bridge-score").textContent=bridge.score;
  el("voice-role").textContent=voices[voice].role;
  el("voice-line").textContent=voices[voice].line(selectedDomain.short);
  const pattern=patternFor(voice,bridge.round);
  el("sequence").replaceChildren(...pattern.map((value,index)=>{
    const token=create("span",value);
    token.className="symbol"+(index<bridge.step?" is-done":"");
    token.setAttribute("aria-label",symbols[value]+(index<bridge.step?", entered":""));
    return token;
  }));
  if(message!==undefined) el("bridge-status").textContent=message;
}
function loadGame(){
  bridge.lastScore=0;bridge.complete=false;
  frameKey=makeKey();
  const url=new URL("./",location.href);
  url.searchParams.set("game",el("game").value);
  url.searchParams.set("embed","hive");
  url.searchParams.set("session",frameKey);
  frame.src=url.href;
}
for(const item of Object.values(catalog)) el("game").add(new Option(item.title,item.id));
el("game").addEventListener("change",loadGame);
window.addEventListener("message",event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow
    ||event.data?.type!=="tabor:hive-arcade"||event.data.session!==frameKey) return;
  const message=scoreArcade(bridge,event.data.score,event.data.done===true);
  if(message) bridgeHUD(message);
});
for(const [id,entry] of Object.entries(voices)){
  const button=create("button",entry.name);
  button.type="button";
  button.addEventListener("click",()=>{
    voice=id;
    bridge.step=0;
    for(const [key, control] of voiceButtons) control.setAttribute("aria-pressed",String(id===key));
    bridgeHUD("");
  });
  button.setAttribute("aria-pressed",String(id===voice));
  voiceButtons.set(id,button);
  el("voices").append(button);
}
for(const [symbol,name] of Object.entries(symbols)){
  const button=create("button",symbol);
  button.type="button";
  button.setAttribute("aria-label",name);
  button.addEventListener("click",()=>bridgeHUD(pressSymbol(bridge,voice,symbol)));
  el("pads").append(button);
}
el("reset-bridge").addEventListener("click",()=>{
  bridge=newBridge();
  loadGame();
  bridgeHUD("Bridge cleared.");
});
setDomain(selectedDomain);
bridgeHUD();

const slots=Array.from({length:2},()=>({worker:null,job:null,lease:null,timeout:null,finishing:false})), beeState=el("bee-state"), audit=el("audit");
let auditing=false, timer, workerError=false, signature;
function dispose(slot){
  slot.worker?.terminate();slot.worker=null;
  clearTimeout(slot.timeout);
}
function setup(slot){
  if(slot.worker) return;
  slot.worker=new Worker(new URL("./hive-bee.mjs",import.meta.url),{type:"module"});
  slot.worker.addEventListener("message",event=>{void complete(slot,event.data);});
  slot.worker.addEventListener("error",event=>{
    event.preventDefault();
    if(slot.job) void complete(slot,{key:slot.job.key,lease:slot.lease,ok:false,error:"Worker could not finish."},true);
  });
}
async function complete(slot, outcome, restart=false){
  if(!slot.job||slot.job.key!==outcome.key||slot.lease!==outcome.lease||slot.finishing) return;
  slot.finishing=true;
  clearTimeout(slot.timeout);
  if(restart) dispose(slot);
  try{await finish(slot.lease,Date.now(),outcome);}
  catch(error){fail(error);}
  finally {slot.job=null;slot.finishing=false;}
  schedule(0);
}

function fail(error){
  workerError=true;
  beeState.textContent="Local workers unavailable. "+error.message;
  audit.disabled=true;
  for(const slot of slots) dispose(slot);
}

function schedule(delay){
  clearTimeout(timer);
  if(!workerError) timer=setTimeout(()=>{void poll();},delay);
}

function renderJobs(jobs){
  const latest=jobs[0]?.batch;
  const batch=jobs.filter(job=>job.batch===latest);
  const key=batch.map(job=>[job.key,job.status,job.attempts,job.error]).flat().join("|");
  const active=jobs.some(job=>job.status==="queued"||job.status==="running");
  audit.disabled=active;
  if(signature===key) return active;
  signature=key;
  const counts={queued:0,running:0,done:0,failed:0};
  for(const job of batch) counts[job.status]++;
  el("job-counts").replaceChildren(...Object.entries(counts).map(([name,count])=>create("span",count+" "+name)));
  el("jobs").replaceChildren(...batch.map(job=>{
    const row=create("li");
    const message=job.result?.summary??job.error??(job.status==="running"?"Attempt "+job.attempts:"Waiting");
    row.append(create("strong",job.label),create("strong",job.status),create("span",message));
    return row;
  }));
  beeState.textContent=!batch.length?"Ready for an audit.":active?"Working through the audit queue.":
    counts.failed?"Audit finished with "+counts.failed+" failed checks.":"Audit complete. "+counts.done+" checks passed.";
  return active;
}

async function poll(){
  if(auditing||workerError) return;
  auditing=true;
  try{
    for(const slot of slots){
      if(slot.job) continue;
      slot.lease=makeKey();
      slot.job=await claim(slot.lease,Date.now());
      if(!slot.job) continue;
      const task={key:slot.job.key,kind:slot.job.kind,lease:slot.lease};
      try{
        setup(slot);
        slot.worker.postMessage(task);
        slot.timeout=setTimeout(()=>{void complete(slot,{...task,ok:false,error:"Worker timed out."},true);},10_000);
      }catch(error){void complete(slot,{...task,ok:false,error:error.message},true);}
    }
    schedule(renderJobs(await listJobs())?300:1800);
  }catch(error){fail(error);}
  finally{auditing=false;}
}

audit.addEventListener("click",async()=>{
  audit.disabled=true;
  try {await enqueue(makeKey(),Date.now());schedule(0);}
  catch(error){fail(error);}
});
if("Worker" in window&&"indexedDB" in window) schedule(0);
else fail(new Error("This device has no worker or IndexedDB access."));
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});

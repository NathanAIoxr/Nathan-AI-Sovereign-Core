import { attachDigitTrackBaller } from "../../tabor-tracker-ball/public/digit-input.mjs";
import { analyze, arm, force, identity, project, releaseLinks, rotate, sourceIndex, UniversalBridgeBus, validCircuit, ClassNames } from "./engine.mjs";
import { actLab, active, drawLab, gripLab, labPoint, labState, labStep, moveLab, releaseLab } from "./labs.mjs";

const $=key=>document.getElementById(key);
const set=(key,value)=>{const node=$(key);if(node.textContent!==String(value))node.textContent=value;};
const stage=$("pad"),ctx=stage.getContext("2d"),controls=$("lab-controls");
const directions={left:[-1,0],up:[0,-1],down:[0,1],right:[1,0]};
const numberOrder=[65,66,67,68,69,77,80,81,84,94,96,98,101];
const activeOrder=["ring","grapple","village","sword","fishing",...numberOrder.map(String)];
const puckPhysics=new Set(["65","66","68","69","81","94","96","98","101"]);
const rewardLabels={"bottom-clear":"Reloaded","magnetic-lock":"Aim & attack","skill-shot":"Attempt used","guard":"Shield","surge":"Rapid fire"};
let orientation=identity(),tilt=[0,0],sensor=false;
let bus=new UniversalBridgeBus(),id="101",lab=null,entries=[],catalog,pack,selectedClass="",phase=0,sequence=[1,2,3,4],previous=0;
let vault=[],pkAt=0;
const storageKey="tabor-universal-library-v7-vault";
try{
  const data=JSON.parse(localStorage.getItem(storageKey)||"[]");
  if(Array.isArray(data))vault=data.filter(x=>typeof x?.text==="string"&&typeof x?.tags==="string").slice(0,60);
}catch{}
function create(tag,text,attrs={}){
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
  return node;
}
function button(text,handler,attrs={}){
  const node=create("button",text,{type:"button",...attrs});node.addEventListener("click",handler);return node;
}
function runStatus(text){if(text)set("status",text);}
function updateBridge(){
  const {enemy,shield,ammo,charge,rapid,result}=bus.round;
  set("enemy",enemy);set("shield",shield);set("ammo",rapid>0?"Rapid":ammo);set("charge",charge+"/8");
  set("reward",result==="won"?"Cleared":rewardLabels[bus.last]??bus.last);
}
function soon(){return performance.now()+12000+Math.random()*6000;}
function eventControls(){
  $("pk").addEventListener("change",()=>{
    pkAt=$("pk").checked?soon():0;
    set("pk-note",pkAt?"Brief surge every 12–18 seconds while this tab is active.":"");
  });
  $("reset").addEventListener("click",()=>{bus=new UniversalBridgeBus();updateBridge();runStatus("Bridge reset.");});
}
function paintSequence(){
  const nodes=sequence.map((n,i)=>button(n,()=>{
    if(n!==phase+1){phase=0;runStatus("Start at 1 and follow the sequence.");}
    else if(++phase===4){
      const granted=bus.emit("bottom-clear");
      phase=0;sequence=shuffleSequence();
      runStatus(granted?"Sequence complete · one top attempt loaded.":"Enemy cleared. Reset the bridge for a new round.");
    }
    paintSequence();updateBridge();$("sequence").children[i].focus({preventScroll:true});
  },{class:n<=phase?"done":""}));
  $("sequence").replaceChildren(...nodes);
}
function shuffleSequence(){
  const next=[1,2,3,4];
  for(let i=3;i>0;i--){const j=Math.floor(Math.random()*(i+1));[next[i],next[j]]=[next[j],next[i]];}
  return next;
}
function catalogRows(){
  const mode=$("filter").value,query=$("search").value.trim().toLowerCase();
  const rows=mode==="active"?activeOrder.map(key=>entries.find(x=>String(x.id)===key)??{id:key,lcClass:key==="village"?"BS":"GV",title:active[key][0]}):
    mode==="known"?entries.filter(x=>x.title):entries;
  return rows.filter(x=>[x.id,x.title,x.description,ClassNames[x.lcClass],x.lcClass].join(" ").toLowerCase().includes(query));
}
function showCatalog(){
  const rows=catalogRows();
  const nodes=rows.map(row=>{
    const key=String(row.id),title=row.title||"Source slot awaiting recovery";
    const node=button(title,()=>choose(key,true),{class:"entry","aria-current":String(key===id)});
    node.prepend(create("small",(Number.isInteger(row.id)?"#"+row.id+" · ":"")+
      (active[key]?"Runnable":row.title?"Ledger only":"Source gap")+(row.lcClass?" · "+row.lcClass:"")));
    return node;
  });
  if(!nodes.length)nodes.push(create("p","No matching cartridges."));
  $("entries").replaceChildren(...nodes);
}
function choose(next,fromCatalog=false){
  id=String(next);lab=active[id]?labState(id):null;orientation=identity();selectedClass="";
  input.cancel();
  const row=entries.find(x=>String(x.id)===id);
  const info=active[id],className=row?.lcClass?(row.lcClass+" · "+ClassNames[row.lcClass]):id==="village"?"BS · The Bible":info?"GV · Recreation":"Source recovery";
  set("lab-class",(row?"#"+id+" · ":"")+className);
  set("lab-title",id==="81"?pack.title:info?.[0]??row?.title??"Source slot");
  set("lab-description",info?.[2]??row?.description??"Original source text for this numbered entry is unavailable.");
  set("placeholder",row?.title?"This entry is in Nathan Tabor’s ledger and is awaiting a runnable cartridge.":"This slot is reserved for the original source.");
  $("placeholder").hidden=Boolean(lab);stage.hidden=!lab;
  $("action").disabled=!lab;set("action",info?.[1]??"Cartridge pending");
  for(const key of Object.keys(directions))document.querySelector("[data-motion='"+key+"']").disabled=!lab;
  set("curator",id==="81"?pack.cast_roles.curator_intro:info?" "+info[2]:" Select a runnable cartridge to begin.");
  set("coach",id==="81"?pack.cast_roles.nathan_ai_tip:info?" Use the lower sequence whenever you need to reload.":" Select a runnable cartridge for input coaching.");
  set("status","");renderControls();showCatalog();
  if(fromCatalog){
    const url=new URL(location.href);url.searchParams.set("module",id);history.replaceState(null,"",url);
    if(matchMedia("(max-width:730px)").matches)$("catalog-panel").open=false;
    (lab?stage:$("catalog-panel").querySelector("summary")).focus({preventScroll:true});
  }
}
function renderControls(){
  controls.replaceChildren();
  if(!lab)return;
  if(id==="94"){
    const select=create("select",undefined,{"aria-label":"Choose class shelf"});
    for(const [key,label] of Object.entries(ClassNames))select.add(new Option(key+" · "+label,key));
    select.prepend(new Option("Choose a class",""));select.value=selectedClass;
    select.addEventListener("change",()=>{selectedClass=select.value;});
    const tools=create("div",undefined,{class:"lab-tools"});tools.append(select);controls.append(tools);
  }
  if(id==="66"){
    const speed=create("input",undefined,{type:"range",min:".25",max:"1.85",step:".01","aria-label":"Probe release speed",id:"speed"});
    speed.value=lab.speed;speed.addEventListener("input",()=>{lab.speed=Number(speed.value);});
    const text=create("label","Release speed",{for:"speed"});const tools=create("div",undefined,{class:"lab-tools"});
    tools.append(text,speed);controls.append(tools);
  }
  if(id==="81"){
    const upload=create("input",undefined,{type:"file",accept:".json,application/json","aria-label":"Load Circuit Lab cartridge JSON"});
    const tools=create("div",undefined,{class:"lab-tools"});tools.append(create("span","Load Circuit Lab JSON"),upload);controls.append(tools);
    upload.addEventListener("change",async ()=>{
      const file=upload.files[0];if(!file)return;
      try {
        if(file.size>12000)throw Error("Size");
        const next=JSON.parse(await file.text());
        if(!validCircuit(next))throw Error("Schema");
        if(id!=="81")return;
        pack=next;choose("81");runStatus("Circuit cartridge loaded in this session.");
      }catch{if(id==="81")runStatus("This file does not match the Circuit Lab v.7 schema.");}
    });
  }
  if(id==="96")renderVault();
}
function renderVault(){
  const tools=create("div",undefined,{class:"lab-tools"}),text=create("textarea",undefined,{rows:"2",maxlength:"1200",placeholder:"Write a note","aria-label":"Vault note"});
  const tags=create("input",undefined,{type:"text",maxlength:"100",placeholder:"Tags","aria-label":"Vault tags"});
  const search=create("input",undefined,{type:"search",placeholder:"Search vault","aria-label":"Search vault"});
  const list=create("ol",undefined,{id:"vault-list"});
  function render(){
    const q=search.value.trim().toLowerCase();
    list.replaceChildren(...vault.filter(n=>(n.text+" "+n.tags).toLowerCase().includes(q)).map(n=>create("li",n.text+(n.tags?" · "+n.tags:""))));
  }
  const save=button("Save note",()=>{
    if(!text.value.trim()){runStatus("Write a note first.");return;}
    if(vault.length>=60){runStatus("Vault is full for this browser.");return;}
    const next=[{text:text.value.trim(),tags:tags.value.trim()},...vault];
    try{localStorage.setItem(storageKey,JSON.stringify(next));}
    catch{runStatus("The browser could not save this note.");return;}
    vault=next;text.value="";tags.value="";render();runStatus("Saved on this browser.");
  });
  search.addEventListener("input",render);tools.append(text,tags,save,search);controls.append(tools,list);render();
}
function verify(){
  const trial=new UniversalBridgeBus();trial.emit("bottom-clear");trial.emit("magnetic-lock");
  const launcher=trial.round.ammo===4&&trial.round.bonus===20;
  const after=project(rotate(identity(),0,0,Math.PI/2),[1,0,0]);
  const orientationOK=Math.abs(after[0])<1e-8&&Math.abs(after[1]-1)<1e-8;
  const fieldOK=Math.abs(force([1,0],[{p:[0,0],strength:1}],0)[0]*4-force([.5,0],[{p:[0,0],strength:1}],0)[0])<1e-8;
  const tracks=analyze([{x:-.3,y:0,t:0},{x:.31,y:0,t:130}]).kind==="swipe";
  const registry=entries.length===101&&entries.filter(x=>x.title).length===101&&activeOrder.every(key=>labState(key));
  if(!launcher||!orientationOK||!fieldOK||!tracks||!registry||!validCircuit(pack)||!arm([.5,0]).reachable)return "Verification failed.";
  return "Passed · 101 Tracker Ball entries · "+activeOrder.length+" runnable · rotation, field, stroke, and bridge.";
}
function applyAction(){
  if(!lab)return;
  runStatus(actLab(id,lab,selectedClass,bus,pack,verify));updateBridge();
}
function circuitCoords(p){
  if(id!=="81"||!pack.physics_profile.allow_full_quaternion)return p;
  const [a,c]=project(orientation,[1,0,0]),[b,d]=project(orientation,[0,1,0]),det=a*d-b*c;
  if(Math.abs(det)<.12)return p;
  return [(d*p[0]-b*p[1])/det,(a*p[1]-c*p[0])/det];
}
function keyboardMotion(key){
  const d=directions[key];if(!lab||!d)return;
  if(puckPhysics.has(id)&&id!=="81")orientation=rotate(orientation,d[1]*.23,d[0]*.23,0);
  if(id==="77")tilt=tilt.map((v,i)=>Math.min(.45,Math.max(-.45,v+d[i]*.05)));
  if(id==="village"){
    const x=Math.max(0,Math.min(2,lab.tile%3+d[0])),y=Math.max(0,Math.min(2,Math.floor(lab.tile/3)+d[1]));
    lab.tile=y*3+x;
  }else moveLab(id,lab,lab.point.map((v,i)=>Math.min(1.25,Math.max(-1.25,v+d[i]*.14))),false);
}
for(const node of document.querySelectorAll("[data-motion]"))node.addEventListener("click",()=>keyboardMotion(node.dataset.motion));
stage.addEventListener("keydown",event=>{
  if(event.key.startsWith("Arrow")){event.preventDefault();keyboardMotion(event.key.slice(5).toLowerCase());}
  else if(event.code==="Space"||event.code==="Enter"){event.preventDefault();if(!event.repeat)applyAction();}
});
function setPoint(p,trace=false){
  if(!lab)return;
  let local=labPoint(stage,p);
  if(id==="village"){
    const x=Math.max(0,Math.min(2,Math.floor(local[0]/.61+1.5))),y=Math.max(0,Math.min(2,Math.floor(local[1]/.53+1.5)));
    lab.tile=y*3+x;
  }else moveLab(id,lab,circuitCoords(local),trace);
}
let prior=[0,0],wasTwist=0;
const input=attachDigitTrackBaller(stage,{
  onStart(p){prior=[0,0];setPoint(p);},
  onMove(g){
    if(!lab)return;
    if(puckPhysics.has(id)&&id!=="81")orientation=rotate(orientation,(g.dy-prior[1])*3,(g.dx-prior[0])*3,g.turn*.012);
    prior=[g.dx,g.dy];setPoint(g.end,id==="68");
  },
  onEnd(g){
    if(!lab)return;
    if(g.kind==="hold"){bus.emit("guard");runStatus("Shield restored.");}
    else runStatus(releaseLab(id,lab,g,bus,lab.time*1000));
    updateBridge();
  },
  onContact(g){
    if(id==="81"&&lab)lab.contacts=g.points.map(p=>circuitCoords(labPoint(stage,p)));
  },
  onGripStart(){wasTwist=0;},
  onGripMove(g){
    if(!lab)return;
    gripLab(id,lab,g);
    if(puckPhysics.has(id))orientation=rotate(orientation,0,0,g.twist-wasTwist);
    wasTwist=g.twist;
    setPoint({x:g.start.x+g.dx*stage.clientWidth/Math.min(stage.clientWidth,stage.clientHeight),
      y:g.start.y+g.dy*stage.clientHeight/Math.min(stage.clientWidth,stage.clientHeight)});
    if(id==="66"&&$("speed"))$("speed").value=lab.speed;
  },
  onGripEnd(g){
    if(!lab)return;
    if(id==="81"){
      lab.contacts=[];
      if(g.peakContacts>1)applyAction();
    }
    if(g.peakContacts>1&&(id==="ring"||id==="grapple")){
      bus.emit("guard");runStatus("Two-contact guard · shield restored.");updateBridge();
    }
  },
  onGripCancel(){if(id==="81"&&lab)lab.contacts=[];}
});
$("action").addEventListener("click",applyAction);
function gyro(event){
  if(!sensor||typeof event.gamma!=="number"||typeof event.beta!=="number")return;
  tilt=[Math.max(-.45,Math.min(.45,event.gamma/80)),Math.max(-.45,Math.min(.45,event.beta/135))];
}
$("tilt").addEventListener("click",async ()=>{
  const sensorAPI=globalThis.DeviceOrientationEvent;
  if(!sensorAPI){runStatus("Tilt sensor unavailable. Use the direction controls.");return;}
  if(sensor){
    sensor=false;tilt=[0,0];window.removeEventListener("deviceorientation",gyro);
    set("tilt","Enable tilt");$("tilt").setAttribute("aria-pressed","false");return;
  }
  try{
    if(typeof sensorAPI.requestPermission==="function"&&await sensorAPI.requestPermission()!=="granted")
      throw Error("Permission denied");
    sensor=true;window.addEventListener("deviceorientation",gyro);
    set("tilt","Disable tilt");$("tilt").setAttribute("aria-pressed","true");runStatus("Tilt enabled. Roll the device to change the field.");
  }catch{runStatus("Tilt permission unavailable. Use the direction controls.");}
});
function frame(ts){
  const dt=Math.max(0,Math.min(.045,(ts-(previous||ts))/1000));previous=ts;
  if(!document.hidden){
    if(pkAt&&ts>=pkAt){bus.emit("surge");pkAt=soon();runStatus("PK surge · temporary rapid fire.");}
    bus.tick(dt*1000);
    if(lab){
      labStep(id,lab,dt,tilt,pack);
      const q=sensor&&id!=="77"?rotate(orientation,tilt[1],tilt[0],0):orientation;
      drawLab(ctx,stage,id,lab,{q,tilt,pack,vault,assist:bus.round.assist>0});
    }
    updateBridge();
  }
  requestAnimationFrame(frame);
}
try{
  const response=await fetch("./catalog.json");
  if(!response.ok)throw Error("Catalog fetch");
  catalog=await response.json();pack=catalog.circuit;entries=sourceIndex(catalog.ledger,catalog.trackerSupplement);
  if(!validCircuit(pack))throw Error("Catalog cartridge invalid");
  set("catalog-count",activeOrder.length+" runnable · "+entries.filter(x=>x.title).length+" source entries · 101 numbered slots");
  $("filter").addEventListener("change",showCatalog);$("search").addEventListener("input",showCatalog);
  if(matchMedia("(max-width:730px)").matches)$("catalog-panel").open=false;
  const requested=new URL(location.href).searchParams.get("module");
  choose(requested&&(Object.hasOwn(active,requested)||entries.some(x=>String(x.id)===requested))?requested:"101");
  for(const [title,url] of Object.values(releaseLinks))$("release-links").append(create("a",title,{href:url}));
  paintSequence();eventControls();requestAnimationFrame(frame);
}catch(error){
  set("lab-title","Catalog unavailable");set("lab-description","Reload the page to retry.");
  $("action").disabled=true;
  console.error(error);
}

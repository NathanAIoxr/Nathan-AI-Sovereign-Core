"use strict";
(function({cartridges},get){
  const key="tap-that-command-center-stage-v1";
  let offline=false,stopped=false;
  let pending=[],events=[];
  try {
    const saved=JSON.parse(localStorage.getItem(key)??"{}");
    if(Array.isArray(saved.pending))pending=saved.pending.filter(item=>cartridges.includes(item)).slice(-50);
    if(Array.isArray(saved.events))events=saved.events.filter(item=>typeof item==="string").slice(-20);
  } catch {}
  function paint(){
    get("connection").textContent=offline?"OFFLINE (SIMULATED)":"ONLINE";
    get("pending").textContent=(stopped?"Stopped. ":"")+pending.length+" queued fixture actions.";
    get("offline").setAttribute("aria-pressed",String(offline));
    get("stop").setAttribute("aria-pressed",String(stopped));
    get("stop").textContent=stopped?"RESUME DECK":"BIG RED BUTTON · STOP";
    get("log").replaceChildren();
    for(const message of [...events].reverse()){
      const row=document.createElement("li");row.textContent=message;get("log").append(row);
    }
    for(const tile of get("deck").children)tile.disabled=stopped;
    try{localStorage.setItem(key,JSON.stringify({pending,events:events.slice(-20)}));}catch{}
  }
  function record(message){events=[...events.slice(-19),message];}
  function sync(){
    if(stopped||offline)return;
    for(const action of pending)record("SIMULATED · "+action);
    pending=[];
  }
  for(const action of cartridges){
    const button=document.createElement("button");
    button.textContent=action;
    button.onclick=()=>{
      if(stopped)return;
      if(pending.length>=50){record("Queue full. Resume the staging connection.");paint();return;}
      pending.push(action);sync();paint();
    };
    get("deck").append(button);
  }
  get("offline").onclick=()=>{offline=!offline;sync();paint();};
  get("stop").onclick=()=>{stopped=!stopped;sync();paint();};
  sync();paint();
})({
  "cartridges": [
    "PUBLISH ALL",
    "DROP ANNOUNCEMENT",
    "INTAKE FORM",
    "INVOICE",
    "DEPLOY BUILD",
    "PURGE CACHE",
    "GO LIVE",
    "LOCKDOWN"
  ]
},id => document.getElementById(id));

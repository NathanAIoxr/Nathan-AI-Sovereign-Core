"use strict";
(function({devices},get){
  const bay=get("devices");
  let online=false,stress=0,deadline=0,timer;
  const mounted=new Set(),buttons=[];
  function event(message){
    const row=document.createElement("li");
    row.textContent=message;
    get("log").prepend(row);
    while(get("log").children.length>8)get("log").lastElementChild.remove();
  }
  function paint(){
    get("telemetry").value=stress;
    get("patient").textContent=["CALM","WHIMPER","SQUIRM","FULL PANIC"][Math.min(3,Math.floor(stress/25))];
    get("irq").disabled=!online;get("abort").disabled=!online;
    for(const button of buttons)button.disabled=!online;
  }
  function trip(){
    online=false;clearInterval(timer);get("boot").textContent="ER HANDOFF";
    event("er_watchdog.ko: simulation halted. Event state recorded.");paint();
  }
  for(const name of devices){
    const button=document.createElement("button");buttons.push(button);
    button.textContent="/dev/"+name;button.setAttribute("aria-pressed","false");
    button.onclick=()=>{
      if(mounted.has(name))mounted.delete(name);else mounted.add(name);
      button.setAttribute("aria-pressed",String(mounted.has(name)));
      event("/dev/"+name+(mounted.has(name)?" mounted":" unmounted"));
    };
    bay.append(button);
  }
  function tick(){
    const left=Math.max(0,deadline-Date.now());
    const minutes=String(Math.floor(left/60000)).padStart(2,"0");
    const seconds=String(Math.floor(left/1000)%60).padStart(2,"0");
    const hundredths=String(Math.floor(left/10)%100).padStart(2,"0");
    get("watchdog").textContent=minutes+":"+seconds+"."+hundredths;
    if(!left)trip();
  }
  get("power").onclick=()=>{
    clearInterval(timer);online=true;stress=0;mounted.clear();deadline=Date.now()+299000;
    for(const button of buttons)button.setAttribute("aria-pressed","false");
    get("boot").textContent="TWEEZER-OS ONLINE";get("log").replaceChildren();
    event("Boot complete. Virtual hardware bay ready.");tick();paint();timer=setInterval(tick,50);
  };
  get("irq").onclick=()=>{stress=Math.min(100,stress+25);event("irq_flinch: +25 simulated stress.");paint();if(stress===100)trip();};
  get("abort").onclick=trip;
  paint();
})({
  "devices": [
    "tweezers0",
    "flashlight0",
    "magnifier0",
    "needle0",
    "lighter0",
    "icecube0",
    "alcohol0",
    "clippers0",
    "swaddle0",
    "helper0",
    "bribe0",
    "spoon0"
  ]
},id => document.getElementById(id));

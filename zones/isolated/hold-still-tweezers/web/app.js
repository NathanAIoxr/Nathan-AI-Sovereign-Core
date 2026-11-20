"use strict";
(function({cartridges},get){
  const mission=get("mission"),table=get("table"),target=get("target");
  for(const [name] of cartridges){const item=document.createElement("option");item.textContent=name;mission.append(item);}
  let active=false,light=false,holdUntil=0,deadline=0,nextShift=0,hits=0,timer,cartridge;
  function showControls(){
    get("light").disabled=!active;get("hold").disabled=!active;get("abort").disabled=!active;
    target.disabled=!active||!light;
  }
  function finish(message){
    active=false;clearInterval(timer);get("status").textContent=message;showControls();
  }
  function move(){
    target.style.left=(16+Math.random()*68)+"%";
    target.style.top=(20+Math.random()*60)+"%";
  }
  get("start").onclick=()=>{
    clearInterval(timer);active=true;light=false;holdUntil=0;hits=0;cartridge=cartridges[mission.selectedIndex];
    deadline=Date.now()+30000;nextShift=Date.now()+cartridge[1];table.classList.remove("lit");move();
    get("clock").textContent="00:30";get("round").textContent=cartridge[0];get("status").textContent="Turn on the flashlight.";
    showControls();timer=setInterval(()=>{
      const now=Date.now(),left=Math.max(0,Math.ceil((deadline-now)/1000));
      get("clock").textContent="00:"+String(left).padStart(2,"0");
      if(!left){finish("ER RUN · Watchdog ended the round.");return;}
      if(now>=nextShift&&now>=holdUntil){move();nextShift=now+cartridge[1];}
    },100);
  };
  get("light").onclick=()=>{
    light=!light;table.classList.toggle("lit",light);showControls();
    get("status").textContent=light?"Tap the moving prop, or hold the table steady.":"Flashlight off.";
  };
  get("hold").onclick=()=>{
    if(Date.now()<holdUntil)return;
    holdUntil=Date.now()+850;
    get("status").textContent="Steady. Tap the prop.";
  };
  target.onclick=()=>{
    if(!active||!light||Date.now()>=deadline)return;
    hits++;
    if(hits===cartridge[2]){finish("CLEAR · "+hits+" precision taps.");return;}
    get("status").textContent=hits+" / "+cartridge[2]+" precision taps.";
    move();
  };
  get("abort").onclick=()=>finish("ER RUN · Round stopped.");
  showControls();
})({
  "cartridges": [
    [
      "Nostril Toy Rescue",
      1000,
      3
    ],
    [
      "Backyard BB Extraction",
      890,
      4
    ],
    [
      "Bathroom Surgery Gauntlet",
      750,
      5
    ],
    [
      "Micro-Glass Shard",
      660,
      6
    ],
    [
      "Rogue Eyebrow",
      570,
      7
    ]
  ]
},id => document.getElementById(id));

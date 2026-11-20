"use strict";
(function({channels},get){
  let channel=1;
  const watched=new Set();
  const dial=get("dial");
  function tune(number){
    channel=(number+12)%13+1;
    dial.value=channel;
    const show=channels[channel];
    get("channel").textContent="CH "+String(channel).padStart(2,"0");
    get("program").textContent=show?.[0]??"STATIC";
    get("premise").textContent=show?.[1]??"Turn the dial to find a program.";
    get("perk").textContent=show?.[3]??"";
    get("watch").disabled=!show||watched.has(channel);
    get("count").textContent=watched.size+" / 4 blueprints";
  }
  dial.oninput=()=>tune(Number(dial.value));
  get("left").onclick=()=>tune(channel-1);
  get("right").onclick=()=>tune(channel+1);
  get("watch").onclick=()=>{
    const show=channels[channel];
    if(!show||watched.has(channel))return;
    watched.add(channel);
    const item=document.createElement("li");
    item.textContent=show[2];
    get("shelf").append(item);
    tune(channel);
  };
  tune(1);
})({
  "channels": {
    "2": [
      "Sheriff Boss & The Creek-Jumpers",
      "Moonshine runner launches 'The Boar’s Head' muscle car over a washed-out wooden bridge.",
      "Cinderblock & Plywood BMX Ramp",
      "Mid-Air Freeze-Frame Narrator & +25% Jump Airtime"
    ],
    "5": [
      "The Barn-Welder Brigade",
      "Four misfits locked in a tin-roof shed weld an armored cabbage cannon in 60 seconds.",
      "Trash-Can Lid Riot Shield & PVC Air Cannon",
      "Instant Barn Assembly (No wasted nails)"
    ],
    "8": [
      "Backwoods Pocket-Knife Fixer",
      "Calm problem-solver defuses traps using pine sap, copper wire, and a pocket knife.",
      "Bottle-Rocket Tripwire & Surgical-Tubing Slingshot",
      "Rabbit-Ear Foil Walkie-Talkie Intercept"
    ],
    "11": [
      "Saturday Morning Battle-Toons",
      "Transforming metal knights shout moral absolutes before the credits roll.",
      "Cardboard-Box Mech Armor & Red-Clay Camo",
      "Protect the Innocence Honor Shield"
    ]
  }
},id => document.getElementById(id));

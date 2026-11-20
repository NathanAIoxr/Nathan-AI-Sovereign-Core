"use strict";
(function({sayings},get){
  const options=get("moves");
  let stamina=100,bike=false,deadline=0,ended=false,interval;
  function grade(){return stamina>=90?"Fine & Good":stamina>=70?"Fair":stamina>=45?"Middling":stamina>0?"Ordinary":"Poor / Grounded";}
  function story(place,message){get("place").textContent=place;get("story").textContent=message;get("status").textContent=grade();}
  function choices(list){
    options.replaceChildren();
    for(const [label,action] of list){
      const button=document.createElement("button");
      button.textContent=label;
      button.onclick=()=>{if(!ended)action();};
      options.append(button);
    }
  }
  function finish(message){
    ended=true;clearInterval(interval);choices([]);
    get("target").disabled=true;
    story("Screen Door",message);
  }
  function updateClock(){
    const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
    get("clock").textContent=seconds===60?"01:00":"00:"+String(seconds).padStart(2,"0");
    if(!seconds)finish("The screen door slammed. You're grounded.");
  }
  function porch(){
    if(Date.now()>=deadline){updateClock();return;}
    story("Back Porch","The third step creaks. You have one last move.");
    choices([
      ["SKIP THE THIRD STEP",()=>{if(Date.now()<deadline)finish("You made it home before the screen door slammed.");else updateClock();}],
      ["TAKE THE THIRD STEP",()=>finish("The step squeaked. Mom opened the screen door.")]
    ]);
  }
  function dusk(path){
    if(!bike&&path==="Bike route"){stamina=Math.max(0,stamina-35);if(!stamina){finish("The front fork gave out and you ran out of stamina.");return;}story("Flint Creek","The front fork gave out. Take the high road.");return;}
    if(path==="High road")stamina=Math.max(0,stamina-15);
    if(stamina===0){finish("You ran out of stamina on the way home.");return;}
    deadline=Date.now()+60000;interval=setInterval(updateClock,200);updateClock();
    story("Streetlight Buzz",path+". The streetlight came on. Get back before the screen door slams.");
    choices([["RUN TO THE PORCH",porch],["GARDEN HOSE",()=>{if(Date.now()<deadline){stamina=Math.min(100,stamina+25);porch();}else updateClock();}]]);
  }
  function start(){
    clearInterval(interval);stamina=100;bike=false;deadline=0;ended=false;get("clock").textContent="01:00";get("target").disabled=false;
    story("Flint Creek","Upstream rain has closed the creek crossing.");
    choices([["INSPECT TEETH & HOOVES",()=>{story("Backyard","The curbside BMX has a cracked fork. Take the repaired bike from the shed.");choices([["TAKE THE REPAIRED BIKE",()=>{bike=true;dusk("Bike route");}],["TAKE THE HIGH ROAD",()=>dusk("High road")]]);}],["TRY THE CURBSIDE BIKE",()=>dusk("Bike route")],["TAKE THE HIGH ROAD",()=>dusk("High road")]]);
  }
  get("target").onclick=()=>{if(!ended){const score=10*14;get("story").textContent="Star Token · 10 charges · "+score+" points.";get("target").disabled=true;}};
  get("restart").onclick=start;
  for(const saying of sayings){const item=document.createElement("li");item.textContent=saying;get("sayings").append(item);}
  start();
})({
  "sayings": [
    "Lord willing and the creek don't rise.",
    "Fair to middling.",
    "Measure twice, cut once.",
    "Always drink upstream from the herd.",
    "If you find yourself in a hole, stop digging.",
    "Don't count your chickens before they hatch.",
    "Make hay while the sun shines.",
    "You can lead a horse to water, but you can't make him drink.",
    "Don't put all your eggs in one basket.",
    "Shutting the barn door after the horse has bolted.",
    "A stitch in time saves nine.",
    "Strike while the iron is hot.",
    "You reap what you sow.",
    "Too many cooks spoil the broth.",
    "A chain is only as strong as its weakest link.",
    "Look before you leap.",
    "You can't make an omelet without breaking eggs.",
    "Time and tide wait for no man.",
    "Straight from the horse's mouth.",
    "Keep your powder dry.",
    "Separate the wheat from the chaff.",
    "Don't look a gift horse in the mouth.",
    "A watched pot never boils.",
    "Actions speak louder than words.",
    "If it ain't broke, don't fix it.",
    "Don't cross a bridge until you come to it.",
    "Seeing is believing.",
    "Silence is golden.",
    "Slow and steady wins the race.",
    "The early bird catches the worm.",
    "There's no smoke without fire.",
    "Where there's a will, there's a way.",
    "What doesn't kill you makes you stronger.",
    "Pull yourself up by your bootstraps.",
    "Lightning never strikes the same place twice.",
    "The customer is always right.",
    "It's always darkest before the dawn.",
    "Sleep like a baby.",
    "Sweating like a pig.",
    "I could care less.",
    "Near miss."
  ]
},id => document.getElementById(id));

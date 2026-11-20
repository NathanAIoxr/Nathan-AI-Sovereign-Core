"use strict";
(function({modes},get){
  const modePicker=get("mode"),left=get("a"),right=get("b"),tug=get("tug");
  for(const title of modes){const item=document.createElement("option");item.textContent=title;modePicker.append(item);}
  let score=0,deadline=0,next=0,round=0,timer,mode=0,active=false,expected=false,held=-1;
  function advance(){
    round++;expected=(round%4===1||round%4===2);
    const prompts=[expected?"Two-faced mask":"Honest target",expected?"Target in range":"Target moving into range",round%2?"POP":"REST",expected?"Keep this item":"Drop this item","Race to move the freight train."];
    get("challenge").textContent=prompts[mode];
    next=Date.now()+Math.max(360,mode===2?650:1250-round*23);
  }
  function end(message){
    active=false;clearInterval(timer);left.disabled=true;right.disabled=true;
    get("status").textContent=message;
  }
  function tap(isLeft){
    if(!active||Date.now()>=deadline)return;
    if(mode===4){
      tug.value=Math.max(0,Math.min(100,tug.value+(isLeft?5:-5)));
      if(tug.value===100||tug.value===0)end(tug.value===100?"Left side wins.":"Right side wins.");
      return;
    }
    const correct=mode===2?isLeft&&round%2===1:isLeft===expected;
    if(correct)score++;else if(mode===0)score=0;else score=Math.max(0,score-1);
    get("score").textContent="SCORE "+score;
    advance();
  }
  function tick(){
    const now=Date.now(),leftSeconds=Math.max(0,Math.ceil((deadline-now)/1000));
    get("timer").textContent="00:"+String(leftSeconds).padStart(2,"0");
    if(!leftSeconds){end(mode===4?(tug.value===50?"Draw.":tug.value>50?"Left side wins.":"Right side wins."):"Final score: "+score);return;}
    if(mode!==4&&now>=next)advance();
  }
  get("start").onclick=()=>{
    clearInterval(timer);score=0;round=0;held=-1;mode=modePicker.selectedIndex;
    active=true;deadline=Date.now()+20000;
    tug.hidden=mode!==4;tug.value=50;left.disabled=false;right.disabled=mode===2;
    left.textContent=["WHACK","HOLD & RELEASE","POP","KEEP","LEFT PLAYER"][mode];
    right.textContent=["PASS","WAIT","REST","DROP","RIGHT PLAYER"][mode];
    get("score").textContent="SCORE 0";get("status").textContent="Round active.";
    advance();tick();timer=setInterval(tick,75);
  };
  left.onpointerdown=()=>{if(mode===1)held=Date.now();};
  left.onpointercancel=()=>{held=-1;};
  left.onclick=()=>{
    if(mode===1&&held>=0&&Date.now()-held<160){get("status").textContent="Hold a little longer to charge the shot.";held=-1;return;}
    held=-1;tap(true);
  };
  right.onclick=()=>tap(false);
})({
  "modes": [
    "Whack-a-Hypocrite",
    "Spitball & Slingshot Gallery",
    "Pressure-Release Pop",
    "The Trapdoor Gauntlet",
    "2-Player Split-Screen Tug-of-War"
  ]
},id => document.getElementById(id));

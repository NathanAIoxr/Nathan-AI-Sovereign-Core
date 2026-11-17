const gold="#f5ce79", blue="#80c8ff", tau=Math.PI*2;

export function setupFlow(canvas, controls){
  const ctx=canvas.getContext("2d");
  if(!ctx) return;
  const animation=matchMedia("(prefers-reduced-motion: reduce)");
  const lanes=Array.from({length:9},(_,index)=>index-4);
  const state={vertical:true,forward:true,reverse:true,paused:animation.matches,phase:0};
  for(const name of ["axis","forward","reverse","pause"]){
    controls[name].addEventListener("click",()=>{
      const key={axis:"vertical",pause:"paused"}[name]??name;
      state[key]=!state[key];
      refresh();
    });
  }
  function refresh(){
    controls.axis.textContent=state.vertical?"Vertical":"Horizontal";
    controls.pause.textContent=state.paused?"Resume":"Pause";
    for(const [id,key] of [["axis","vertical"],["pause","paused"],["forward","forward"],["reverse","reverse"]])
      controls[id].setAttribute("aria-pressed",String(state[key]));
    controls.status.textContent=(state.vertical?"Vertical":"Horizontal")+" · "+
      (state.forward&&state.reverse?"Counter-rotation":state.forward?"Forward":state.reverse?"Reverse":"Channels idle")+
      (state.paused?" · Paused":"");
    draw();
  }
  function draw(){
    const box=canvas.getBoundingClientRect(), dpr=Math.min(2,devicePixelRatio||1);
    const w=Math.round(box.width*dpr),h=Math.round(box.height*dpr);
    if(!w||!h) return;
    if(canvas.width!==w||canvas.height!==h){ canvas.width=w;canvas.height=h; }
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,w,h);
    ctx.translate(w/2,h/2);
    if(!state.vertical) ctx.rotate(-Math.PI/2);
    const width=state.vertical?w:h, height=state.vertical?h:w, radius=Math.min(width,height)*.20;
    const position=(lane,t)=>{
      const split=Math.sin(t*Math.PI);
      const branch=width*.064*lane*split;
      const curl=Math.sin(t*tau+lane*.48)*radius*.24*split;
      return [branch+curl,(t-.5)*height*.73];
    };
    for(let ring=1;ring<=4;ring++){
      ctx.beginPath();ctx.ellipse(0,0,radius*ring*.75,radius*ring*.27,0,0,tau);
      ctx.strokeStyle="rgba(154,127,172,.24)";ctx.lineWidth=dpr;ctx.stroke();
    }
    for(const lane of lanes){
      ctx.beginPath();
      for(let i=0;i<=36;i++){
        const [x,y]=position(lane,i/36);
        if(i) ctx.lineTo(x,y);else ctx.moveTo(x,y);
      }
      ctx.strokeStyle=lane%2?"rgba(245,206,121,.22)":"rgba(128,200,255,.22)";
      ctx.lineWidth=dpr;ctx.stroke();
      for(let i=0;i<4;i++){
        for(const [enabled,sign,color] of [[state.forward,1,gold],[state.reverse,-1,blue]]){
          if(!enabled) continue;
          const t=((state.phase*sign+i*.249+lane*.116)%1+1)%1;
          const [x,y]=position(lane,t);
          const angle=tau*t*sign;
          ctx.beginPath();ctx.fillStyle=color;
          ctx.arc(x+Math.cos(angle)*dpr*3,y,dpr*(i===0?3:1.8),0,tau);ctx.fill();
        }
      }
    }
    for(const [offset,color] of [[-.365,gold],[.365,blue]]){
      ctx.beginPath();ctx.arc(0,height*offset,dpr*9,0,tau);ctx.fillStyle=color;ctx.fill();
      ctx.beginPath();ctx.arc(0,height*offset,dpr*17,0,tau);ctx.strokeStyle=color;ctx.stroke();
    }
  }
  let last;
  function tick(time){
    const dt=Math.min(.1,(time-(last??time))/1000);
    if(!state.paused&&!document.hidden&&(state.forward||state.reverse)){
      state.phase=(state.phase+dt*Number(controls.rate.value)*.43)%1;
      draw();
    }
    last=time;
    requestAnimationFrame(tick);
  }
  new ResizeObserver(draw).observe(canvas);
  refresh();
  requestAnimationFrame(tick);
}

// Tabor Tracker Ball 🖲️ — Tech with Technology by Nathan Tabor.
export const TAU = Math.PI * 2;
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const gap = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const wrap = a => Math.atan2(Math.sin(a),Math.cos(a));
const elapsed = (a,b) => Math.max(0,b.t-a.t)/1000;
const average = points => ({
  x:points.reduce((sum,p)=>sum+p.x,0)/points.length,
  y:points.reduce((sum,p)=>sum+p.y,0)/points.length,
});

function curvature(path){
  let heading, turn=0, absolute=0, length=0;
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i], angle=Math.atan2(b.y-a.y,b.x-a.x);
    length+=gap(a,b);
    if(heading!==undefined){
      const delta=wrap(angle-heading);
      turn+=delta; absolute+=Math.abs(delta);
    }
    heading=angle;
  }
  return {turn, absolute, length};
}
function findFigureEight(path){
  if(path.length>192){
    const source=path;
    path=Array.from({length:192},(_,i)=>source[Math.round(i*(source.length-1)/191)]);
  }
  if(path.length<18 || gap(path[0],path.at(-1))>.17) return false;
  for(let i=Math.floor(path.length*.32);i<path.length*.68;i++){
    if(gap(path[0],path[i])>.13) continue;
    const a=path.slice(0,i+1), b=path.slice(i);
    const first=curvature(a), second=curvature(b);
    if(first.turn*second.turn>=0) continue;
    if([first,second].every(({turn,absolute,length})=>Math.abs(turn)>3.5&&Math.abs(turn)/absolute>.74&&length>.27)
      && gap(average(a),average(b))>.12) return true;
  }
  return false;
}
export function analyze(samples, pivot={x:0,y:0}){
  if(!samples.length) return null;
  const start=samples[0], end=samples.at(-1);
  const path=[start];
  for(const point of samples.slice(1)){
    if(gap(path.at(-1),point)>=.011) path.push(point);
  }
  const {turn,absolute,length}=curvature(path);
  const duration=elapsed(start,end), travel=gap(start,end);
  const previous=samples.find(p=>p.t>=end.t-120&&p.t<end.t) ??
    (samples.length===2&&duration<.38&&travel>.09?start:end);
  const interval=elapsed(previous,end);
  const dx=end.x-start.x,dy=end.y-start.y;
  const vx=interval?(end.x-previous.x)/interval:0,vy=interval?(end.y-previous.y)/interval:0;
  const speed=Math.hypot(vx,vy);
  const angle=Math.atan2(dy,dx);
  const direction=["right","down-right","down","down-left","left","up-left","up","up-right"][(Math.round(angle/(TAU/8))+8)%8];
  const recent=path.filter(p=>p.t>=end.t-200);
  const rpm=recent.length>=3?curvature(recent).turn/TAU*60/Math.max(.065,elapsed(recent[0],end)):0;
  const xs=path.map(p=>p.x),ys=path.map(p=>p.y);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  let dial=0, reversals=0, previousSign=0, mark=start;
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i];
    if(gap(a,pivot)>.055&&gap(b,pivot)>.055){
      const a0=Math.atan2(a.y-pivot.y,a.x-pivot.x), b0=Math.atan2(b.y-pivot.y,b.x-pivot.x);
      dial+=wrap(b0-a0);
    }
    if(Math.abs(b.x-mark.x)<.065) continue;
    const sign=Math.sign(b.x-mark.x);
    if(previousSign&&sign!==previousSign) reversals++;
    previousSign=sign; mark=b;
  }
  let kind="drag";
  const swirl=Math.abs(turn)>TAU*.62&&(absolute?Math.abs(turn)/absolute:0)>.73 &&
    Math.min(maxX-minX,maxY-minY)>.085&&travel<length*.55;
  if(length<.035) kind=duration>=.42?"hold":"tap";
  else if(swirl) kind="swirl";
  else if(findFigureEight(path)) kind="figure-eight";
  else if(reversals>=2&&Math.abs(maxX-minX)>Math.abs(maxY-minY)*1.25) kind="scrub";
  else if(travel>=.1&&travel/length>.77&&(duration<.39||speed>.9)) kind="swipe";
  return {
    kind,start,end,path,duration,dx,dy,vx,vy,speed,angle,direction,length,reversals,
    turn:turn/TAU,rpm,dial,angularVel:rpm*TAU/60,
    power:clamp(Math.max(speed/3,travel*1.5),0,1),
    spin:Math.abs(turn)<.07?null:turn>0?"clockwise":"counterclockwise",
    center:{x:(minX+maxX)/2,y:(minY+maxY)/2},
  };
}
export const overlayDefaults = Object.freeze({
  widgetType:"TABOR_TRACKBALL", ballTexture:null, ballMassInertia:1.4,
  frictionDecay:.96, hapticTickDegrees:15, gestureOutputMode:"SWIRL_RPM_ACCUMULATOR",
});
const outputs=["SWIRL_RPM_ACCUMULATOR","DIRECTIONAL_SNAP_FLICK","AIMED_ROLL_AND_CURVE","PRECISION_MICRO_TURN","CONTINUOUS_ROLL","SCRUB_REVERSALS"];
export function normalizeOverlay(config={}){
  const value={...overlayDefaults,...config};
  if(value.widgetType!=="TABOR_TRACKBALL"||!outputs.includes(value.gestureOutputMode))
    throw new RangeError("Unsupported controller overlay or gesture output");
  for(const [key,min,max] of [["ballMassInertia",.1,20],["frictionDecay",.8,.999],["hapticTickDegrees",0,180]]){
    if(!Number.isFinite(value[key])||value[key]<min||value[key]>max) throw new RangeError("Invalid "+key);
  }
  if(value.ballTexture!==null&&typeof value.ballTexture!=="string") throw new TypeError("Invalid ballTexture");
  return value;
}
export function decayMotion(friction,dt){
  const drag=-60*Math.log(friction), velocity=Math.exp(-drag*dt);
  return {velocity,travel:(1-velocity)/drag};
}

export function attachTrackBaller(surface,options={}){
  const abort=new AbortController();
  const pivot=options.pivot??(()=>({x:0,y:0}));
  const callbacks=options;
  let stroke,frame=0;
  function point(event,box){
    const unit=Math.min(box.width,box.height)||1;
    return {x:(event.clientX-box.left-box.width/2)/unit,y:(event.clientY-box.top-box.height/2)/unit,
      t:event.timeStamp,pointerType:event.pointerType,pressure:event.pressure};
  }
  function emit(detail,phase){
    const release={swipe:"SLASH_RELEASE",hold:"SHIELD_LOCK",swirl:"SWIRL_RELEASE",
      "figure-eight":"FIGURE_EIGHT_RELEASE",scrub:"SCRUB_RELEASE"};
    const live=detail?.kind==="swirl"?"SWIRL_ACTIVE":"TRACKBALL_MOVE";
    const gestureType=phase==="cancel"?"TRACKBALL_CANCEL":phase==="start"?"TRACKBALL_START":
      phase==="move"?live:release[detail.kind]??"TRACKBALL_RELEASE";
    surface.dispatchEvent(new CustomEvent("taborTrackballGesture",{bubbles:true,detail:{
      ...detail,phase,gestureType,velX:detail?.vx??0,velY:detail?.vy??0,
    }}));
  }
  function append(event,box){
    const p=point(event,box), prior=stroke.points.at(-1);
    if(p.t<prior.t||p.t===prior.t&&gap(p,prior)===0) return;
    if(stroke.points.length>=1440) stroke.points.shift();
    stroke.points.push(p);
  }
  function flush(){
    frame=0;
    if(!stroke) return;
    const detail=analyze(stroke.points,pivot());
    callbacks.onMove?.(detail);
    emit(detail,"move");
  }
  function finish(event,cancelled){
    if(!stroke) return;
    if(event&&!cancelled) append(event,surface.getBoundingClientRect());
    const {points,id}=stroke;
    stroke=null;
    if(frame) cancelAnimationFrame(frame);
    frame=0;
    if(surface.hasPointerCapture(id)) surface.releasePointerCapture(id);
    if(cancelled){
      callbacks.onCancel?.();emit(null,"cancel");return;
    }
    const detail=analyze(points,pivot());
    callbacks.onEnd?.(detail);emit(detail,"end");
  }
  function listen(event,action){
    surface.addEventListener(event,action,{signal:abort.signal});
  }
  listen("pointerdown",event=>{
    if(stroke||event.button!==0) return;
    const p=point(event,surface.getBoundingClientRect());
    stroke={id:event.pointerId,points:[p]};
    surface.setPointerCapture(event.pointerId);
    callbacks.onStart?.(p);emit({start:p},"start");
  });
  listen("pointermove",event=>{
    if(stroke?.id!==event.pointerId) return;
    const box=surface.getBoundingClientRect();
    for(const sample of event.getCoalescedEvents?.()??[]) append(sample,box);
    append(event,box);
    if(!frame) frame=requestAnimationFrame(flush);
  });
  listen("pointerup",event=>{if(stroke?.id===event.pointerId) finish(event,false);});
  for(const name of ["pointercancel","lostpointercapture"]){
    listen(name,event=>{if(stroke?.id===event.pointerId) finish(null,true);});
  }
  return {cancel:()=>finish(null,true),destroy(){abort.abort();finish(null,true);}};
}
export function addTrackBallerToArcadeAction(action,shortSide){
  if(action.kind!=="gesture"||!action.track?.length||!(shortSide>0)) return action;
  const path=action.track.map((p,i)=>({x:p.x/shortSide,y:p.y/shortSide,
    t:i*1000*(action.duration??0)/Math.max(1,action.track.length-1)}));
  const {kind,turn,spin,direction,length}=analyze(path);
  return {...action,trackBaller:{kind,turn,spin,direction,pathLength:length}};
}
export function axisRotation(x,y,z){
  const mag=Math.hypot(x,y,z);
  if(mag<1e-9) return [1,0,0,0];
  const k=Math.sin(mag/2)/mag;
  return [Math.cos(mag/2),x*k,y*k,z*k];
}
export function multiply(a,b){
  const [w,x,y,z]=a,[i,j,k,l]=b;
  const q=[w*i-x*j-y*k-z*l,w*j+x*i+y*l-z*k,w*k+y*i+z*j-x*l,w*l+z*i+x*k-y*j];
  const norm=Math.hypot(...q)||1;
  return q.map(n=>n/norm);
}
export function project(q,p){
  const [w,x,y,z]=q,[a,b,c]=p;
  const i=y*c-z*b,j=z*a-x*c,k=x*b-y*a;
  return [a+2*(w*i+y*k-z*j),b+2*(w*j+z*i-x*k),c+2*(w*k+x*j-y*i)];
}

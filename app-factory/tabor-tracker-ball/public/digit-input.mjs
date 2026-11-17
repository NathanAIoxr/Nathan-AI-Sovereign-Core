// Tabor Tracker Ball and Universal Digit Physics — Nathan Tabor.
import {attachTrackBaller,clamp} from "./track-baller.mjs";
import {WristFlipEngine} from "../../../standalone-apps/tactilecore-sdk/src/engine.mjs";
import {
  CSS_MM, MAX_CONTACTS, LIMB_PROFILES, OneEuro, inBezel, trackSample, releaseSetup,
} from "../../../standalone-apps/hook-and-ring/game/input.mjs";

function pose(contacts){
  const [a,b]=contacts;
  return {
    x:contacts.reduce((s,p)=>s+p.x,0)/contacts.length,
    y:contacts.reduce((s,p)=>s+p.y,0)/contacts.length,
    span:b?Math.hypot(b.x-a.x,b.y-a.y):0,
    angle:b?Math.atan2(b.y-a.y,b.x-a.x):0,
  };
}
const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
const tracks=()=>[new OneEuro(),new OneEuro()];

export class DigitGrip {
  constructor({width,height,limb="hand",adaptive=true,density=CSS_MM}){
    Object.assign(this,{width,height,limb,adaptive,density});
    this.active=new Set();this.contacts=new Map();this.history=[];this.filters=tracks();
    this.maxContacts=0;this.twist=0;this.release=null;this.locked=false;
    this.engine=new WristFlipEngine({
      padWidth:width,padHeight:height,liftGuardMs:(LIMB_PROFILES[limb]??LIMB_PROFILES.hand).guard,
      onThrow:detail=>{this.release=detail;},
    });
  }
  down(id,p){
    if(this.locked||this.contacts.has(id)||this.contacts.size>=MAX_CONTACTS) return false;
    const point={...p};
    this.contacts.set(id,{point,start:point,trail:[point],filters:tracks()});
    this.active.add(id);
    this.engine.down(id,p.x,p.y,p.t);
    this.maxContacts=Math.max(this.maxContacts,this.active.size);
    if(this.active.size>2) return true;
    this.twist=0;
    this.origin=pose(this.points());
    this.previous=this.origin;
    this.startTime=p.t;
    this.history=[{x:this.origin.x,y:this.origin.y,t:p.t}];
    this.filters=tracks();
    return true;
  }
  points(){return [...this.active].map(id=>this.contacts.get(id).point);}
  move(id,p){
    if(!this.active.has(id)||this.locked) return;
    const c=this.contacts.get(id);
    const point=this.adaptive?{...p,x:c.filters[0].sample(p.x,p.t),y:c.filters[1].sample(p.y,p.t)}:p;
    if(!trackSample(c.trail,point)) return;
    c.point=point;
    this.engine.move(id,point.x,point.y,point.t);
    const next=pose(this.points().slice(0,2));
    if(next.span>=this.density*5&&this.previous.span>=this.density*5) this.twist+=wrap(next.angle-this.previous.angle);
    this.previous=next;
    const center=this.adaptive?{
      x:this.filters[0].sample(next.x,p.t),y:this.filters[1].sample(next.y,p.t),t:p.t,
    }:{x:next.x,y:next.y,t:p.t};
    trackSample(this.history,center);
  }
  state(t){
    const p=this.previous, origin=this.origin;
    return {
      contacts:this.active.size,peakContacts:this.maxContacts,
      mode:this.maxContacts===2?"MODE_WRIST_FLIP_PINCH_2D":this.maxContacts>=3?"three-point":"one-digit",
      scale:origin.span>=this.density*5?clamp(p.span/origin.span,.2,5):1,
      twist:this.twist, spanMm:p.span/this.density, durationMs:Math.max(0,t-this.startTime),
      dx:(p.x-origin.x)/this.width, dy:(p.y-origin.y)/this.height,
      points:this.points().map(q=>({x:(q.x-this.width/2)/Math.min(this.width,this.height),
        y:(q.y-this.height/2)/Math.min(this.width,this.height)})),
      start:{x:(origin.x-this.width/2)/Math.min(this.width,this.height),
        y:(origin.y-this.height/2)/Math.min(this.width,this.height)},
      locked:this.locked,
    };
  }
  up(id,p){
    if(!this.active.has(id)) return null;
    // Freeze the shape at the first lift so changing the number of fingers cannot jump the control.
    if(!this.locked){
      this.snapshot=this.state(p.t);
      this.locked=true;
      this.firstLift=p.t;
    }
    const releaseAt=this.engine.grip?.releaseAt;
    if(releaseAt!=null) this.engine.tick(Math.min(p.t,releaseAt+this.engine.maxReleaseMs));
    this.engine.up(id,p.x,p.y,p.t);
    this.active.delete(id);
    if(this.active.size) return null;
    const guarded=releaseSetup(this,this.firstLift,this.density,this.limb);
    return {...this.snapshot,contacts:0,guardMs:guarded?.guard??null,
      guardedVelocity:guarded?.velocity??{x:0,y:0},wristFlip:this.release};
  }
}

export function attachDigitTrackBaller(surface,options={}){
  const abort=new AbortController();
  let grip=null,frame=0;
  const accepted=new Set();
  const multi=()=>grip?.maxContacts>1;
  const local=e=>{
    const box=surface.getBoundingClientRect();
    return {x:e.clientX-box.left,y:e.clientY-box.top,t:e.timeStamp,width:box.width,height:box.height};
  };
  const touch=e=>e.pointerType==="touch";
  const stop=e=>e.stopImmediatePropagation();
  function emit(stage,detail){
    surface.dispatchEvent(new CustomEvent("taborDigitGesture",{bubbles:true,detail:{...detail,stage}}));
  }
  function clear(){
    const ids=[...accepted];grip=null;accepted.clear();
    if(frame) cancelAnimationFrame(frame);
    frame=0;
    for(const id of ids) if(surface.hasPointerCapture(id)) surface.releasePointerCapture(id);
  }
  function cancel(){
    const hadGrip=!!grip;
    clear();
    single.cancel();
    if(hadGrip){options.onGripCancel?.();emit("cancel",{});}
  }
  const listen=(type,fn)=>surface.addEventListener(type,fn,{capture:true,signal:abort.signal});
  listen("pointerdown",e=>{
    if(!touch(e)) return;
    const p=local(e);
    if(!grip&&options.safeCancel?.()!==false&&inBezel(p.x,p.y,p.width,p.height)){stop(e);return;}
    grip??=new DigitGrip({width:p.width,height:p.height,limb:options.limb?.(),adaptive:options.adaptive?.()});
    const wasMulti=multi();
    if(!grip.down(e.pointerId,p)){stop(e);return;}
    accepted.add(e.pointerId);
    if(multi()){
      stop(e);
      if(!wasMulti) single.cancel();
      for(const id of accepted) surface.setPointerCapture(id);
    }
    const detail=grip.state(p.t);
    if(!wasMulti&&multi()) options.onGripStart?.(detail);
    options.onContact?.(detail);emit("start",detail);
  });
  listen("pointermove",e=>{
    if(!touch(e)||!accepted.has(e.pointerId)) return;
    if(multi()) stop(e);
    const p=local(e);
    if(options.safeCancel?.()!==false&&inBezel(p.x,p.y,p.width,p.height)){
      stop(e);cancel();return;
    }
    for(const event of e.getCoalescedEvents?.()??[]) grip.move(e.pointerId,local(event));
    grip.move(e.pointerId,p);
    if(frame) return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      if(!grip||grip.locked) return;
      const detail=grip.state(p.t);
      options.onContact?.(detail);
      if(multi()) options.onGripMove?.(detail);
      emit("move",detail);
    });
  });
  listen("pointerup",e=>{
    if(!touch(e)||!accepted.has(e.pointerId)) return;
    if(multi()) stop(e);
    const p=local(e);
    if(options.safeCancel?.()!==false&&inBezel(p.x,p.y,p.width,p.height)){stop(e);cancel();return;}
    const completed=grip.up(e.pointerId,p);
    accepted.delete(e.pointerId);
    if(!completed){options.onContact?.(grip.state(p.t));return;}
    clear();
    options.onGripEnd?.(completed);
    emit("end",completed);
  });
  for(const event of ["lostpointercapture","pointercancel"]){
    listen(event,e=>{
      if(!touch(e)||!accepted.has(e.pointerId)) return;
      if(event==="lostpointercapture"&&surface.hasPointerCapture(e.pointerId)) return;
      stop(e);cancel();
    });
  }
  const single=attachTrackBaller(surface,options);
  return {cancel,destroy(){cancel();abort.abort();single.destroy();}};
}

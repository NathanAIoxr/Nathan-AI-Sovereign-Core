/**
 * TactileCoreSDK HybridKineticEngine (browser research version).
 * Input is live accelerometer/gyroscope telemetry if available and permitted.
 * In-air release is an IN-GAME EVENT. NEVER throw the phone physically.
 * Rotation-only integration estimates ORIENTATION TRACES, not 3D hand position.
 * Conceptual design and vocabulary: Nathan Tabor, 2026-11-12 (user-designated IP).
 */
import {clamp} from './engine.mjs';
export function classifyAirPath(points) {
  if (points.length<18) return 'unknown';
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  const diag=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  if (diag<18) return 'unknown';
  const [first,last]=[points[0],points.at(-1)];
  const closed=Math.hypot(last.x-first.x,last.y-first.y)/diag<.32;
  let turn=0,corners=0;
  for(let i=2;i<points.length;i++){
    const a={x:points[i-1].x-points[i-2].x,y:points[i-1].y-points[i-2].y};
    const b={x:points[i].x-points[i-1].x,y:points[i].y-points[i-1].y};
    const la=Math.hypot(a.x,a.y),lb=Math.hypot(b.x,b.y);
    if(la<=.4||lb<=.4)continue;
    const dot=a.x*b.x+a.y*b.y;
    turn+=Math.atan2(a.x*b.y-a.y*b.x,dot);
    if(dot/(la*lb)<.35)corners++;
  }
  if(closed)return Math.abs(turn)<1.8?'figureEight':corners>=2?'triangle':'circle';
  return last.y>first.y && Math.min(...ys)<first.y?'swishFlick':'unknown';
}
export class HybridKineticEngine {
  constructor({onThrow=()=>{},onPattern=()=>{},onPath=()=>{}}={}){
    this.onThrow=onThrow;this.onPattern=onPattern;this.onPath=onPath;
    this.mode='off';this.armed=false;this.tracing=false;
    this.peak=0;this.peakAt=-Infinity;this.peakRot={x:0,y:0,z:0};
    this.lastFire=-Infinity;this.lastSample=null;this.points=[];
  }
  setMode(mode){this.mode=['off','throw','trace'].includes(mode)?mode:'off';
    this.armed=false;this.tracing=false;this.peak=0;this.points=[];this.lastSample=null;}
  arm(yes){this.armed=!!yes&&this.mode==='throw';this.peak=0;this.peakAt=-Infinity;}
  trace(yes){
    if(this.mode!=='trace')return;
    if(yes){this.tracing=true;this.points=[{x:0,y:0}];this.lastSample=null;}
    else if(this.tracing){this.tracing=false;const p=this.points.slice();this.onPattern(classifyAirPath(p),p);this.points=[];}
  }
  ingest(s){
    // t in ms; accel in g; gyro in rad/s (web DeviceMotion conversions in app.mjs)
    if(!s||!Number.isFinite(s.t))return;
    const accel=Math.hypot(s.ay||0,s.az||0);
    if(this.mode==='throw'&&this.armed){
      if(accel>this.peak){this.peak=accel;this.peakAt=s.t;this.peakRot={x:s.rx||0,y:s.ry||0,z:s.rz||0};}
      if(this.peak>.75 && s.t-this.peakAt<250 && accel<this.peak*.45 && s.t-this.lastFire>=900){
        this.armed=false;this.lastFire=s.t;
        const power=clamp((this.peak-.3)/2.5,.1,1);
        const spin=clamp(this.peakRot.y/8,-1,1);
        this.onThrow({type:'in-air-virtual',fingerCount:0,mode:'inAir',power,
          aimX:clamp(.5+spin*.12,0,1),spin,loft:clamp(.5+(s.pitch||0)/90,0,1),
          motionUsed:true,axialSpinRPM:clamp(Math.hypot(this.peakRot.x,this.peakRot.y)*240,0,2800),
          releaseAt:s.t,guardedMs:null});
      }
    }
    if(this.mode==='trace'&&this.tracing){
      if(this.lastSample){
        const dt=clamp((s.t-this.lastSample.t)/1000,0,.05);
        const last=this.points.at(-1)||{x:0,y:0};
        const pt={x:last.x-(s.rz||0)*dt*100,y:last.y+(s.rx||0)*dt*100};
        this.points.push(pt);if(this.points.length>600)this.points.shift();
        this.onPath(pt);
      }
    }
    this.lastSample=s;
  }
}

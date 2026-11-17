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

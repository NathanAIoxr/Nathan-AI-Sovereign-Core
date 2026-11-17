import {CSS_MM,HISTORY,GUARD,OneEuro,guardedRelease,inBezel} from './tactile-filter.mjs';
import {analyze} from './track-baller.mjs';

export function beginStroke(bounds) {
  const {width,height,left,top}=bounds;
  if (!(width>0&&height>0)) return null;
  return {width,height,left,top,first:null,last:null,history:[],path:[],xFilter:new OneEuro(),yFilter:new OneEuro()};
}
export function sampleStroke(stroke,{clientX,clientY,timeStamp}) {
  if (![clientX,clientY,timeStamp].every(Number.isFinite) || (stroke.last && timeStamp<=stroke.last.t)) return stroke.last;
  const x=clientX-stroke.left,y=clientY-stroke.top,t=timeStamp;
  const raw={x,y,t};
  const point={x:stroke.xFilter.sample(x/CSS_MM,t)*CSS_MM,
    y:stroke.yFilter.sample(y/CSS_MM,t)*CSS_MM,t};
  stroke.first??=point;stroke.last=point;
  stroke.history.push({...point,raw});
  while(stroke.history.length>1&&stroke.history[1].t<t-HISTORY-GUARD-25)stroke.history.shift();
  if (stroke.path.length===360) {
    stroke.path=stroke.path.filter((_,i)=>i%2===0);
  }
  stroke.path.push(point);
  return point;
}
export function strokeAim(stroke,point) {
  return {x:point.x/stroke.width,y:point.y/stroke.height};
}
export function releaseStroke(stroke, event) {
  if (!stroke?.last) return null;
  const x=event.clientX-stroke.left,y=event.clientY-stroke.top;
  if (!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(event.timeStamp)||
      inBezel(x,y,stroke.width,stroke.height)) return null;
  const tracked=guardedRelease(stroke.history,event.timeStamp);
  const retained=stroke.path.filter(point=>point.t<=tracked.t);
  if (retained.at(-1)?.t!==tracked.t)retained.push(tracked);
  const side=Math.min(stroke.width,stroke.height);
  const result=analyze(retained.map(point=>({x:point.x/side,y:point.y/side,t:point.t})),
    {x:stroke.width/(2*side),y:stroke.height/(2*side)});
  return {aim:strokeAim(stroke,tracked),kind:result.kind,
    travelMm:result.length*side/CSS_MM,speedMm:result.speed*side/CSS_MM,rpm:result.rpm,
    power:result.power,spin:result.spin,samples:retained.length};
}

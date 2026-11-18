import { check, define, dot, int, mean, norm, num, sum, vec, velocity } from "../../../shared/core.ts";
import { kalman } from "../../02-signal-dsp/src/algorithms.ts";
const example={samples:[2,4,8,16,31]};
function median(xs:number[]){const a=[...xs].sort((x,y)=>x-y);return (a[(a.length-1)>>1]+a[a.length>>1])/2;}
function bearing(x:number[]){return Math.atan2(x[1],x[0]);}
function receivers(x:unknown){check(Array.isArray(x)&&x.length>=3&&x.length<=12,"Expected 3–12 coordinates");return x.map(velocity);}
const tdoa={stations:[[0,0],[8,0],[0,8]],relativeSeconds:[0,0],speed:343,extent:8,grid:21};
export const modules = {
  "046": define("Synthetic arrival-time differences",{stations:[[0,0],[8,0],[0,8]],source:[2,3],speed:343},p=>{
    const source=velocity(p.source),speed=num(p.speed,1e-6,1e9);const times=receivers(p.stations).map(([x,y])=>Math.hypot(x-source[0],y-source[1])/speed);return times.slice(1).map(t=>t-times[0]);
  }),
  "047": define("Synthetic TDOA grid reconstruction",tdoa,p=>{
    const stations=receivers(p.stations), offsets=vec(p.relativeSeconds,stations.length-1,stations.length-1);
    const n=int(p.grid,2,65), extent=num(p.extent,1e-6,1e6),speed=num(p.speed,1e-6,1e9);let best={x:0,y:0,squaredError:Infinity};
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){
      const x=i*extent/(n-1),y=j*extent/(n-1),dist=stations.map(([a,b])=>Math.hypot(x-a,y-b));
      const squaredError=sum(offsets.map((t,k)=>((dist[k+1]-dist[0])/speed-t)**2));
      if(squaredError<best.squaredError)best={x,y,squaredError};
    }return best;
  }),
  "048": define("Online mean and sample variance",example,p=>{
    let m=0,s=0,n=0;for(const x of vec(p.samples)){const d=x-m;m+=d/(++n);s+=d*(x-m);}
    return {count:n,mean:m,sampleVariance:n>1?s/(n-1):null};
  }),
  "049": define("Median and MAD",example,p=>{const xs=vec(p.samples),m=median(xs);return {median:m,mad:median(xs.map(x=>Math.abs(x-m)))};}),
  "050": define("Median absolute deviation outliers",{...example,threshold:3},p=>{const xs=vec(p.samples),m=median(xs),d=median(xs.map(x=>Math.abs(x-m))),limit=num(p.threshold,0,100)*d;return xs.map((x,i)=>({i,x})).filter(({x})=>Math.abs(x-m)>limit);}),
  "051": define("Synthetic telemetry Kalman filter",{...example,q:0.1,r:1},p=>kalman(vec(p.samples),num(p.q,0,100),num(p.r,1e-9,100))),
  "052": define("Sensor offset and gain calibration",{...example,offset:1,gain:.5},p=>{const offset=num(p.offset),gain=num(p.gain);return vec(p.samples).map(x=>(x-offset)*gain);}),
  "053": define("Linear sample interpolation",{...example,position:1.5},p=>{const x=vec(p.samples),at=num(p.position,0,x.length-1),i=Math.floor(at);return x[i]+(at-i)*((x[i+1]??x[i])-x[i]);}),
  "054": define("Time-window aggregation",{...example,width:2},p=>{const x=vec(p.samples),w=int(p.width,1,x.length);return Array.from({length:Math.ceil(x.length/w)},(_,i)=>{const values=x.slice(i*w,(i+1)*w);return {offset:i*w,count:values.length,min:Math.min(...values),max:Math.max(...values),mean:mean(values)};});}),
  "055": define("Bearing between points",{from:[1,2],to:[5,8]},p=>{const [a,b]=velocity(p.from),[x,y]=velocity(p.to);check(a!==x||b!==y,"Points must differ");return bearing([x-a,y-b]);}),
  "056": define("Sample covariance",{left:[1,2,3],right:[2,4,6]},p=>{const a=vec(p.left,256,2),b=vec(p.right,a.length,a.length),x=mean(a),y=mean(b);return dot(a.map(v=>v-x),b.map(v=>v-y))/(a.length-1);}),
  "057": define("Confidence-weighted sensor fusion",{values:[10,11,13],variances:[1,2,3]},p=>{const x=vec(p.values),w=vec(p.variances,x.length,x.length).map(n=>1/num(n,1e-9,1e9));return {estimate:dot(x,w)/sum(w),variance:1/sum(w)};}),
  "058": define("Synthetic aperture delay-and-sum fixture",{traces:[[0,1,0,0],[0,0,1,0],[1,0,0,0]],offsets:[1,2,0]},p=>{
    check(Array.isArray(p.traces)&&p.traces.length>=2&&p.traces.length<=16,"Expected 2–16 traces");const x=p.traces.map(a=>vec(a,128)), offsets=vec(p.offsets,x.length,x.length).map((v,i)=>int(v,0,x[i].length-1));
    const size=Math.min(...x.map((t,i)=>t.length-offsets[i]));return Array.from({length:size},(_,i)=>mean(x.map((t,j)=>t[i+offsets[j]])));
  }),
  "059": define("Quantized sensor reading",{...example,min:0,max:32,levels:8},p=>{const lo=num(p.min),hi=num(p.max),levels=int(p.levels,2,4096);check(hi>lo,"Invalid quantizer range");return vec(p.samples).map(x=>Math.round(Math.min(1,Math.max(0,(x-lo)/(hi-lo)))*(levels-1)));}),
  "060": define("Vector residual checks",{readings:[3,4],expected:[0,0],threshold:4},p=>{const a=velocity(p.readings),b=velocity(p.expected),residual=norm(a.map((v,i)=>v-b[i]));return {residual,outside:residual>num(p.threshold,0)};})
};

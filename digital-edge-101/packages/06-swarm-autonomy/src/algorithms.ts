import { check, define, dot, int, mean, norm, num, sum, vec, velocity } from "../../../shared/core.ts";
const agents={agents:[[0,0,1,0],[2,0,0,1],[3,2,-1,0]],radius:5,dt:.2};
const map={grid:[[0,0,0,1],[1,1,0,1],[0,0,0,0]],start:[0,0],goal:[3,2]};
function flock(x:unknown){check(Array.isArray(x)&&x.length>=1&&x.length<=48,"Expected 1–48 simulated agents");return x.map(a=>vec(a,4,4));}
function grid(x:unknown){check(Array.isArray(x)&&x.length>0&&x.length<=32,"Invalid grid height");const g=x.map(row=>vec(row,32).map(n=>int(n,0,1)));check(g.every(row=>row.length===g[0].length),"Grid must be rectangular");return g;}
function path(g:number[][],s:number[],goal:number[]){
  const w=g[0].length,h=g.length;
  const valid=([x,y]:number[])=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<w&&y>=0&&y<h&&g[y][x]===0;
  check(valid(s)&&valid(goal),"Both endpoints must be open grid cells");
  const key=([x,y]:number[])=>y*w+x, to=key(goal),first=key(s);
  const open=new Set([first]),previous=new Map<number,number>(),cost=new Map([[first,0]]);
  const heuristic=(k:number)=>Math.abs(k%w-goal[0])+Math.abs(Math.floor(k/w)-goal[1]);
  while(open.size){let best=-1;for(const k of open)if(best===-1||cost.get(k)!+heuristic(k)<cost.get(best)!+heuristic(best))best=k;
    if(best===to){const out=[];let k=best;for(;;){out.push([k%w,Math.floor(k/w)]);if(k===first)return out.reverse();k=previous.get(k)!;}}
    open.delete(best);const x=best%w,y=Math.floor(best/w);
    for(const pt of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(valid(pt)){const k=key(pt),t=cost.get(best)!+1;if(t<(cost.get(k)??Infinity)){cost.set(k,t);previous.set(k,best);open.add(k);}}
  } return null;
}
function neighbors(f:number[][],index:number,r:number){const a=f[index];return f.filter((b,j)=>index!==j&&Math.hypot(b[0]-a[0],b[1]-a[1])<=r);}
function group(f:number[][]){return [mean(f.map(a=>a[0])),mean(f.map(a=>a[1]))];}
function forces(f:number[][],index:number,r:number){
  const [x,y,vx,vy]=f[index],near=neighbors(f,index,r);
  if(!near.length)return {cohesion:[0,0],alignment:[0,0],separation:[0,0]};
  const [cx,cy]=group(near);
  return {cohesion:[cx-x,cy-y],alignment:[mean(near.map(a=>a[2]))-vx,mean(near.map(a=>a[3]))-vy],
    separation:[sum(near.map(a=>(x-a[0])/Math.max(.01,(x-a[0])**2+(y-a[1])**2))),sum(near.map(a=>(y-a[1])/Math.max(.01,(x-a[0])**2+(y-a[1])**2)))]};
}
function step(p:Record<string,unknown>){
  const all=flock(p.agents),r=num(p.radius,.001,1e6),dt=num(p.dt,.001,1);
  return all.map(([x,y,vx,vy],i)=>{const f=forces(all,i,r);
    const v=[vx+(.12*f.cohesion[0]+.2*f.alignment[0]+.33*f.separation[0])*dt,vy+(.12*f.cohesion[1]+.2*f.alignment[1]+.33*f.separation[1])*dt];
    return [x+v[0]*dt,y+v[1]*dt,...v];});
}
export const modules = {
  "076": define("Reynolds Boids simulation step",agents,p=>step(p)),
  "077": define("Flock centroid",agents,p=>group(flock(p.agents))),
  "078": define("Neighborhood counts",agents,p=>{const f=flock(p.agents),r=num(p.radius,0,1e6);return f.map((_,i)=>neighbors(f,i,r).length);}),
  "079": define("Boids separation vector",agents,p=>{const f=flock(p.agents);return f.map((_,i)=>forces(f,i,num(p.radius,.001,1e6)).separation);}),
  "080": define("Boids alignment vector",agents,p=>{const f=flock(p.agents);return f.map((_,i)=>forces(f,i,num(p.radius,.001,1e6)).alignment);}),
  "081": define("Boids cohesion vector",agents,p=>{const f=flock(p.agents);return f.map((_,i)=>forces(f,i,num(p.radius,.001,1e6)).cohesion);}),
  "082": define("Grid A-star pathfinding",map,p=>path(grid(p.grid),velocity(p.start),velocity(p.goal))),
  "083": define("Occupancy grid coverage",map,p=>{const g=grid(p.grid),cells=g.flat();return {width:g[0].length,height:g.length,blocked:sum(cells),open:cells.length-sum(cells)};}),
  "084": define("Dead-reckoning pose update",{pose:[0,0,0],speed:2,turn:.1,dt:.5},p=>{const [x,y,a]=vec(p.pose,3,3),v=num(p.speed,-1000,1000),w=num(p.turn,-20,20),dt=num(p.dt,0,1),mid=a+w*dt/2;return [x+Math.cos(mid)*v*dt,y+Math.sin(mid)*v*dt,a+w*dt];}),
  "085": define("Visual-inertial displacement blend",{camera:[1,1],inertial:[2,1],weight:.7},p=>{const a=velocity(p.camera),b=velocity(p.inertial),w=num(p.weight,0,1);return a.map((v,i)=>v*w+b[i]*(1-w));}),
  "086": define("Flock heading agreement",agents,p=>{const f=flock(p.agents).map(a=>a.slice(2)).filter(v=>norm(v)>0).map(v=>v.map(x=>x/norm(v)));return f.length?norm([mean(f.map(a=>a[0])),mean(f.map(a=>a[1]))]):0;}),
  "087": define("Waypoint route length",{points:[[0,0],[3,4],[6,4]]},p=>{check(Array.isArray(p.points)&&p.points.length>=2&&p.points.length<=64,"Expected 2–64 points");const pts=p.points.map(velocity);return sum(pts.slice(1).map((q,i)=>norm(q.map((v,j)=>v-pts[i][j]))));}),
  "088": define("Synthetic formation error",{agents:[[0,0,0,0],[2,0,0,0]],target:[1,0]},p=>{const a=group(flock(p.agents)),b=velocity(p.target),d=a.map((x,i)=>x-b[i]);return {offset:d,squaredError:dot(d,d)};}),
  "089": define("Synthetic grid overlay update",{grid:[[0,0],[0,0]],blocked:[[1,1]]},p=>{const g=grid(p.grid);check(Array.isArray(p.blocked)&&p.blocked.length<=64,"Expected up to 64 cells");for(const pos of p.blocked){const [x,y]=velocity(pos);g[int(y,0,g.length-1)][int(x,0,g[0].length-1)]=1;}return g;}),
  "090": define("Bounded multi-step flock simulation",{...agents,steps:8},p=>{let a=flock(p.agents);const steps=int(p.steps,1,64);for(let i=0;i<steps;i++)a=step({...p,agents:a});return {steps,agents:a};})
};

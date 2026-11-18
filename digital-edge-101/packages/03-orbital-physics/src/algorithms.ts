import { check, define, dot, exactVec, int, mod, norm, num, velocity } from "../../../shared/core.ts";
const tau=2*Math.PI;
const state={position:[7000,0],velocity:[0,7.5],mu:398600};
const orbit={radius:7000,mu:398600};
const grav=(x:unknown)=>num(x,1e-6,1e9);
const radius=(x:unknown)=>num(x,1e-6,1e9);
function acceleration(r:number[],mu:number){const d=norm(r);check(d>=1e-6,"Undefined at the origin");return r.map(x=>-mu*x/d**3);}
function propagate(position:number[],velocity:number[],mu:number,dt:number,steps:number){
  let x=position,v=velocity;
  for(let n=0;n<steps;n++){
    const a=acceleration(x,mu),next=x.map((t,i)=>t+v[i]*dt+a[i]*dt*dt/2);
    const nextA=acceleration(next,mu);v=v.map((t,i)=>t+(a[i]+nextA[i])*dt/2);x=next;
  }
  return {position:x,velocity:v};
}
function quaternion(x:unknown){const q=exactVec(x,4), length=norm(q);check(length>1e-9,"Zero quaternion");return q.map(v=>v/length);}
function qMultiply([a,b,c,d]:number[],[w,x,y,z]:number[]){return [a*w-b*x-c*y-d*z,a*x+b*w+c*z-d*y,a*y-b*z+c*w+d*x,a*z+b*y-c*x+d*w];}
export const modules = {
  "031": define("Circular orbit speed",orbit,p=>Math.sqrt(grav(p.mu)/radius(p.radius))),
  "032": define("Circular orbital period",orbit,p=>tau*Math.sqrt(radius(p.radius)**3/grav(p.mu))),
  "033": define("Specific orbital energy",state,p=>dot(velocity(p.velocity),velocity(p.velocity))/2-grav(p.mu)/radius(norm(velocity(p.position)))),
  "034": define("Escape speed",orbit,p=>Math.sqrt(2*grav(p.mu)/radius(p.radius))),
  "035": define("Two-dimensional specific angular momentum",state,p=>{const [x,y]=velocity(p.position),[vx,vy]=velocity(p.velocity);return x*vy-y*vx;}),
  "036": define("Elliptic Kepler equation",{meanAnomaly:1,eccentricity:.4},p=>{
    const m=mod(num(p.meanAnomaly),tau),e=num(p.eccentricity,0,.99);let lo=0,hi=tau;
    for(let i=0;i<54;i++){const x=(lo+hi)/2;if(x-e*Math.sin(x)<m)lo=x;else hi=x;}
    return (lo+hi)/2;
  }),
  "037": define("Elliptic orbital radius",{semiMajor:7000,eccentricity:.1,eccentricAnomaly:1},p=>radius(p.semiMajor)*(1-num(p.eccentricity,0,.99)*Math.cos(num(p.eccentricAnomaly)))),
  "038": define("Velocity-Verlet orbit propagation",{...state,dt:15,steps:12},p=>propagate(velocity(p.position),velocity(p.velocity),grav(p.mu),num(p.dt,.001,100),int(p.steps,1,512))),
  "039": define("Two-body gravitational acceleration",state,p=>acceleration(velocity(p.position),grav(p.mu))),
  "040": define("Quaternion normalization",{quaternion:[2,0,0,0]},p=>quaternion(p.quaternion)),
  "041": define("Quaternion attitude composition",{first:[1,0,0,0],second:[1,1,0,0]},p=>qMultiply(quaternion(p.first),quaternion(p.second))),
  "042": define("Quaternion vector rotation",{quaternion:[1,0,0,1],vector:[1,0,0]},p=>{const q=quaternion(p.quaternion);return qMultiply(qMultiply(q,[0,...exactVec(p.vector,3)]),[q[0],-q[1],-q[2],-q[3]]).slice(1);}),
  "043": define("Star direction angular separation",{left:[1,0,0],right:[1,1,0]},p=>{const a=exactVec(p.left,3),b=exactVec(p.right,3);const d=norm(a)*norm(b);check(d>0,"Star vectors must be nonzero");return Math.acos(Math.min(1,Math.max(-1,dot(a,b)/d)));}),
  "044": define("Exponential atmosphere density model",{height:35000,scaleHeight:8500,surfaceDensity:1.225},p=>num(p.surfaceDensity,0,100)*Math.exp(-num(p.height,0,1e8)/num(p.scaleHeight,1,1e8))),
  "045": define("Atmospheric drag acceleration",{density:.001,velocity:[30,40],coefficient:2,area:1,mass:10},p=>{const v=velocity(p.velocity),k=.5*num(p.density,0,100)*num(p.coefficient,0,100)*num(p.area,0,1e6)/num(p.mass,.01,1e8);return v.map(x=>-k*norm(v)*x);})
};

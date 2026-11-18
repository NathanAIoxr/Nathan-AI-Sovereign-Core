import { check, define, int, mean, num, sum, vec } from "../../../shared/core.ts";
const sample={initial:[0,1,0,1,0],ratio:.2,steps:3};
function heat1(p:Record<string,unknown>, fn:(c:number,l:number,r:number,a:number)=>number){
  let x=vec(p.initial,128,3);const a=num(p.ratio,0,.5),steps=int(p.steps,1,128);
  for(let s=0;s<steps;s++)x=x.map((c,i)=>i&&!((i+1)===x.length)?fn(c,x[i-1],x[i+1],a):c);
  return x;
}
function thermalCell(c:number,l:number,r:number,a:number){return c+a*(l-2*c+r);}
function grid(input:unknown){
  check(Array.isArray(input)&&input.length>=3&&input.length<=20,"Expected 3–20 rows");const g=input.map(r=>vec(r,20,3));check(g.every(r=>r.length===g[0].length),"Expected a rectangular grid");return g;
}
export const modules = {
  "091": define("One-dimensional explicit heat solver",sample,(p,env)=>heat1(p,(env.heatCell as typeof thermalCell|undefined)??thermalCell)),
  "092": define("Two-dimensional explicit heat solver",{grid:[[0,0,0],[0,100,0],[0,0,0]],ratio:.2,steps:2},p=>{
    let g=grid(p.grid);const a=num(p.ratio,0,.25),steps=int(p.steps,1,64);
    for(let s=0;s<steps;s++)g=g.map((row,y)=>row.map((c,x)=>y===0||y===g.length-1||x===0||x===row.length-1?c:c+a*(g[y-1][x]+g[y+1][x]+row[x-1]+row[x+1]-4*c)));
    return g;
  }),
  "093": define("Exponential wave attenuation",{amplitude:1,coefficient:.2,distances:[0,1,2,3]},p=>{const a=num(p.amplitude),k=num(p.coefficient,0);return vec(p.distances).map(x=>a*Math.exp(-k*num(x,0)));}),
  "094": define("Hooke law spring force",{displacement:[.1,.2,-.1],stiffness:10},p=>{const k=num(p.stiffness,0);return vec(p.displacement).map(x=>-k*x);}),
  "095": define("Damped oscillator integration",{displacement:1,velocity:0,stiffness:10,damping:.3,mass:1,dt:.01,steps:50},p=>{
    let x=num(p.displacement),v=num(p.velocity);const k=num(p.stiffness,0,100),c=num(p.damping,0,50),m=num(p.mass,.1,100),dt=num(p.dt,.0001,.01),steps=int(p.steps,1,500);
    for(let i=0;i<steps;i++){v+=(-k*x-c*v)*dt/m;x+=v*dt;}return {displacement:x,velocity:v,energy:.5*m*v*v+.5*k*x*x};
  }),
  "096": define("Axial two-node finite-element stiffness",{young:200,area:2,length:4},p=>{const k=num(p.young,0)*num(p.area,0)/num(p.length,.001);return [[k,-k],[-k,k]];}),
  "097": define("Axial strain and stress",{extension:.005,length:2,young:200},p=>{const strain=num(p.extension)/num(p.length,.001);return {strain,stress:strain*num(p.young,0)};}),
  "098": define("Plane-wave travel time",{distances:[0,4,8],speed:2},p=>{const speed=num(p.speed,.001);return vec(p.distances).map(x=>num(x,0)/speed);}),
  "099": define("Composite layer thermal resistance",{thickness:[.1,.15,.2],conductivity:[.2,.3,.4],area:2},p=>{const x=vec(p.thickness,32),k=vec(p.conductivity,x.length,x.length),area=num(p.area,.0001);const total=sum(x.map((n,i)=>num(n,0)/(num(k[i],.0001)*area)));return {resistance:total};}),
  "100": define("Heat-capacity-weighted temperature",{masses:[1,2],specificHeat:[2,4],temperature:[10,30]},p=>{const mass=vec(p.masses,32),heat=vec(p.specificHeat,mass.length,mass.length),t=vec(p.temperature,mass.length,mass.length);const w=mass.map((m,i)=>num(m,0)*num(heat[i],0));const total=sum(w);check(total>0,"Positive heat capacity required");return sum(w.map((c,i)=>c*t[i]))/total;}),
  "101": define("Thermal mesh convergence metric",{coarse:[1,2,4],fine:[1,2.1,3.9]},p=>{const x=vec(p.coarse),fine=vec(p.fine,x.length,x.length);const e=x.map((v,i)=>Math.abs(v-fine[i]));return {meanAbsolute:mean(e),maxAbsolute:Math.max(...e),rms:Math.sqrt(mean(e.map(n=>n*n)))};})
};

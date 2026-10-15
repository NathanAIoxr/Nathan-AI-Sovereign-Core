/* Numerical Middle C: actual zeros and failure handling, not a physical consciousness claim. */
(function(root,factory){const x=factory();if(typeof module==='object'&&module.exports)module.exports=x;else root.MiddleCRootEngine=x;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TOL=1e-9,MAX_STEPS=60;
const PROBLEMS=Object.freeze({
sqrt2:{title:'Mesopotamia · √2',expr:'x² − 2 = 0',domain:[1,2],guess:1.5,f:x=>x*x-2,df:x=>2*x,g:x=>(x+2/x)/2,note:'Positive root isolated here; −√2 is outside the displayed interval.'},
cubic:{title:'Polynomial · cubic',expr:'x³ − x − 2 = 0',domain:[1,2],guess:1.5,f:x=>x*x*x-x-2,df:x=>3*x*x-1,g:x=>Math.cbrt(x+2),note:'One real root near 1.5213797.'},
sine:{title:'Trigonometry · sine',expr:'sin(x) − 0.5 = 0',domain:[0,1],guess:0.6,f:x=>Math.sin(x)-.5,df:x=>Math.cos(x),g:null,note:'Other real roots exist outside this interval, repeating periodically.'},
tangent:{title:'Touching, not crossing',expr:'(x − 1)² = 0',domain:[0,2],guess:1.3,f:x=>(x-1)**2,df:x=>2*(x-1),g:null,note:'An even-multiplicity zero need not change signs; a bracketing test can miss it.'},
noroot:{title:'No real root',expr:'x² + 1 = 0',domain:[-2,2],guess:1,f:x=>x*x+1,df:x=>2*x,g:null,note:'No real root exists; the complex roots are ±i.'}
});
const METHODS=Object.freeze(['bisection','false-position','newton','secant','fixed-point','hybrid']);
const finite=x=>Number.isFinite(x);
function init(key='cubic',method='hybrid'){if(!PROBLEMS[key]||!METHODS.includes(method))throw RangeError('Unknown problem or method');const p=PROBLEMS[key];return {key,method,a:p.domain[0],b:p.domain[1],prev:p.domain[0],x:p.guess,iterations:[],status:'ready',error:null};}
function bracketOK(p,a,b){const fa=p.f(a),fb=p.f(b);return finite(fa)&&finite(fb)&&(fa===0||fb===0||fa*fb<0);}
function step(state){
 if(!state||!PROBLEMS[state.key])throw TypeError('Invalid solver state');
 if(state.status==='converged'||state.status==='failed')return {...state};
 const p=PROBLEMS[state.key],s={...state,iterations:state.iterations.slice()};
 if(s.iterations.length>=MAX_STEPS){s.status='failed';s.error='Iteration limit; convergence is not guaranteed.';return s;}
 const fx=p.f(s.x),fa=p.f(s.a),fb=p.f(s.b);
 if(![fx,fa,fb,s.x,s.prev,s.a,s.b].every(finite)){s.status='failed';s.error='Nonfinite input';return s;}
 const bracketed=['bisection','false-position','hybrid'].includes(s.method);
 if(bracketed&&!bracketOK(p,s.a,s.b)){s.status='failed';s.error='No sign-changing bracket; this can miss touching roots.';return s;}
 let next;
 if(bracketed&&fa===0)next=s.a;
 else if(bracketed&&fb===0)next=s.b;
 else if(s.method==='bisection')next=(s.a+s.b)/2;
 else if(s.method==='false-position'){const d=fb-fa;if(Math.abs(d)<1e-15){s.status='failed';s.error='Zero false-position denominator';return s;}next=(s.a*fb-s.b*fa)/d;}
 else if(s.method==='newton'||s.method==='hybrid'){
  const d=p.df(s.x),proposal=Math.abs(d)>1e-14?s.x-fx/d:NaN;
  if(s.method==='newton'){if(!finite(proposal)){s.status='failed';s.error='Zero derivative';return s;}next=proposal;}
  else next=finite(proposal)&&proposal>s.a&&proposal<s.b&&Math.abs(p.f(proposal))<Math.abs(fx)?proposal:(s.a+s.b)/2;
 }else if(s.method==='secant'){
  const d=fx-p.f(s.prev);if(Math.abs(d)<1e-14){s.status='failed';s.error='Zero secant slope';return s;}next=s.x-fx*(s.x-s.prev)/d;
 }else if(s.method==='fixed-point'){
  if(!p.g){s.status='failed';s.error='No provided convergent fixed-point mapping for this function';return s;}next=p.g(s.x);
 }
 if(!finite(next)||Math.abs(next)>1e12||!finite(p.f(next))){s.status='failed';s.error='Iteration diverged or was nonfinite';return s;}
 const fNext=p.f(next);
 if(bracketed&&fa!==0&&fb!==0){if(fa*fNext<=0)s.b=next;else s.a=next;}
 s.prev=s.x;s.x=next;s.iterations.push({n:s.iterations.length+1,x:next,residual:Math.abs(fNext),a:s.a,b:s.b});
 s.status=Math.abs(fNext)<=TOL?'converged':'running';s.error=null;
 return s;
}
function solve(key,method){let s=init(key,method);for(let i=0;i<MAX_STEPS+1&&s.status!=='converged'&&s.status!=='failed';i++)s=step(s);return s;}
function isolate(key,parts=200){const p=PROBLEMS[key];if(!p||!Number.isInteger(parts)||parts<2||parts>2000)throw RangeError('Invalid scan');const [lo,hi]=p.domain,found=[];
 for(let i=0;i<parts;i++){const a=lo+(hi-lo)*i/parts,b=lo+(hi-lo)*(i+1)/parts;if(p.f(a)===0||p.f(a)*p.f(b)<0)found.push([a,b]);}return found;
}
function vectorStep(state={x:1.5,y:0.5,iterations:[]}){
 const x=state.x,y=state.y,F=x*x+y*y-5,G=x-y-1,det=-2*(x+y);
 if(!finite(det)||Math.abs(det)<1e-12)return {...state,status:'failed',error:'Singular Jacobian'};
 const dx=(-F-2*y*G)/det,dy=(2*x*G-F)/det,nx=x-dx,ny=y-dy,r=Math.hypot(nx*nx+ny*ny-5,nx-ny-1);
 if(![nx,ny,r].every(finite))return {...state,status:'failed',error:'Nonfinite vector result'};
 return {x:nx,y:ny,iterations:[...(state.iterations||[]),{x:nx,y:ny,residual:r}],status:r<=TOL?'converged':'running',error:null};
}
return Object.freeze({PROBLEMS,METHODS,TOL,MAX_STEPS,init,step,solve,isolate,vectorStep,bracketOK});
});

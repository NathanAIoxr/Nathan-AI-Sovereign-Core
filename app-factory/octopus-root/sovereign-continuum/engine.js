/* NATHAN AI / SOVEREIGN CONTINUUM — independently written, dependency-free model engine.
   Simulation only. Not a physical drive, weapon, shield, stimulator, or neural upload system. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SovereignContinuum=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const C=299792458, KB=1.380649e-23, HB=1.054571817e-34, G=6.67430e-11;
const QE=1.602176634e-19, ME=9.1093837139e-31, EP=8.8541878128e-12, MU=1.25663706127e-6;
const PI=Math.PI, K=PI*PI*HB*C/720, EVM=QE;
const FAMILIES=Object.freeze([
 {id:'void',label:'VOID FOLD',motto:'FORM MORPHS. ARCHITECTURE REMAINS.',about:'Geometry, apparent time, computational visibility and ideal vacuum models.'},
 {id:'bite',label:'BARK & BITE',motto:'BACK OFF. NO BLUFF.',about:'Ideal plasma, propagation, magnetic pressure and diffusion mathematics.'},
 {id:'mind',label:'MIND TO MATTER',motto:'SIGNAL IN. PROOF OUT.',about:'Information thermodynamics, neural analogues and probability models.'},
 {id:'gravity',label:"GRAVITY'S GOT NOTHING",motto:'NUMBERS FIRST. LIFT IS EARNED.',about:'Force accounting, safe induction analogues, and motion.'},
 {id:'paradox',label:'THE PARADOX LEDGER',motto:'ABOVE C → MIDDLE C ← BELOW C',about:'Reversible analytics, pattern testing and synthetic observations.'}
]);
const p=(key,label,value,unit='')=>({key,label,value,unit});
const GATES=[
 {id:'warp-wall',family:'void',name:'THE VOID WALL',equation:'f(r) = [tanh(s(r+R)) - tanh(s(r-R))] / [2 tanh(sR)]',forward:p('radius','Radial distance',0,'m'),backward:p('shape','Shape target',0.5),context:[p('R','Reference radius',10,'m'),p('s','Wall sharpness',1,'1/m')],boundary:'Metric shape only. No actual spacetime distortion or propulsion.'},
 {id:'vacuum-gap',family:'void',name:'NOTHING BETWEEN',equation:'u = -pi² hbar c / (720 a⁴)',forward:p('gap','Ideal plate gap',1e-7,'m'),backward:p('density','Energy-density magnitude',4.33375257,'J/m³'),context:[],boundary:'Ideal conducting plates; negative density is not a usable warp energy source.'},
 {id:'spin-echo',family:'void',name:'THE SPIN ECHO',equation:'w = G J / (c² r³)',forward:p('momentum','Angular momentum',5.86e33,'kg·m²/s'),backward:p('omega','Angular frequency',1.682e-14,'rad/s'),context:[p('radius','Distance from axis',6371000,'m')],boundary:'Weak-field characteristic scaling, not an antigravity or hover device.'},
 {id:'clock-bender',family:'void',name:'MOMENT BENDER',equation:'gamma = 1 / sqrt(1-(v/c)²)',forward:p('velocity','Relative speed',120000000,'m/s'),backward:p('gamma','Relativistic factor',1.09),context:[],boundary:'Special-relativistic ideal reference, not artificial time control.'},
 {id:'eye-budget',family:'void',name:'ONLY WHAT THE EYE SEES',equation:'work = views × cells_per_view × operations_per_cell',forward:p('views','View count',3),backward:p('work','Work operations',48000000),context:[p('cells','Cells per view',2000000),p('ops','Operations per cell',8)],boundary:'Software rendering-cost estimate; attention is not a physics-based quantum observer.'},
 {id:'fire-column',family:'bite',name:'THE FIRE COLUMN',equation:'I² = 8 pi N kB (Te+Ti) / mu0',forward:p('linearDensity','Line density',1e15,'m⁻¹'),backward:p('current','Ideal axial current',235,'A'),context:[p('te','Electron temperature',1e5,'K'),p('ti','Ion temperature',1e5,'K')],boundary:'Static equilibrium model, not a stable free-standing blade. Never build high-current hardware from this.'},
 {id:'frequency-gate',family:'bite',name:'THE BACK-OFF GATE',equation:'fp = sqrt(ne e² / (eps0 me))/(2pi)',forward:p('density','Electron density',7.14494942e16,'m⁻³'),backward:p('frequency','Plasma cutoff frequency',2.4e9,'Hz'),context:[],boundary:'Cold, collisionless, unmagnetized plasma; not a barrier to every projectile or frequency.'},
 {id:'wave-fade',family:'bite',name:'THE FADING WALL',equation:'delta = c / (2pi f sqrt((fp/f)² - 1))',forward:p('plasmaFrequency','Plasma frequency',3e9,'Hz'),backward:p('depth','Attenuation length',0.02,'m'),context:[p('waveFrequency','Incident wave frequency',2.4e9,'Hz')],boundary:'Ideal evanescent-field length in a simplified plasma; f must be below fp.'},
 {id:'field-pressure',family:'bite',name:'PRESSURE WITHOUT A HAND',equation:'P = B² / (2 mu0)',forward:p('field','Field intensity',0.01,'T'),backward:p('pressure','Magnetic pressure',39.7887,'Pa'),context:[],boundary:'Magnetic pressure calculation, not self-confined plasma or protective armor.'},
 {id:'field-decay',family:'bite',name:'THE FIELD FADE',equation:'t = L² / eta',forward:p('length','Diffusion length',0.02,'m'),backward:p('time','Diffusion timescale',0.4,'s'),context:[p('eta','Magnetic diffusivity',0.001,'m²/s')],boundary:'Single-scale dimensional estimate, not a full non-ideal field solver.'},
 {id:'bit-heat',family:'mind',name:'THE BIT & HEAT FLOOR',equation:'Emin = erasures × kB × T × ln 2',forward:p('erasures','Irreversible bit erasures',1e10),backward:p('energy','Ideal minimum heat',2.96811367e-11,'J'),context:[p('temperature','Temperature',310.15,'K')],boundary:'Lower bound for irreversible erasures; does not certify human safety or real device heat.'},
 {id:'tunnel-tater',family:'mind',name:'THE TUNNEL TATER',equation:'P ≈ exp(-2a sqrt(2m(V-E))/hbar)',forward:p('width','Rectangular barrier width',1e-9,'m'),backward:p('probability','Transmission approximation',1e-4),context:[p('height','Barrier potential',1.5,'eV'),p('kinetic','Particle energy',1,'eV')],boundary:'One-dimensional WKB approximation; no body interface or instant skill loading.'},
 {id:'nerve-echo',family:'mind',name:'THE NERVE ECHO',equation:'V(t)=Vrest+(V0-Vrest) exp(-t/tau)',forward:p('time','Elapsed time',0.01,'s'),backward:p('voltage','Membrane analogue voltage',-0.0668,'V'),context:[p('rest','Rest voltage',-0.07,'V'),p('initial','Initial voltage',-0.03,'V'),p('tau','Time constant',0.004,'s')],boundary:'Passive RC-style response, not a complete biological neural simulator.'},
 {id:'pattern-pulse',family:'mind',name:'THE SYNTHETIC PULSE',equation:'y = exp(-(x-mu)²/(2sigma²))',forward:p('input','Synthetic input value',512),backward:p('response','Synthetic response',0.5),context:[p('center','Center',512),p('spread','Spread',180)],boundary:'Pure software response; inverse returns the positive branch only.'},
 {id:'choice-entropy',family:'mind',name:'THE TWO-CHOICE LEDGER',equation:'H(p) = -p log2 p - (1-p) log2(1-p)',forward:p('probability','Probability p',0.25),backward:p('bits','Binary entropy',0.811278,'bits'),context:[],boundary:'Information-theoretic binary uncertainty, not consciousness measurement; inverse p in [0,0.5].'},
 {id:'symbol-ceiling',family:'mind',name:'THE SYMBOL CEILING',equation:'B = log2(M)',forward:p('states','Equiprobable orthogonal symbols',16),backward:p('bits','Max ideal bits per symbol',4,'bits'),context:[],boundary:'Ideal distinguishable-state counting, not a demonstration of high-capacity quantum messaging.'},
 {id:'lift-ledger',family:'gravity',name:'GRAVITY OWES A RECEIPT',equation:'F = m g',forward:p('mass','Mass',25,'kg'),backward:p('force','Support force',245.16625,'N'),context:[p('acceleration','Gravitational acceleration',9.80665,'m/s²')],boundary:'A force requirement only. Does not provide lift hardware or gravity cancellation.'},
 {id:'quiet-coil',family:'gravity',name:'THE QUIET COIL',equation:'abs(emf) = turns × area × abs(dB/dt)',forward:p('rate','Magnetic field rate',0.1,'T/s'),backward:p('emf','Ideal induced EMF',0.001,'V'),context:[p('turns','Number of turns',100),p('area','Loop area',0.0001,'m²')],boundary:'Ideal low-voltage numerical example only; no high-power coils or disruptive pulses.'},
 {id:'motion-root',family:'gravity',name:'THE MOTION ROOT',equation:'p = m v',forward:p('velocity','Velocity',3,'m/s'),backward:p('momentum','Linear momentum',6,'kg·m/s'),context:[p('mass','Mass',2,'kg')],boundary:'Classical linear momentum; not a complete quantum wavepacket calculation.'},
 {id:'wave-clock',family:'gravity',name:'THE WAVE CLOCK',equation:'period = 1/frequency',forward:p('frequency','Cycle frequency',440,'Hz'),backward:p('period','Cycle period',0.0022727273,'s'),context:[],boundary:'Synthetic periodic-signal calculation; not an electroencephalogram or measured brain signal.'},
 {id:'odd-one-out',family:'paradox',name:'THE PARADOX PATROL',equation:'z = abs(observation - mean) / sigma',forward:p('observation','Observation',14),backward:p('z','Absolute standard-score distance',2),context:[p('mean','Reference mean',10),p('spread','Reference deviation',2)],boundary:'Elementary anomaly score, not a lie detector; inverse selects the upper solution.'},
 {id:'learn-reverse',family:'paradox',name:'THE LEARNING REAPER',equation:'theta_next = theta - alpha × gradient',forward:p('gradient','Gradient',4),backward:p('next','Next parameter value',0.6),context:[p('theta','Current parameter value',1),p('rate','Learning rate',0.1)],boundary:'One mathematical optimizer step; not autonomous or sentient AI.'},
 {id:'pair-mirror',family:'paradox',name:'THE MIRROR PAIR',equation:'P(match) = (1+visibility)/2',forward:p('visibility','Idealized correlation visibility',0.8),backward:p('match','Matching probability',0.9),context:[],boundary:'Pedagogical synthetic correlation only; does not perform quantum teleportation.'},
 {id:'signal-rail',family:'paradox',name:'THE SIGNAL RAIL',equation:'samples = sampling_rate × duration',forward:p('duration','Observation duration',2,'s'),backward:p('samples','Number of samples',1024),context:[p('rate','Sample rate',512,'Hz')],boundary:'Sample budget for synthetic signals; does not collect biological recordings.'},
 {id:'middle-c',family:'paradox',name:'THE MIDDLE C COLLISION',equation:'forward = model(inputs); backward = inverse(output); delta = |x - reconstructed_x|',forward:p('input','Original input',5),backward:p('output','Transformed output',23),context:[p('scale','Scale',4),p('offset','Offset',3)],boundary:'Transparent reversible affine software model, not proof of a cosmic mechanism.'}
].map(g=>Object.freeze({...g,context:Object.freeze(g.context)}));
const finite=(v,label)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error(label+' must be finite');return v};
const positive=(v,label)=>{finite(v,label);if(v<=0)throw Error(label+' must be > 0');return v};
const nonneg=(v,label)=>{finite(v,label);if(v<0)throw Error(label+' must be >= 0');return v};
const prob=(v,label,min=0,max=1)=>{finite(v,label);if(v<min||v>max)throw Error(label+' must be within '+min+'..'+max);return v};
const fplasma=n=>Math.sqrt(n*QE*QE/(EP*ME))/(2*PI);
const nplasma=f=>EP*ME*(2*PI*f)**2/(QE*QE);
function calculate(id,values={},direction='forward'){
 const g=GATES.find(x=>x.id===id);if(!g)throw Error('Unknown model');if(!['forward','backward'].includes(direction))throw Error('Unknown pass');
 const entries=[g.forward,g.backward,...g.context];
 const v={};for(const e of entries)v[e.key]=finite(values[e.key]===undefined?e.value:Number(values[e.key]),e.label);
 const fw=direction==='forward';let result;
 switch(id){
 case 'warp-wall': {
  const R=positive(v.R,'R'),s=positive(v.s,'s');
  const fn=r=>(Math.tanh(s*(r+R))-Math.tanh(s*(r-R)))/(2*Math.tanh(s*R));
  if(fw)result=fn(nonneg(v.radius,'Radius'));
  else{const target=prob(v.shape,'Shape',0,1);if(target>=1)result=0;else if(target<=0)throw Error('Shape 0 has no finite inverse');else{let lo=0,hi=R+Math.max(100/s,100);for(let i=0;i<100;i++){const mid=(lo+hi)/2;if(fn(mid)>target)lo=mid;else hi=mid}result=(lo+hi)/2;}}break;
 }
 case 'vacuum-gap': result=fw?-K/positive(v.gap,'Gap')**4:(K/positive(v.density,'Magnitude'))**0.25;break;
 case 'spin-echo': result=fw?G*v.momentum/(C*C*positive(v.radius,'Radius')**3):v.omega*C*C*positive(v.radius,'Radius')**3/G;break;
 case 'clock-bender':result=fw?1/Math.sqrt(1-(nonneg(v.velocity,'Velocity')/C)**2):C*Math.sqrt(1-1/positive(v.gamma,'Gamma')**2);if(fw&&v.velocity>=C)throw Error('Speed must be below c');if(!fw&&v.gamma<1)throw Error('Gamma must be >= 1');break;
 case 'eye-budget':{const x=positive(v.cells,'Cells')*positive(v.ops,'Operations');result=fw?nonneg(v.views,'Views')*x:nonneg(v.work,'Work')/x;break}
 case 'fire-column':{const t=nonneg(v.te,'Electron T')+nonneg(v.ti,'Ion T');positive(t,'T sum');result=fw?Math.sqrt(8*PI*nonneg(v.linearDensity,'Line density')*KB*t/MU):positive(v.current,'Current')**2*MU/(8*PI*KB*t);break}
 case 'frequency-gate':result=fw?fplasma(nonneg(v.density,'Density')):nplasma(nonneg(v.frequency,'Frequency'));break;
 case 'wave-fade':{const f=positive(v.waveFrequency,'Wave frequency');if(fw){const fp=positive(v.plasmaFrequency,'Plasma frequency');if(fp<=f)throw Error('Plasma frequency must exceed the incident frequency');result=C/(2*PI*f*Math.sqrt((fp/f)**2-1));}else{const d=positive(v.depth,'Depth');result=f*Math.sqrt(1+(C/(2*PI*f*d))**2)}break;}
 case 'field-pressure':result=fw?v.field*v.field/(2*MU):Math.sqrt(nonneg(v.pressure,'Pressure')*2*MU);break;
 case 'field-decay':result=fw?nonneg(v.length,'Length')**2/positive(v.eta,'Diffusivity'):Math.sqrt(nonneg(v.time,'Time')*positive(v.eta,'Diffusivity'));break;
 case 'bit-heat':{const t=positive(v.temperature,'Temperature');result=fw?nonneg(v.erasures,'Erasures')*KB*t*Math.LN2:nonneg(v.energy,'Energy')/(KB*t*Math.LN2);break;}
 case 'tunnel-tater':{const d=positive(v.height-v.kinetic,'Barrier minus particle energy');const k=2*Math.sqrt(2*ME*EVM*d)/HB;result=fw?Math.exp(-k*nonneg(v.width,'Width')):-Math.log(prob(v.probability,'Probability',Number.MIN_VALUE,1))/k;break;}
 case 'nerve-echo':{const tau=positive(v.tau,'Tau'),d=v.initial-v.rest; if(Math.abs(d)<1e-15)throw Error('Initial and rest must differ');if(fw)result=v.rest+d*Math.exp(-nonneg(v.time,'Time')/tau);else{const ratio=(v.voltage-v.rest)/d;if(!(ratio>0&&ratio<=1))throw Error('Target voltage outside passive-decay trajectory');result=-tau*Math.log(ratio)}break;}
 case 'pattern-pulse':{const sig=positive(v.spread,'Spread');result=fw?Math.exp(-0.5*((v.input-v.center)/sig)**2):v.center+sig*Math.sqrt(-2*Math.log(prob(v.response,'Response',Number.MIN_VALUE,1)));break;}
 case 'choice-entropy':{
  const entropy=p=>p===0||p===1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
  if(fw)result=entropy(prob(v.probability,'Probability'));
  else{const h=prob(v.bits,'Entropy',0,1);let lo=0,hi=0.5;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(entropy(mid)<h)lo=mid;else hi=mid}result=(lo+hi)/2;}break;
 }
 case 'symbol-ceiling':result=fw?Math.log2(positive(v.states,'States')):2**nonneg(v.bits,'Bits');break;
 case 'lift-ledger':result=fw?nonneg(v.mass,'Mass')*positive(v.acceleration,'g'):nonneg(v.force,'Force')/positive(v.acceleration,'g');break;
 case 'quiet-coil':{const na=positive(v.turns,'Turns')*positive(v.area,'Area');result=fw?na*Math.abs(v.rate):nonneg(v.emf,'EMF')/na;break;}
 case 'motion-root':result=fw?positive(v.mass,'Mass')*v.velocity:v.momentum/positive(v.mass,'Mass');break;
 case 'wave-clock':result=fw?1/positive(v.frequency,'Frequency'):1/positive(v.period,'Period');break;
 case 'odd-one-out':result=fw?Math.abs(v.observation-v.mean)/positive(v.spread,'Deviation'):v.mean+nonneg(v.z,'Z score')*positive(v.spread,'Deviation');break;
 case 'learn-reverse':result=fw?v.theta-positive(v.rate,'Learning rate')*v.gradient:(v.theta-v.next)/positive(v.rate,'Learning rate');break;
 case 'pair-mirror':result=fw?(1+prob(v.visibility,'Visibility'))/2:2*prob(v.match,'Match probability',0.5,1)-1;break;
 case 'signal-rail':result=fw?nonneg(v.duration,'Duration')*positive(v.rate,'Rate'):nonneg(v.samples,'Samples')/positive(v.rate,'Rate');break;
 case 'middle-c':result=fw?v.scale*v.input+v.offset:(v.output-v.offset)/positive(v.scale,'Scale');break;
 default:throw Error('Unimplemented model');
 }
 if(!Number.isFinite(result))throw Error('Model result outside representable range');
 const primary=fw?g.forward:g.backward;
 return {id,direction,primary:primary.key,input:v[primary.key],value:result,unit:fw?g.backward.unit:g.forward.unit,outputLabel:fw?g.backward.label:g.forward.label,name:g.name,boundary:g.boundary,formula:g.equation,classification:'mathematical model',context:g.context.map(x=>({key:x.key,value:v[x.key]}))};
}
function audit(){
 const labels=[...FAMILIES.map(x=>x.label),...GATES.map(x=>x.name)];
 return {familyCount:FAMILIES.length,gateCount:GATES.length,uniqueIds:new Set(GATES.map(g=>g.id)).size===GATES.length,names:labels,allHaveBoundaries:GATES.every(g=>!!g.boundary&&!!g.equation)};
}
function graft(state,Root){
 if(!Root||typeof Root.addNode!=='function'||typeof Root.attach!=='function')throw Error('Octopus Root engine required');
 let s=state,added=0,attached=0;
 function node(id,label,kind,origin){if(s.nodes.some(n=>n.id===id))return;const r=Root.addNode(s,{id,label,kind,origin});if(!r.ok)throw Error('Graft node '+id+': '+r.why);s=r.state;added++;}
 function link(from,to,note){if(s.edges.some(e=>e.from===from&&e.to===to&&e.type==='symbolic'))return;const r=Root.attach(s,{from,to,type:'symbolic',note});if(!r.ok)throw Error('Graft link: '+r.why);s=r.state;attached++;}
 node('continuum:root','SOVEREIGN CONTINUUM — FORWARD / MIDDLE C / BACKWARD','project','Original Nathan AI laboratory, software-only');
 link('core:middle','continuum:root','Middle C collision: forward prediction and backward reconciliation');
 for(const f of FAMILIES){const id='continuum:family-'+f.id;node(id,f.label,'project','Sovereign Continuum original family');link('continuum:root',id,'Root family: '+f.motto);}
 for(const g of GATES){const id='continuum:gate-'+g.id;node(id,g.name,'formula','Original renamed numerical teaching gate: '+g.equation);link('continuum:family-'+g.family,id,'Sucker-cup model: '+g.equation+'; boundary: '+g.boundary);}
 return {state:s,added,attached,gateCount:GATES.length};
}
return Object.freeze({VERSION:'1.0.0',C,FAMILIES,GATES,calculate,audit,graft});
});
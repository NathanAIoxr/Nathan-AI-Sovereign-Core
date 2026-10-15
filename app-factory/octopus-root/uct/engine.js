/* NATHAN AI / MIDDLE C / OCTOPUS ROOT: Universal Continuum Tensor
 * Fiction/research simulation pack, not a physical detector.
 * Namespace 'uct:' is sovereign; no auto-publishing, deleting, or remote accounts.
 */
(function(root, factory) {
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  else root.UniversalContinuumRoot=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const SCHEMA="tabor.uct.root-pack.v2";
const SOURCE="Owner-supplied 2026-10-15 Star Wars / Matrix reverse-engineering compilation + UCT v1 specification";
const STATUSES=Object.freeze(["established-math","physical-approximation","hypothetical","fictional","software-engineering"]);
const B=[
 {id:"warp",title:"01 · Hyperdrive & Spacetime",domain:"mixed",status:"hypothetical",
  forward:"Given an Alcubierre-style metric and shape function, calculate a modeled trajectory, stress-energy and boundary profile.",
  backward:"Given apparent translation or lensing in a fictional scene, fit possible metrics and retain non-unique solutions.",
  scenes:["Unknown Regions passage","Hyperspace navigation","Casimir plate thought experiment"],
  concepts:["Einstein tensor Gμν","Stress-energy Tμν","Alcubierre line element","Shape function f(rs)","Casimir energy density","Hypothetical negative-energy requirements","Geodesic and lensing observable","Energy conditions and conservation","Forward trajectory prediction","Inverse metric ambiguity","Routing around unstable zones"],
  formulas:[["einstein","Gμν = (8πG/c⁴)Tμν","established-math","Einstein equations without separately written cosmological constant."],["alcubierre","ds² = -c²dt² + [dx-vs(t)f(rs)dt]² + dy² + dz²","hypothetical","Mathematical metric, not established propulsion."],["casimir","ρ = -π²ℏc/(720a⁴)","physical-approximation","Parallel ideal plate energy per volume; cannot be equated to a working warp engine."]]},
 {id:"plasma",title:"02 · Blades, Blasters & Plasma",domain:"mixed",status:"physical-approximation",
  forward:"Model currents, temperature, conductivity, Lorentz forces and field diffusion in a bounded plasma.",
  backward:"Infer a possible field/current configuration from hypothetical light, thermal and electrical telemetry.",
  scenes:["Lightsaber blade as fictional containment","Blaster bolt emission","Blade collision and reconnection"],
  concepts:["Lorentz force J × B","Magnetic pressure","Bennett pinch relation","Current I","Electron and ion temperature","Line density N","Induction equation","Conductivity σ and diffusivity η","Boundary stability","Emissivity diagnostics","Heat and material limits"],
  formulas:[["lorentz","∇P = J×B","physical-approximation","Static equilibrium simplification; additional terms often matter."],["bennett","I² = 8πNkB(Te+Ti)/μ0","physical-approximation","An idealized pinch model, not a handheld plasma weapon recipe."],["induction","∂B/∂t = ∇×(u×B)+η∇²B","physical-approximation","Uniform diffusivity approximation."]]},
 {id:"shield",title:"03 · Deflectors & Plasma Cutoff",domain:"mixed",status:"physical-approximation",
  forward:"For an ideal unmagnetized plasma, predict cutoff frequency and attenuation as a function of electron density.",
  backward:"Fit electron density from specified frequency-dependent attenuation; reject one-photocell 'shield proof'.",
  scenes:["Deflector screen flash","Radio-wave plasma reflection","Frequency-selective protection puzzle"],
  concepts:["Electron density ne","Plasma angular frequency ωp","Electron charge e","Permittivity ε0","Electron mass me","Refractive index n","Imaginary evanescent index iκ","Field decay E(x)","Frequency dependence","Finite layer losses","Optical sensor limitations"],
  formulas:[["cutoff","ωp = sqrt(ne e²/(ε0 me))","physical-approximation","Cold, unmagnetized, collisionless plasma approximation."],["index","n = sqrt(1-(ωp/ω)²)","physical-approximation","Not a universal laser/kinetic shield."],["decay","E(x) = E0 exp(-ωκx/c)","physical-approximation","Idealized evanescent field behavior."]]},
 {id:"repulsor",title:"04 · Repulsorlift & Gravitomagnetism",domain:"mixed",status:"hypothetical",
  forward:"Calculate weak-field frame-dragging corrections from idealized mass currents; distinguish from thrust.",
  backward:"Given a fictional hovering craft, compare ordinary lift with proposed gravitomagnetic models.",
  scenes:["Repulsorlift hovering","Rotating fluid engine narrative","Planetary gravity comparison"],
  concepts:["Linearized general relativity","Gravitoelectric field Eg","Gravitomagnetic field Bg","Vector potential Ag","Angular momentum J","Frame dragging","Velocity cross-product","Weak-field assumptions","Planetary acceleration g","Hover force balance","No demonstrated antigravity engine"],
  formulas:[["gem","a ≈ Eg + v×Bg","physical-approximation","Convention-dependent factors; not evidence that rotating fluid cancels gravity."]]},
 {id:"unknown",title:"05 · Unknown Regions & Unseen Boundaries",domain:"fiction",status:"hypothetical",
  forward:"Introduce a dimensionally consistent hypothetical anomaly term, choose boundary profiles and simulate detours.",
  backward:"Recover an anomaly intensity from fictional clock and optical channels; report estimation error.",
  scenes:["Star Wars Unknown Regions","Unmapped cosmic boundaries","Quantum foam story zones"],
  concepts:["Unmapped routes","Unknown and Unseen","Hypothetical scalar ψ","Additional Ξμν stress-energy","Covariant conservation","Synthetic clock drift","Synthetic optical attenuation","Anomaly reconstruction","Route-collapse gameplay risk","Adaptive detour planning","Source distinction: observed vs invented"],
  formulas:[["extension","Gμν = (8πG/c⁴)(Tμν+Θμν+Ξμν)","hypothetical","All added terms need correct units and ∇μ(T+Θ+Ξ)μν=0."],["scalar","Ξμν = ζ[∇μψ∇νψ - ½gμν(∇ψ)² - gμνV(ψ)]","hypothetical","Toy scalar field, not a detected quantum foam signal."],["risk","Pscript = 1/(1+exp(4-2.6a))","fictional","Probability selected for route-game mechanics only."]]},
 {id:"phasing",title:"06 · Phasing, Specters & Eigenstates",domain:"fiction",status:"fictional",
  forward:"Apply an explicit fictional collision/permeability rule to programs or characters; simulate bypass events.",
  backward:"Infer a game rule from apparent barrier traversal without claiming a global phase moves matter through walls.",
  scenes:["Merovingian exiles","Rogue deleted programs","Ghosts and phantoms","Solid-code boundaries"],
  concepts:["Wave function Ψ","Eigenstate language","Cloak operator M","Probability overlap","Global phase exp(iφ)","Global-phase invariance","Fictional permeability flag","Barrier collision rules","Phase-shift game states","Specter visibility","Intrusion detection analogy"],
  formulas:[["amplitude","P = |〈Ψobject|M|Ψwall〉|²","hypothetical","Not a validated model for matter traversal; state/operator definitions required."],["phase","M = exp(iφ) I","established-math","A global phase leaves observable probabilities unchanged; cannot make a wall permeable."]]},
 {id:"machine",title:"07 · Deep Machine Core & The Source",domain:"software+fiction",status:"software-engineering",
  forward:"Run a deterministic state machine: access checks, cryptographic integrity, transitions, replay and clock drift.",
  backward:"Trace simulated logs to reconstruct which program state or failed authorization caused a fictional anomaly.",
  scenes:["The Matrix Source","Mobil Ave / limbo","Merovingian exile network","Background subroutines"],
  concepts:["Finite program state","Version mismatch","Authorization boundary","Cryptographic integrity","Audit logs","Replay trace","Clock skew","Orphan tasks and limbo","Source firewall","Merovingian-style exile narrative","Machine network partition","Human-reviewed recovery"],
  formulas:[["transition","s(t+1) = δ(s(t),event(t))","software-engineering","Real software state-machine form; sci-fi narrative is fictional."],["integrity","verify(hash(payload),recordedDigest)","software-engineering","An integrity check, not proof of hidden layers of physical reality."]]}
];
const CROSS=[
 ["warp","unknown","Hyperdrive story routes cross the Unknown Regions boundary model."],
 ["plasma","shield","Shared plasma concepts; distinct applications and boundary conditions."],
 ["shield","phasing","Contrast physical attenuation with fictional permeability."],
 ["repulsor","warp","Both refer to spacetime language, but propulsion claims differ."],
 ["unknown","machine","Compare cosmic anomaly plots with simulated clock-skew/software failure."],
 ["phasing","machine","Exile/phasing narrative can be implemented as machine-state transitions."],
 ["machine","shield","Software firewall access and electromagnetic plasma cutoff are analogies, not identical objects."],
 ["unknown","phasing","Unseen entities and unmapped sectors connect at narrative level, not physics proof."]
];
const clone=x=>JSON.parse(JSON.stringify(x));
function catalogue(){return clone(B)}
function ledger(){return B.flatMap(b=>b.formulas.map(f=>({id:b.id+"."+f[0],branch:b.id,formula:f[1],status:f[2],limitation:f[3],source:SOURCE})))}
function build(){
 const nodes=[{id:"uct:continuum",label:"UNIVERSAL CONTINUUM TENSOR — THE UNKNOWN & UNSEEN",kind:"project",origin:SOURCE,glyphs:"UCT"}];
 const edges=[{from:"core:middle",to:"uct:continuum",type:"symbolic",note:"THE MIDDLE C: forward prediction, inverse reconstruction and receptor review."}];
 for(const b of B){
  const head="uct:"+b.id;
  nodes.push({id:head,label:b.title,kind:"project",origin:SOURCE,glyphs:""});
  edges.push({from:"uct:continuum",to:head,type:"symbolic",note:"Sovereign UCT branch ("+b.status+"); does not merge other Factory projects."});
  for(const [suffix,title,kind,text] of [["forward","ABOVE C — "+b.forward,"symbol",b.forward],["backward","BELOW C — "+b.backward,"symbol",b.backward]]){
   const id=head+"-"+suffix;
   nodes.push({id,label:title.slice(0,100),kind,origin:SOURCE,glyphs:""});
   edges.push({from:head,to:id,type:"symbolic",note:text.slice(0,400)});
  }
  b.concepts.forEach((v,i)=>{
   const id=head+"-c"+String(i+1).padStart(2,"0");
   nodes.push({id,label:v,kind:"symbol",origin:SOURCE,glyphs:""});
   edges.push({from:head,to:id,type:"symbolic",note:"Concept receptor; "+b.status+"; preserve independent evidence review."});
  });
  b.formulas.forEach((f,i)=>{
   const id=head+"-f"+String(i+1).padStart(2,"0");
   nodes.push({id,label:f[1].slice(0,100),kind:"formula",origin:SOURCE,glyphs:""});
   edges.push({from:head,to:id,type:"symbolic",note:f[2]+": "+f[3]});
  });
  b.scenes.forEach((v,i)=>{
   const id=head+"-s"+String(i+1).padStart(2,"0");
   nodes.push({id,label:v,kind:"symbol",origin:SOURCE,glyphs:""});
   edges.push({from:head,to:id,type:"symbolic",note:"Fictional scene/context, not observational science."});
  });
 }
 for(const [a,b,note] of CROSS)edges.push({from:"uct:"+a,to:"uct:"+b,type:"symbolic",note});
 return {schema:SCHEMA,owner:"Nathan Tabor",created:"2026-10-15",source:SOURCE,nodes,edges,branches:catalogue(),ledger:ledger(),crosslinks:clone(CROSS),originals:"Original source and root snapshots remain unchanged; all link assertions tagged symbolic and reviewed separately."};
}
function install(rootEngine,state){
 if(!rootEngine || typeof rootEngine.addNode!=="function" || typeof rootEngine.attach!=="function")throw Error("Compatible Octopus Root engine required");
 if(!state || state.schema!==rootEngine.SCHEMA)throw Error("Root snapshot required");
 const pack=build();let next=state,addedNodes=0,addedEdges=0,skippedNodes=0,skippedEdges=0;const conflicts=[];
 for(const n of pack.nodes){
  const prior=next.nodes.find(x=>x.id===n.id);
  if(prior){skippedNodes++;if(prior.label!==n.label)conflicts.push("Different label for "+n.id);continue}
  const r=rootEngine.addNode(next,n);
  if(r.ok){next=r.state;addedNodes++}else conflicts.push(n.id+": "+r.why);
 }
 for(const e of pack.edges){
  if(next.edges.some(x=>x.from===e.from && x.to===e.to && x.type===e.type)){skippedEdges++;continue}
  // Root attach routes invalid links to Cookie Monster without deleting sources.
  const r=rootEngine.attach(next,e);next=r.state;
  if(r.ok)addedEdges++;else conflicts.push(e.from+" → "+e.to+": "+r.why);
 }
 return {state:next,addedNodes,addedEdges,skippedNodes,skippedEdges,conflicts,packSchema:SCHEMA};
}
const CLOCK_GAIN=.4,LIGHT_GAIN=.85,SIGMA_CLOCK=.025,SIGMA_LIGHT=.045;
function anomaly(x){return .1+1.55*Math.exp(-.5*Math.pow((x-.33)/.075,2))+2.15*Math.exp(-.5*Math.pow((x-.73)/.10,2))}
function forward(a){if(!Number.isFinite(a)||a<0)throw Error("Finite nonnegative simulated anomaly required");return {clockRatio:1+CLOCK_GAIN*a,logTransmission:-LIGHT_GAIN*a,transmission:Math.exp(-LIGHT_GAIN*a)}}
function backward(clock,logLight){
 if(!Number.isFinite(clock)||!Number.isFinite(logLight))throw Error("Finite readings required");
 const num=CLOCK_GAIN*(clock-1)/(SIGMA_CLOCK**2)+LIGHT_GAIN*(-logLight)/(SIGMA_LIGHT**2);
 const den=CLOCK_GAIN**2/(SIGMA_CLOCK**2)+LIGHT_GAIN**2/(SIGMA_LIGHT**2);
 return Math.max(0,num/den);
}
function risk(a){if(!Number.isFinite(a))throw Error("Finite anomaly required");return 1/(1+Math.exp(Math.max(-100,Math.min(100,4-2.6*a))))}
function sweep(count=80){
 if(!Number.isInteger(count)||count<2||count>2000)throw Error("Sweep count must be 2..2000");
 const rows=[];for(let i=0;i<count;i++){const x=i/(count-1),a=anomaly(x),f=forward(a);rows.push({x,anomaly:a,...f,recovered:backward(f.clockRatio,f.logTransmission),scriptedRisk:risk(a)})}return rows;
}
function hardwareAudit(){
 const hbar=1.0545718e-34,maxADC=1023,maxFoam=maxADC*.00488*1.42/hbar;
 return {arduinoMega:true,sensors:["MPU-6050: acceleration / angular rate","HMC5883L: local magnetic field","LDR: ambient light","ACS712: electrical current"],trigger:5e35,maxOriginalToyFoam:maxFoam,triggerReachable:maxFoam>5e35,interpretation:"Sensors cannot detect dark energy, spacetime tensors, phasing, a hyperdrive, or a plasma shield. Use a current-limited LED, not an unprotected laser module."};
}
function reviewClaim(c){
 if(!c||!STATUSES.includes(c.status))return {accepted:false,route:"cookie-monster-review",reason:"Claim requires a domain/status label."};
 if(c.status==="established-math" && !c.assumptions)return {accepted:false,route:"cookie-monster-review",reason:"Equation assumptions are required."};
 if(!c.source)return {accepted:false,route:"cookie-monster-review",reason:"Provenance is required."};
 return {accepted:true,route:"receptor-eligible",reason:"Structurally complete; this does not independently verify the claim."};
}
return Object.freeze({SCHEMA,SOURCE,STATUSES,build,catalogue,ledger,install,anomaly,forward,backward,risk,sweep,hardwareAudit,reviewClaim});
});

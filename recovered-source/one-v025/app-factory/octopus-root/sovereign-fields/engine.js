/* SOVEREIGN FIELD LAB — original, local-first mathematical simulation.
 * No biological interface, pulse driver, power weapon, propulsion device, or data collector.
 */
(function (root, build) {
  'use strict';
  const api = build();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SovereignFieldRoot = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const K = Object.freeze({kb: 1.380649e-23, hbar: 1.054571817e-34,
    mu0: 1.25663706127e-6, eps0: 8.8541878128e-12, e: 1.602176634e-19,
    me: 9.1093837139e-31, c: 299792458, g: 9.80665});
  const MODEL = 'tabor.field.lab.v1';
  const groups = [
    ['field:sovereign','SOVEREIGN FIELD ROOT','project','ROOT','Mathematics stays mathematics. Fiction stays fiction.'],
    ['field:space','THE DISTANCE DECEIVER','project','ROOT','Coordinate and time-model laboratory'],
    ['field:mind','THE MIND BRIDGE','project','ROOT','Signal, learning and perception models'],
    ['field:power','THE ENERGY LEDGER','project','ROOT','Thermodynamic floors and theoretical equilibria'],
    ['field:matter','THE LIGHT FENCE','project','ROOT','Virtual plasma and wave cutoff'],
    ['field:motion','THE FLOAT HOUSE','project','ROOT','Forces, flight and virtual induction'],
    ['field:watch','THE EYE THAT CHECKS','project','ROOT','Truth labels, optimization and reversible review'],
    ['field:hardware','THE KNOB AND LIGHT','project','SIMPLIFIED','Low-voltage simulator: A0 knob, D13 light; nothing attached to people']
  ];
  const labs = [
    ['field:metric','THE SPACE RULER','field:space','MODEL','Quadratic metric interval: g_ab dx^a dx^b'],
    ['field:clock','TIME-BENDER','field:space','LAW','Special-relativistic clock ratio'],
    ['field:render','THE UNSEEN SAVER','field:space','ENGINEERING','Visible-cell work proxy, not consciousness-based physics'],
    ['field:packet','THE WAVE WANDERER','field:space','MODEL','Free Gaussian packet width'],
    ['field:bell','THE PAIRED WHISPER','field:space','MODEL','Ideal Bell protocol probabilities; no physical transmission'],
    ['field:nerve','THE NERVE LEDGER','field:mind','MODEL','Membrane currents with gating factors'],
    ['field:spectrum','THE BRAINWAVE MIRROR','field:mind','MODEL','Synthetic signal spectral analysis; no medical diagnosis'],
    ['field:learning','THE PRACTICE ENGINE','field:mind','FICTION','Tensor weight transformation for game skill values only'],
    ['field:erasure','THE BIT TOLL','field:power','LAW','k_B T ln(2) per logically irreversible erased bit'],
    ['field:capacity','THE INFORMATION GATE','field:power','MODEL','Binary entropy / Holevo upper bound for ideal ensemble'],
    ['field:pinch','THE PLASMA CIRCLE','field:matter','MODEL','Bennett ideal pinch-current equilibrium; not a stable confinement design'],
    ['field:cutoff','THE LIGHT FENCE GATE','field:matter','MODEL','Cold unmagnetized plasma cutoff and refractive index'],
    ['field:shield','THE HULL MIRROR','field:matter','FICTION','Visual-only shield deflection and collision rules'],
    ['field:hover','THE FLOAT BALANCE','field:motion','MODEL','Weight and idealized magnetic pressure balance'],
    ['field:induction','THE FLUX TURNER','field:motion','MODEL','Virtual Faraday induced voltage, no pulse output'],
    ['field:anomaly','THE PATTERN SENTINEL','field:watch','ENGINEERING','Frobenius distance between telemetry matrices'],
    ['field:gradient','THE LEARNING SLOPE','field:watch','ENGINEERING','Bounded quadratic gradient iteration'],
    ['field:identity','THE HANDOFF SEAL','field:watch','ENGINEERING','SHA-256 integrity seal; not authentication or identity proof'],
    ['field:story','THE NEVER-ENDING STAGE','field:watch','FICTION','Original story-mode field visuals, not reality manipulation']
  ];
  const catalog = Object.freeze(groups.concat(labs).map(a => Object.freeze({
    id:a[0], label:a[1],
    parent:groups.some(g=>g[0]===a[0])?(a[0]==='field:sovereign'?null:'field:sovereign'):a[2],
    status:a[3], description:a[4], kind:groups.some(g=>g[0]===a[0])?'project':'formula'
  })));
  const finite=(v,name,min=-Infinity,max=Infinity)=>{
    if (typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)
      throw new RangeError(name+' must be a finite number between '+min+' and '+max);
    return v;
  };
  function interval(g,dx){
    if(!Array.isArray(g)||g.length!==4||!Array.isArray(dx)||dx.length!==4)throw Error('Require a 4x4 metric and 4-coordinate displacement');
    let s=0;
    for(let i=0;i<4;i++){if(!Array.isArray(g[i])||g[i].length!==4)throw Error('Require a 4x4 metric');
      finite(dx[i],'coordinate');
      for(let j=0;j<4;j++)s+=finite(g[i][j],'metric')*dx[i]*finite(dx[j],'coordinate');
    }
    return s; // coordinates in length units, dx[0]=c dt; no engineered warping
  }
  function clock(beta){finite(beta,'speed/c',0,0.999999999);return {gamma:1/Math.sqrt(1-beta*beta),properToCoordinateRatio:Math.sqrt(1-beta*beta)}}
  function visibleWork(cells,units){return finite(cells,'visible cells',0,1e9)*finite(units,'work per cell',0,1e9)}
  function gaussianWidth(sigma0,t,mass){finite(sigma0,'initial width',1e-15);finite(t,'time',0);finite(mass,'mass',1e-35);return sigma0*Math.hypot(1,K.hbar*t/(2*mass*sigma0*sigma0))}
  function pairedWhisper(){return {outcomes:[0.25,0.25,0.25,0.25],classicalBits:2,idealPostCorrectionFidelity:1,physicalTransfer:false}}
  function membrane(x){
    const v=finite(x.v,'voltage'),m=finite(x.m,'m',0,1),h=finite(x.h,'h',0,1),n=finite(x.n,'n',0,1);
    for(const k of ['gNa','gK','gL'])finite(x[k],k,0);
    return x.gNa*m**3*h*(v-finite(x.eNa,'eNa'))+x.gK*n**4*(v-finite(x.eK,'eK'))+x.gL*(v-finite(x.eL,'eL'));
  }
  function spectrum(samples,sampleHz){
    if(!Array.isArray(samples)||samples.length<4||samples.length>256)throw Error('Provide 4–256 synthetic samples');
    finite(sampleHz,'sample Hz',0.01);
    const n=samples.length; samples.forEach(v=>finite(v,'sample'));
    const mean=samples.reduce((a,b)=>a+b,0)/n, bins=[];
    for(let k=1;k<=Math.floor(n/2);k++){let re=0,im=0;
      for(let j=0;j<n;j++){const a=2*Math.PI*k*j/n;re+=(samples[j]-mean)*Math.cos(a);im-=(samples[j]-mean)*Math.sin(a)}
      bins.push({hz:k*sampleHz/n,amplitude:2*Math.hypot(re,im)/n});
    }return bins;
  }
  function practiceWeight(oldWeight,impulse,threshold,sigma){
    finite(oldWeight,'old weight');finite(impulse,'game control');finite(threshold,'threshold');finite(sigma,'width',1e-12);
    return oldWeight*Math.exp(-0.5*((impulse-threshold)/sigma)**2);
  }
  function bitToll(bits,tempK){return finite(bits,'bit erasures',0)*K.kb*finite(tempK,'temperature',1e-12)*Math.LN2}
  function entropy01(p){finite(p,'probability',0,1);return p===0||p===1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p)}
  function informationGate(probability){return {binaryEntropyBits:entropy01(probability),holevoBoundBits:entropy01(probability)}}
  function plasmaCircle(te,ti,lineDensity,z=1){
    finite(te,'electron kelvin',0);finite(ti,'ion kelvin',0);finite(lineDensity,'line density',0);finite(z,'charge state',1);
    return Math.sqrt(8*Math.PI*K.kb*lineDensity*(z*te+ti)/K.mu0);
  }
  function lightFence(density,frequencyHz){
    finite(density,'electron density',0);finite(frequencyHz,'frequency',1e-12);
    const wp=Math.sqrt(density*K.e*K.e/(K.eps0*K.me)),omega=2*Math.PI*frequencyHz;
    return {plasmaAngularFrequency:wp,cutoffHz:wp/(2*Math.PI),
      refractiveIndex:omega>wp?Math.sqrt(1-(wp/omega)**2):null,propagates:omega>wp};
  }
  function floatBalance(mass,area){finite(mass,'mass',0);finite(area,'area',1e-12);const newtons=mass*K.g;
    return {forceNewtons:newtons,idealFieldTesla:Math.sqrt(2*K.mu0*newtons/area)}}
  function fluxTurn(turns,fluxRate){finite(turns,'turns',0);finite(fluxRate,'flux rate');return -turns*fluxRate}
  function patternSentinel(a,b){
    if(!Array.isArray(a)||!Array.isArray(b)||a.length!==b.length||a.length===0||a.length>64)throw Error('Matrices must match');
    let sum=0;
    a.forEach((row,i)=>{if(!Array.isArray(row)||!Array.isArray(b[i])||row.length!==b[i].length||row.length===0||row.length>64)throw Error('Rows must match');
      row.forEach((x,j)=>{const d=finite(x,'a')-finite(b[i][j],'b');sum+=d*d;});
    });return Math.sqrt(sum);
  }
  function slope(x,learningRate,target=0){finite(x,'x');finite(target,'target');finite(learningRate,'step',0,1);return x-2*learningRate*(x-target)}
  async function handoffSeal(text,subtle){
    if(typeof text!=='string'||text.length>16384)throw Error('Text must be <= 16 KiB');
    if(!subtle||typeof subtle.digest!=='function')throw Error('Cryptographic hash service is required');
    const bytes=new TextEncoder().encode(text);
    const hash=await subtle.digest('SHA-256',bytes);
    return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
  }
  function install(rootEngine,state){
    if(!rootEngine||!state||state.schema!==rootEngine.SCHEMA)throw Error('Existing Root engine and snapshot required');
    let s=state,added=0,linked=0,conflicts=[];
    for(const n of catalog){
      const match=s.nodes.find(x=>x.id===n.id);
      if(match){if(match.label!==n.label)conflicts.push(n.id);continue}
      const r=rootEngine.addNode(s,{id:n.id,label:n.label,kind:n.kind,
        origin:'Sovereign Field Lab / '+n.status+' / '+n.description});
      if(!r.ok){conflicts.push(n.id+': '+r.why);continue}
      s=r.state;added++;
    }
    for(const n of catalog){
      const from=n.parent||(n.id==='field:sovereign'?'core:middle':null);
      if(!from||!s.nodes.some(x=>x.id===n.id)||!s.nodes.some(x=>x.id===from))continue;
      if(s.edges.some(x=>x.from===from&&x.to===n.id&&x.type==='symbolic'))continue;
      const r=rootEngine.attach(s,{from,to:n.id,type:'symbolic',
        note:'Field branch: '+n.status+' / '+n.description});
      if(r.ok){s=r.state;linked++}else conflicts.push(n.id+': '+r.why);
    }
    return {state:s,added,linked,conflicts};
  }
  return Object.freeze({MODEL,K,catalog,interval,clock,visibleWork,gaussianWidth,pairedWhisper,
    membrane,spectrum,practiceWeight,bitToll,entropy01,informationGate,plasmaCircle,lightFence,
    floatBalance,fluxTurn,patternSentinel,slope,handoffSeal,install});
});
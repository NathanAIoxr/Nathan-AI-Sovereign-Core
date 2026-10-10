/* TABOR UNIVERSAL NODE V1 — deterministic, educational simulation.
 * Rotating X is a visual/user-defined coordinate frame. Earth ECEF origin is (0,0,0),
 * not an absolute stationary point in the universe. No diagnosis, supernatural detection,
 * quantum measurement, certified navigation, or actual cybersecurity is performed.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaborUniversalNode=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const MODULES=Object.freeze([
 {id:'nervous',name:'Nervous System',group:'body',model:'Signals and coordination',boundary:'No neural recordings or mind reading'},
 {id:'circulatory',name:'Circulatory System',group:'body',model:'Transport and oxygen delivery',boundary:'No live medical measurements'},
 {id:'respiratory',name:'Respiratory System',group:'body',model:'Gas exchange',boundary:'No lung diagnosis'},
 {id:'digestive',name:'Digestive System',group:'body',model:'Nutrients and energy',boundary:'Not a nutritional or metabolic model'},
 {id:'immune',name:'Immune System',group:'body',model:'Protection and response',boundary:'Does not detect pathogens'},
 {id:'lymphatic',name:'Lymphatic System',group:'body',model:'Drainage and transport',boundary:'Not modeled as instant toxin removal'},
 {id:'glymphatic',name:'Glymphatic Research',group:'body',model:'Research framework for brain waste clearance',boundary:'Human dynamics remain an active area of study'},
 {id:'endocrine',name:'Endocrine System',group:'body',model:'Hormonal signaling',boundary:'No endocrine diagnostics'},
 {id:'musculoskeletal',name:'Musculoskeletal System',group:'body',model:'Movement and structure',boundary:'No anatomy-specific predictions'},
 {id:'renal',name:'Urinary System',group:'body',model:'Filtration and excretion',boundary:'No kidney measurements'},
 {id:'skin',name:'Integumentary System',group:'body',model:'Barrier and thermal regulation',boundary:'No health assessment'},
 {id:'reproductive',name:'Reproductive System',group:'body',model:'Life cycle and reproduction',boundary:'No person-specific inference'},
 {id:'cellular',name:'Cellular Scale',group:'body',model:'Illustrative production and clearance rates',boundary:'No one-to-one accounting of every living cell'},
 {id:'core',name:'Earth Core / ECEF Origin',group:'earth',model:'Earth-centered Earth-fixed coordinate anchor',boundary:'Earth center not stationary in inertial space'},
 {id:'surface',name:'Earth Surface',group:'earth',model:'Local tangent orientation and relative position',boundary:'Requires real sensors for actual readings'},
 {id:'magnetic',name:'Geomagnetic Field',group:'earth',model:'Optional magnetic compass context',boundary:'Not five independent magnetic fields'},
 {id:'ionosphere',name:'Ionosphere',group:'earth',model:'GNSS radio propagation environment',boundary:'Requires observations for corrections'},
 {id:'spaceweather',name:'Magnetosphere / Space Weather',group:'earth',model:'Radiation environment context',boundary:'No physical shield produced'},
 {id:'planetary',name:'Solar System',group:'cosmos',model:'Ephemeris-driven astronomical positions',boundary:'No ephemerides included in this V1'},
 {id:'stars',name:'Stars and Galaxies',group:'cosmos',model:'Catalog-linked celestial positions',boundary:'No live astronomical catalog'},
 {id:'cosmicweb',name:'Cosmic Web',group:'cosmos',model:'Large-scale matter structure analogy',boundary:'Not a neural connectome'},
 {id:'relativity',name:'Spacetime',group:'cosmos',model:'Physical coordinates require defined reference frames',boundary:'No full relativity solver'},
 {id:'quantum',name:'Quantum Theory',group:'unknown',model:'Hypotheses vs measurements',boundary:'No quantum experiment or wavefunction collapse observed'},
 {id:'darkmatter',name:'Dark Matter Models',group:'unknown',model:'Science with incomplete explanatory models',boundary:'Not a detector of hidden entities'},
 {id:'unobserved',name:'Unknown and Unseen',group:'unknown',model:'Unresolved hypotheses and symbolic metaphors',boundary:'Unseen claims remain unresolved without evidence'}
]);
const GROUPS=['body','earth','cosmos','unknown'];
const LIMITS={min:-1e9,max:1e9};
function finite(v,name){if(typeof v!=='number'||!Number.isFinite(v)||v<LIMITS.min||v>LIMITS.max)throw Error('Invalid '+name);return v}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function angle(v){return((v%360)+360)%360}
function rotationMatrix(ax,ay,az){const [x,y,z]=[ax,ay,az].map(a=>angle(finite(a,'rotation'))*Math.PI/180);
 const [cx,sx,cy,sy,cz,sz]=[Math.cos(x),Math.sin(x),Math.cos(y),Math.sin(y),Math.cos(z),Math.sin(z)];
 return [[cz*cy,cz*sy*sx-sz*cx,cz*sy*cx+sz*sx],[sz*cy,sz*sy*sx+cz*cx,sz*sy*cx-cz*sx],[-sy,cy*sx,cy*cx]];
}
function multiply(m,v){return m.map(r=>r.reduce((a,x,i)=>a+x*v[i],0))}
function make(seed=73){if(!Number.isSafeInteger(seed))throw Error('Seed must be an integer');return {schema:'tabor.universal-node.state.v1',seed:seed>>>0,cycles:0,timeSeconds:0,anchor:[0,0,0],angles:[0,0,0],rates:[15,25,35],theOne:{id:'ONE:observer',present:true},body:{illustrativeResource:0.6,illustrativeWaste:0.1},cosmos:{illustrativeSignal:0},log:[]}}
function random(state){state.seed=(Math.imul(state.seed,1664525)+1013904223)>>>0;return state.seed/4294967296}
function step(state,delta=0.1){validate(state);finite(delta,'step');if(delta<=0||delta>60)throw Error('Step must be > 0 and <= 60 s');const next=structuredClone(state);next.cycles++;next.timeSeconds+=delta;
 next.angles=next.angles.map((v,i)=>angle(v+next.rates[i]*delta));
 const fuel=0.002*delta,production=0.007*delta,clearance=Math.min(next.body.illustrativeWaste,0.005*delta);
 next.body.illustrativeResource=clamp(next.body.illustrativeResource-fuel+0.001*delta,0,1);
 next.body.illustrativeWaste=clamp(next.body.illustrativeWaste+production-clearance,0,1);
 next.cosmos.illustrativeSignal=clamp(next.cosmos.illustrativeSignal+(random(next)-0.5)*0.08,-1,1);
 const warning=Math.abs(next.cosmos.illustrativeSignal)>0.7;
 next.log.push({cycle:next.cycles,kind:'simulation',note:warning?'Illustrative threshold crossed; no physical anomaly inferred':'Synthetic step simulated',time:next.timeSeconds});
 if(next.log.length>40)next.log.shift();
 return next}
function validate(s){if(!s||s.schema!=='tabor.universal-node.state.v1'||s.theOne?.id!=='ONE:observer'||s.theOne.present!==true)throw Error('Observer state integrity failure');if(!Array.isArray(s.anchor)||s.anchor.length!==3||s.anchor.some(x=>x!==0))throw Error('Anchor coordinates invalid');if(!Array.isArray(s.angles)||s.angles.length!==3||!Array.isArray(s.rates)||s.rates.length!==3)throw Error('Rotation vectors invalid');s.angles.forEach((v)=>finite(v,'angle'));s.rates.forEach(v=>finite(v,'rate'));for(const x of Object.values(s.body))finite(x,'body input');finite(s.cosmos.illustrativeSignal,'signal');return true}
function auditClaim(text,evidence){const claim=String(text||'').trim(),citations=Array.isArray(evidence)?evidence.filter(x=>typeof x==='string'&&x.trim()):[];return {claim,status:citations.length?'requires-independent-verification':'unverified',evidence:citations,scientificTruthVerified:false,warning:'Math, analogy, simulation output and source references alone cannot verify a scientific claim.'}}
function permission(action,approved){const harmless=new Set(['simulate','inspect','export-local','rotate-view']);return {allowed:harmless.has(action),reason:harmless.has(action)?'Local read/simulation only':'External action denied: requires trusted server authorization',clientFlagIgnored:!!approved}}
function componentsFor(group){if(!GROUPS.includes(group))throw Error('Unknown group');return MODULES.filter(n=>n.group===group)}
return Object.freeze({MODULES,GROUPS,make,step,validate,rotationMatrix,multiply,auditClaim,permission,componentsFor,angle});
});
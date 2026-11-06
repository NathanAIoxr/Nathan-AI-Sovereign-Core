/* Nathan AI Living Ears: measurable audio, authored 12-gate study and non-diagnostic text parsing.
   All records stay local. Never infer truth, emotions, health, identity, gender, or intent from a voice. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanLivingEars=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const mechanisms=Object.freeze([
 {id:'impact',name:'Impact / percussion',description:'Energy transferred by strikes and collisions'},
 {id:'flow',name:'Flow / turbulence',description:'Air and water fluctuations, pulses and jets'},
 {id:'friction',name:'Friction / scraping',description:'Stridulation, sliding grains and vibrating contact'},
 {id:'oscillation',name:'Sustained oscillation',description:'Vocal folds, strings, membranes and periodic sound sources'},
 {id:'resonance',name:'Resonance / reflection',description:'Cavities, cliffs and vocal-tract filters shape sound'},
 {id:'transduction',name:'Electromagnetic transduction',description:'Electrical, radio or plasma measurements rendered as audible sound'}
]);
const views=Object.freeze(['forward','reverse','vertical-inverted','other-side-mirror']);
const earGates=Object.freeze([
 ['EG-01','Excitation / original source','Name what physically vibrates or generates energy'],
 ['EG-02','Propagation medium','Identify air, water, solid rock or electromagnetic transmission'],
 ['EG-03','Transmission path','Describe direct, reflected, recorded, amplified or converted paths'],
 ['EG-04','Waveform / amplitude','Measure recorded digital amplitude; not calibrated sound pressure'],
 ['EG-05','Timing / pauses','Measure gaps and event spacing without assigning motivation'],
 ['EG-06','Periodicity / pitch','Distinguish a possible tonal source from a noisy source; pitch inference requires more work'],
 ['EG-07','Spectrum / resonance','Describe formants and frequency coloring only with adequate measurements'],
 ['EG-08','Articulation','Describe audible sound boundaries, vowels and consonants'],
 ['EG-09','Literal transcript','Preserve exact words independently of acoustic interpretation'],
 ['EG-10','Turn-taking / context','Who spoke when, to whom and under which conditions, when explicitly known'],
 ['EG-11','Provenance / uncertainty','Mark observation, hypothesis and independent supporting evidence separately'],
 ['EG-12','Consent / ethical limits','No involuntary capture or diagnosis, personality, honesty or identity scoring']
].map(([id,name,description])=>Object.freeze({id,name,description,status:'Provisional engineering labels, not recovered author-defined canonical names'})));
const tracks=Object.freeze(mechanisms.flatMap((m)=>views.map(v=>Object.freeze({id:m.id+':'+v,mechanism:m.id,view:v}))));
const round=n=>Math.round(n*1e6)/1e6;
function analyzeWaveform(input,rate,opts={}){
 if(!(input instanceof Float32Array)&&!Array.isArray(input))throw new TypeError('PCM sample array required');
 if(!Number.isFinite(rate)||rate<8000||rate>192000)throw new RangeError('Sample rate must be 8000 to 192000 Hz');
 if(!input.length||input.length>5000000)throw new RangeError('1 to 5,000,000 samples only');
 const samples=input.length,win=Math.max(1,Math.round(rate*0.02));
 const maxFrames=1500,frameStride=Math.max(1,Math.ceil(Math.ceil(samples/win)/maxFrames));
 let sum=0,peak=0,cross=0,clip=0,previous=0,env=[],silence=0,total=0;
 for(let i=0;i<samples;i++){
   const x=Number(input[i]);if(!Number.isFinite(x)||Math.abs(x)>1.00001)throw new RangeError('PCM samples must be finite, normalized -1..1');
   sum+=x*x;peak=Math.max(peak,Math.abs(x));if(Math.abs(x)>=0.98)clip++;
   if(i&&((x<0&&previous>=0)||(x>=0&&previous<0)))cross++;previous=x;
 }
 for(let start=0,k=0;start<samples;start+=win,k++){
   let energy=0,n=0;
   for(let j=start;j<Math.min(samples,start+win);j++){energy+=Number(input[j])**2;n++}
   const rms=Math.sqrt(energy/n);if(rms<0.015)silence++;total++;
   if(k%frameStride===0)env.push(round(rms));
 }
 if(env.length>maxFrames)env=env.slice(0,maxFrames);
 return Object.freeze({schema:'nathan-ai.living-ears.signal.v1',sampleCount:samples,sampleRate:rate,durationSeconds:round(samples/rate),
   peakNormalized:round(peak),rmsNormalized:round(Math.sqrt(sum/samples)),
   zeroCrossings:cross,zeroCrossingRatePerSecond:round(cross/(samples/rate)),
   nearClipFraction:round(clip/samples),quietFrameFraction:round(silence/total),
   analysisWindowMs:20,amplitudeEnvelope:env,
   limits:'Digital signal features only. No calibrated SPL, pitch diagnosis, identity, health, deception, emotion, or intention inference.'});
}
function inspectTranscript(text){
 if(typeof text!=='string')throw new TypeError('Exact transcript required');
 if(new TextEncoder().encode(text).length>512000)throw new RangeError('512k UTF-8 text limit');
 const words=text.match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu)||[];
 const paragraphs=text.trim()?text.trim().split(/\n\s*\n/u):[];
 const lines=text.length?text.split(/\r?\n/u):[];
 return Object.freeze({schema:'nathan-ai.living-ears.transcript.v1',original:text,wordCount:words.length,
   lineCount:lines.length,paragraphCount:paragraphs.length,questionMarks:(text.match(/\?/gu)||[]).length,
   exclamationMarks:(text.match(/!/gu)||[]).length,
   note:'Punctuation in a transcript is editorial text, not a measurement of delivery. Silence and pitch are unavailable from text alone.'});
}
function axisOverlay(eyeApi,tick=0,mode='full'){
 if(!eyeApi||typeof eyeApi.frame!=='function')throw new TypeError('Living Eyes engine connection required');
 const frame=eyeApi.frame(tick,{mode});
 return Object.freeze({schema:'nathan-ai.living-ears.eye-bridge.v1',primaryEarTracks:tracks.length,
    eyeLogicalViews:frame.viewCount,eyeConverged:frame.converged,equator:frame.equator});
}
function estimateMeaning(){
 return Object.freeze({directMeasurements:['digital waveform amplitude','duration','zero crossings','relative quiet fraction','text word count'],
   interpretationsRequiringContext:['intent','sarcasm','emotion','interpersonal alignment','authority','health','truthfulness','personal identity'],
   rule:'Acoustics alone cannot verify those interpretations. Review transcript, provenance and independent evidence.'});
}
return Object.freeze({mechanisms,views,tracks,earGates,analyzeWaveform,inspectTranscript,axisOverlay,estimateMeaning});
});
/* Nathan AI macro resonators: safe original abstract audio sketches. Never infrasound or stress induction. */
(function(root,build){'use strict';const api=build();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanMacroSound=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PRESETS=Object.freeze([
 Object.freeze({id:'cave',label:'Cave / echo',frequencies:[183,244],dur:4,description:'Fictional reverberant cave sketch; not a genuine prehistoric recording'}),
 Object.freeze({id:'river',label:'Water / river',frequencies:[265,354],dur:4,description:'Synthetic water-inspired tones; not environmental surveillance'}),
 Object.freeze({id:'wind',label:'Wind / valley',frequencies:[312,416],dur:4,description:'Abstract airflow-inspired tones'}),
 Object.freeze({id:'myth',label:'Mythic / historical fiction',frequencies:[195,292],dur:4,description:'Original archetype, not Jesus, Satan or any actual person'})
]);
function preset(id){const p=PRESETS.find(x=>x.id===id);if(!p)throw new RangeError('Unknown preset');return p}
function play(context,id,volume=.05){
 if(!context||typeof context.createOscillator!=='function')throw new TypeError('User-activated Web Audio context required');
 if(!Number.isFinite(volume)||volume<0||volume>.12)throw new RangeError('Soundboard volume exceeds safe software bound');
 const p=preset(id),start=context.currentTime,master=context.createGain();master.gain.setValueAtTime(0,start);
 master.gain.linearRampToValueAtTime(volume,start+.35);master.gain.setValueAtTime(volume,start+p.dur-.5);master.gain.linearRampToValueAtTime(0,start+p.dur);master.connect(context.destination);
 const nodes=[];for(const hz of p.frequencies){const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=1/p.frequencies.length;o.connect(g);g.connect(master);o.start(start);o.stop(start+p.dur);nodes.push(o)}
 const stop=()=>{for(const o of nodes){try{o.stop()}catch{}}try{master.disconnect()}catch{}};
 return Object.freeze({preset:p,stop});
}
return Object.freeze({PRESETS,preset,play});
});
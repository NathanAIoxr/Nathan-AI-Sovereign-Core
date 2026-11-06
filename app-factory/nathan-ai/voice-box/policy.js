/* Nathan AI Voice Box — device-first speech policy, no automatic network calls. */
(function(root,build){'use strict';const api=build();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanVoicePolicy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_BYTES=16384,MAX_CHUNK=800;
const byteLength=s=>new TextEncoder().encode(s).length;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)));
function locale(input){if(typeof input!=='string'||input.length>90)throw new TypeError('Language tag required');try{return Intl.getCanonicalLocales(input)[0]}catch{throw new RangeError('Invalid BCP-47 language tag')}}
function localVoices(voices){if(!voices||typeof voices[Symbol.iterator]!=='function')return [];
 const unique=new Set(),out=[];
 for(const v of voices){if(!v||v.localService!==true||typeof v.name!=='string'||typeof v.lang!=='string'||!v.name.trim())continue;
   let lang;try{lang=locale(v.lang)}catch{continue}
   const id=String(v.voiceURI||v.name+'|'+lang);
   if(unique.has(id))continue;unique.add(id);
   out.push(Object.freeze({id,name:v.name,lang,local:true,raw:v}));}
 return out.sort((a,b)=>a.lang.localeCompare(b.lang)||a.name.localeCompare(b.name));
}
function split(text,size=MAX_CHUNK){
 if(typeof text!=='string')throw new TypeError('Text required');
 if(byteLength(text)>MAX_BYTES)throw new RangeError('Text exceeds 16KiB local speech limit');
 if(!Number.isSafeInteger(size)||size<40||size>2000)throw new RangeError('Invalid chunk length');
 // Preserve every UTF-16 code unit, including original whitespace. No summarization or token replacement.
 const points=Array.from(text);let chunks=[],buf='',count=0;
 for(const p of points){if(count+p.length>size&&buf){chunks.push(buf);buf='';count=0}buf+=p;count+=p.length}
 if(buf)chunks.push(buf);
 return Object.freeze(chunks);
}
function buildPlan(text,voice,options={}){
 if(typeof text!=='string'||!text.trim())throw new TypeError('Non-empty owner-selected text required');
 if(!voice||voice.local!==true||!voice.raw||voice.raw.localService!==true)throw new Error('Only a browser-reported local voice is permitted');
 const rate=Number(options.rate??1),pitch=Number(options.pitch??1),volume=Number(options.volume??0.65);
 if([rate,pitch,volume].some(v=>!Number.isFinite(v)))throw new RangeError('Non-finite audio control');
 if(rate<0.5||rate>1.7||pitch<0.6||pitch>1.5||volume<0||volume>0.8)throw new RangeError('Audio control exceeds bounded range');
 return Object.freeze({schema:'nathan-ai.voice-box.local.v1',rawOriginal:text,lang:voice.lang,voiceId:voice.id,voice:voice.raw,
   chunks:split(text),rate,pitch,volume,requestedNetwork:false,
   note:'Browser-reported localService voice only; verify airplane-mode behavior on actual target devices.'});
}
const ARCHETYPES=Object.freeze([
 Object.freeze({id:'neutral',label:'Neutral narrator',status:'original fictional delivery style'}),
 Object.freeze({id:'ancestor-story',label:'Ancestral storytelling',status:'fictional storytelling style; not a specific relative'}),
 Object.freeze({id:'ancient-story',label:'Ancient-world storyteller',status:'fictional reconstruction; not the actual historical voice'}),
 Object.freeze({id:'mythic',label:'Mythic character',status:'fictional archetype; not an authentic supernatural entity'})
]);
function rights(kind,confirmed){
 const types=['owner-recording','authorized-family-recording','public-domain-recording','original-fictional'];
 if(!types.includes(kind))throw new RangeError('Unknown media provenance');
 return Object.freeze({type:kind,allowed:confirmed===true,warning:confirmed===true?
 'Playback only. Recording or performance rights remain the uploader’s responsibility.':'Consent / lawful rights not confirmed: playback blocked.'});
}
function footprint(text,options={}){
 const packCount=Number(options.installedPacks||0);
 if(!Number.isInteger(packCount)||packCount<0)throw new RangeError('Invalid pack count');
 return Object.freeze({schema:'nathan-ai.voice-box.footprint.v1',textBytes:byteLength(String(text)),outboundAudioBytes:0,outboundTextBytes:0,
 cloudInferenceCalls:0,cloudLanguageTokens:0,modelPacksAutoDownloaded:0,installedPacksReported:packCount,
 qualification:'Counts describe this static application only; OS browser speech services and installed models have their own implementation details.'});
}
return Object.freeze({MAX_BYTES,MAX_CHUNK,locale,localVoices,split,buildPlan,ARCHETYPES,rights,footprint,clamp});
});
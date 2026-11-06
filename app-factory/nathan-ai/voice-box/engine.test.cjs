'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('./policy.js'),N=require('./noise.js'),M=require('./macro.js');
test('only explicitly local voices survive selection; hosted voice cannot be used',()=>{
 const rem={name:'Cloud',lang:'en-US',localService:false,voiceURI:'cloud'},
 local={name:'Device',lang:'en-US',localService:true,voiceURI:'local'};
 const vs=P.localVoices([rem,local,local]);assert.equal(vs.length,1);assert.equal(vs[0].name,'Device');
 assert.throws(()=>P.buildPlan('hello',{name:'Cloud',raw:rem,local:false}),/Only/);
 const x=P.buildPlan('Hello world',vs[0]);assert.equal(x.requestedNetwork,false);assert.equal(x.rawOriginal,'Hello world');
});
test('all source characters preserved across voice chunks',()=>{
 const text=('שלום മലയാളം 日本語 — Here  There.\n').repeat(90);
 assert.equal(P.split(text).join(''),text);assert.throws(()=>P.split('x'.repeat(16385)),RangeError);
 assert.equal(P.locale('EN-us'),'en-US');assert.throws(()=>P.locale('<not a locale>'),RangeError);
});
test('bounded rate pitch volume and local footprint',()=>{
 const v=P.localVoices([{name:'Local',lang:'fr-FR',localService:true}])[0];
 assert.throws(()=>P.buildPlan('x',v,{volume:1}),RangeError);
 assert.throws(()=>P.buildPlan('x',v,{rate:12}),RangeError);
 assert.equal(P.footprint('hello').outboundAudioBytes,0);assert.equal(P.footprint('hello').cloudLanguageTokens,0);
});
test('no person voice clone contract or deceptive historical claim',()=>{
 assert.equal(P.ARCHETYPES.length,4);assert.ok(P.ARCHETYPES.every(x=>x.status.includes('fictional')));
 assert.equal(P.rights('authorized-family-recording',false).allowed,false);
 assert.equal(P.rights('authorized-family-recording',true).allowed,true);
 assert.throws(()=>P.rights('unapproved',true),RangeError);
});
test('local gate reduces low-level signal while preserving speech-like amplitude and duration',()=>{
 const sr=16000;const arr=new Float32Array(sr);
 for(let i=0;i<sr;i++)arr[i]=(i<8000?.004:.5)*Math.sin(Math.PI*2*200*i/sr);
 const r=N.process(arr,sr,.018);assert.equal(r.samples.length,sr);
 const a=Float32Array.from(r.samples.slice(0,8000)),b=Float32Array.from(r.samples.slice(8000));
 const mean=x=>x.reduce((s,v)=>s+Math.abs(v),0)/x.length;
 assert.ok(mean(a)<.001);assert.ok(mean(b)>.25);assert.ok(r.outputRms<r.inputRms);
});
test('PCM16 WAV produced locally, dimensions validated',()=>{
 const data=N.wav(new Float32Array([0,.5,-.5]),16000);const dv=new DataView(data);
 assert.equal(data.byteLength,50);assert.equal(dv.getUint32(24,true),16000);
 assert.equal(dv.getUint32(40,true),6);assert.throws(()=>N.wav(new Float32Array(),16000),RangeError);
});
test('macro presets keep all generated frequencies audible, duration and gain bounded',()=>{
 for(const p of M.PRESETS){assert.ok(p.frequencies.every(x=>x>=120&&x<=600));assert.ok(p.dur<=5)}
 assert.throws(()=>M.preset('danger'),RangeError);assert.throws(()=>M.play({},'cave',1),TypeError);
});

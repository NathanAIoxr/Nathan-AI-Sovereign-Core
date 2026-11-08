'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const V=require('./native-bridge.js'),N=require('./noise.js');
test('only exact loopback origin enables native model integration',()=>{
 assert.ok(V.isLoopbackOrigin({hostname:'127.0.0.1',protocol:'http:'}));
 for(const p of ['localhost','0.0.0.0','example.com','evil.127.0.0.1.com'])
  assert.equal(V.isLoopbackOrigin({hostname:p,protocol:'http:'}),false);
 assert.equal(V.isLoopbackOrigin({hostname:'127.0.0.1',protocol:'https:'}),false);
});
test('16k mono merge preserves symmetric stereo signal',()=>{
 const a=new Float32Array([.5,1,-1]),b=new Float32Array([-.5,-1,1]);
 const x=V.mono([a,b],3);
 assert.deepEqual(Array.from(x),[0,0,0]);
 assert.throws(()=>V.mono([]),RangeError);
});
test('windowed sinc downsampling keeps speech-band frequency and suppresses aliases',()=>{
 const rate=48000,dur=.1,samples=4800,voice=new Float32Array(samples);
 const junk=new Float32Array(samples);
 for(let i=0;i<samples;i++){voice[i]=Math.sin(2*Math.PI*500*i/rate)*.6;junk[i]=Math.sin(2*Math.PI*14000*i/rate)*.6}
 const out=V.resample(voice,rate),noise=V.resample(junk,rate);
 assert.equal(out.length,1600);
 const rms=x=>Math.sqrt(x.reduce((s,v)=>s+v*v,0)/x.length);
 assert.ok(rms(out)>.35,'speech tone survived');
 assert.ok(rms(noise)<.08,'alias suppressed');
 const wav=N.wav(out,16000);assert.equal(new DataView(wav).getUint32(24,true),16000);
});
test('invalid media is rejected before contacting local engine',()=>{
 assert.throws(()=>V.resample(new Float32Array(1),100),RangeError);
 assert.throws(()=>V.resample(new Float32Array(16000),16000,48000),RangeError);
 assert.throws(()=>V.mono([new Float32Array(5),new Float32Array(1)],5),TypeError);
 assert.throws(()=>V.apiClient({location:{hostname:'example.com',protocol:'https:'},fetch:()=>{}}),/127.0.0.1/);
});
test('native client sends requests only to same-origin loopback endpoints with local authorization',async()=>{
 let calls=[],status={schema:'nathan.voice.native.v1',localOnly:true,csrf:'test-secret',engines:{espeak:true,whisper:true},voices:['en']};
 const mock=async(path,init)=>{calls.push({path,init});return {ok:true,json:async()=>path.includes('status')?status:{transcript:'Hello'},blob:async()=>new Blob([new Uint8Array(44)])}};
 const client=V.apiClient({location:{protocol:'http:',hostname:'127.0.0.1'},fetch:mock});
 const r=await client.connect();assert.equal(r.csrf,undefined);
 await client.synthesize('Hello','en');await client.transcribe(new Uint8Array([1,2,3]),'en');
 assert.deepEqual(calls.map(x=>x.path),['/api/voice/status','/api/voice/synthesize','/api/voice/transcribe']);
 assert.equal(calls[1].init.headers['X-Nathan-Voice-CSRF'],'test-secret');
 assert.equal(calls[1].init.credentials,'same-origin');
 assert.equal(calls[2].init.headers['X-Nathan-Language'],'en');
});

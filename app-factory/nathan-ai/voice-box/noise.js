/* Nathan AI Voice Box — non-destructive local PCM noise gate and PCM16 WAV export. */
(function(root,build){'use strict';const api=build();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanNoiseGate=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function process(samples,rate,threshold=0.018){
 if(!(samples instanceof Float32Array))throw new TypeError('Float32 PCM required');
 if(!Number.isFinite(rate)||rate<8000||rate>192000||samples.length>5000000||samples.length<1)throw new RangeError('Audio dimensions invalid');
 if(!Number.isFinite(threshold)||threshold<0||threshold>0.12)throw new RangeError('Gate threshold outside 0..0.12');
 const frame=Math.max(1,Math.round(rate*.01)),fade=Math.max(1,Math.round(rate*.006)),out=new Float32Array(samples.length);let gain=1,muted=0,count=0,rmsBefore=0,rmsAfter=0;
 for(let i=0;i<samples.length;i+=frame){
  let power=0,n=Math.min(frame,samples.length-i);
  for(let j=i;j<i+n;j++){const x=samples[j];if(!Number.isFinite(x)||Math.abs(x)>1.0001)throw new RangeError('Invalid normalized PCM');power+=x*x}
  const below=Math.sqrt(power/n)<threshold;
  if(below)muted++;count++;
  const target=below?.07:1;
  for(let j=i;j<i+n;j++){gain+=(target-gain)/fade;const x=samples[j],y=Math.max(-1,Math.min(1,x*gain));out[j]=y;rmsBefore+=x*x;rmsAfter+=y*y}
 }
 return Object.freeze({samples:out,rate,threshold,quietFraction:muted/count,inputRms:Math.sqrt(rmsBefore/samples.length),outputRms:Math.sqrt(rmsAfter/samples.length),
   note:'Amplitude gate only; not spectral denoising, source separation or restoration of lost speech.'});
}
function wav(samples,rate){
 if(!(samples instanceof Float32Array)||!samples.length||samples.length>5000000)throw new RangeError('Invalid samples for WAV');
 if(!Number.isInteger(rate)||rate<8000||rate>192000)throw new RangeError('Invalid sample rate');
 const buf=new ArrayBuffer(44+samples.length*2),v=new DataView(buf),set=(offset,s)=>{for(let i=0;i<s.length;i++)v.setUint8(offset+i,s.charCodeAt(i))};
 set(0,'RIFF');v.setUint32(4,36+samples.length*2,true);set(8,'WAVE');set(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);
 v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
 set(36,'data');v.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const a=samples[i];if(!Number.isFinite(a))throw new RangeError('Invalid sample');const x=Math.max(-1,Math.min(1,a));v.setInt16(44+i*2,Math.round(x*(x<0?32768:32767)),true)}
 return buf;
}
return Object.freeze({process,wav});
});
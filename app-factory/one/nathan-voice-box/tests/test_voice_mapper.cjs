"use strict";
const assert = require("node:assert/strict");
const {test} = require("node:test");
const mapper = require("../voice-mapper-core.js");
function sine(hz,sr=16000,sec=5) {
  return Float32Array.from({length:Math.round(sr*sec)}, (_,i)=>0.4*Math.sin(2*Math.PI*hz*i/sr));
}
test("voice map detects 200 Hz synthetic voiced signal without identity assertions",()=>{
 const p=mapper.analyze(sine(200),16000);
 assert.equal(p.schema,"nathan-voice-profile/1");
 assert.ok(p.median_f0_hz>190 && p.median_f0_hz<210,JSON.stringify(p));
 assert.ok(p.p10_f0_hz>180 && p.p90_f0_hz<220);
 assert.ok(Math.abs(p.spectral_gate_shares.reduce((a,b)=>a+b,0)-1)<0.00002);
 assert.equal(p.spectral_gate_shares.length,12);
 assert.equal(p.metrics_only,true);
});
test("silent sample has no determined pitch or hallucinated identity",()=>{
 const p=mapper.analyze(new Float32Array(16000),16000);
 assert.equal(p.median_f0_hz,null);
 assert.equal(p.voiced_frames_sampled,0);
 assert.equal(p.rms,0);
 assert.equal(p.spectral_gate_shares.reduce((a,b)=>a+b,0),0);
});
test("48000 Hz resamples to 16000 and keeps approximate 180 Hz pitch",()=>{
 const p=mapper.analyze(sine(180,48000,2),48000);
 assert.equal(p.sample_rate_hz,16000);
 assert.ok(p.median_f0_hz>165 && p.median_f0_hz<195);
});
test("no oversized recording and invalid rates",()=>{
 assert.throws(()=>mapper.analyze(new Float32Array(2000),0));
 assert.throws(()=>mapper.analyze(new Float32Array(2000),7000));
 assert.throws(()=>mapper.analyze(new Float32Array(2000),192001));
 assert.throws(()=>mapper.analyze(new Float32Array(0),16000));
});
test("clipping reported as measurement only",()=>{
 const p=mapper.analyze(new Float32Array(16000).fill(1),16000);
 assert.equal(p.clipped_percent,100);
 assert.equal(p.peak,1);
});

test("quality assessment blocks silent and heavily clipped references",()=>{
  const silence=mapper.analyze(new Float32Array(16000*3),16000);
  const blocked=mapper.assessRecording(silence);
  assert.equal(blocked.usable_for_reference,false);
  assert.ok(blocked.blockers.length>0);
  const loud=mapper.analyze(new Float32Array(16000*3).fill(1),16000);
  assert.equal(mapper.assessRecording(loud).usable_for_reference,false);
  const spoken=mapper.analyze(sine(170,16000,3),16000);
  assert.equal(mapper.assessRecording(spoken).usable_for_reference,true);
});

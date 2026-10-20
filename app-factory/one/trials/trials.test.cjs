'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const parent=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('Trials are actually in ONE navigation and home',()=>{
 assert.match(parent,/data-view="trials"/);
 assert.match(parent,/data-page="trials"/);
 assert.match(parent,/src="\.\/trials\/index.html"/);
 assert.match(parent,/href="\.\/trials\/index.html"/);
});
test('Trials parser valid and geometries distinct',()=>{
 assert.ok(script);assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(script,/level===1/);assert.match(script,/level===2/);assert.match(script,/level===3/);
 assert.match(script,/length:11/);assert.match(script,/length:12/);assert.match(script,/Math\.abs\(r-3\)\+Math\.abs\(c-3\)<=3/);
 assert.match(script,/diagonalGravity/);assert.match(script,/ringsPossible/);
});
test('Private stage names are not embedded in public code',()=>{
 assert.doesNotMatch(html,/Babylon.s Gate|Rhombus of Ur|Pavlov.s Bell|Deepfake Mirage|Cognitive Dissonance/);
 assert.match(script,/one\.trial|trial_stage|stagefile/);
 assert.match(script,/tabor-one-private-master-library-v1/);
 assert.match(script,/verifiedStages/);
 assert.doesNotMatch(script,/\bfetch\s*\(|\bXMLHttpRequest\b/);
});
test('No simulated IQ or invasive sensory manipulation',()=>{
 assert.match(html,/not IQ measurements/);
 assert.match(html,/No subliminal flicker/);
 assert.match(html,/No advertising or microtransactions/);
 assert.doesNotMatch(script,/AudioContext|requestAnimationFrame|WebCamera|MediaDevices|navigator\.mediaDevices/);
 assert.match(script,/localStorage/);
 assert.match(script,/gameplay_only_not_clinical_IQ/);
});

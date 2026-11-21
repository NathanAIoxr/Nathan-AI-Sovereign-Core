import {test} from "node:test";import assert from "node:assert/strict";import {FORMALISMS,LAYERS,initialState,step} from "./src/engine.mjs";import worker from "./src/index.mjs";
test("all 21 formalizations",()=>{assert.equal(FORMALISMS.length,21);assert.equal(new Set(FORMALISMS.map(x=>x.id)).size,21);assert.equal(LAYERS.length,4);});
test("containment denies",()=>assert.equal(step(initialState(),{type:"arm-fold"}).ok,false));
test("gesture sequence",()=>{let s=initialState();for(const e of [{type:"unseal",authorized:true},{type:"arm-fold"},{type:"blink"},{type:"command",action:"set-color",value:"pink"}]){const r=step(s,e);assert.equal(r.ok,true);s=r.state;}assert.equal(s.world.color,"pink");});
test("disallowed operations",()=>{let s=initialState();for(const e of [{type:"unseal",authorized:true},{type:"arm-fold"},{type:"blink"}])s=step(s,e).state;assert.equal(step(s,{type:"command",action:"shell"}).ok,false);});
test("catalog API",async()=>{const r=await worker.fetch(new Request("https://example.invalid/api/formalisms"));assert.equal((await r.json()).count,21);});

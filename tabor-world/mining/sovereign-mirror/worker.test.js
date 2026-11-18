import {test} from "node:test";import assert from "node:assert/strict";import {phase1,phase3,sha256d,simulate} from "./worker.js";
test("phase 1 isolates without deletion",()=>{const input=[{index:0,note_type:"WHITE_NOTE",payload:"secret"},{index:4,note_type:"BLACK_NOTE",payload:"ASIC"}];const p=phase1(input);assert.equal(p.active.length,1);assert.equal(p.original[0].payload,"secret");assert.equal(input.length,2)});
test("phase 3 restores index and neutral labels, preserves originals",()=>{const p=phase1([{index:0,note_type:"WHITE_NOTE",payload:"a"},{index:5,note_type:"WHITE_NOTE",payload:"b"}]);const r=phase3(p);assert.equal(r.restored[0].priority,null);assert.equal(r.originalPreserved[1].payload,"b")});
test("SHA256d digest length",async()=>assert.equal((await sha256d(new Uint8Array(80))).length,32));
test("nonce simulation bounded",async()=>{const r=await simulate("00".repeat(76),2083236893,2);assert.equal(r.attempts,4)});

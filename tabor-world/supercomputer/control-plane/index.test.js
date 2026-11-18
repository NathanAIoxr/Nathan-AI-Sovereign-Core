import {test} from "node:test";import assert from "node:assert/strict";import {dispatchPlan,normalizeTasks} from "./index.js";
test("1+1=2: two unique tasks remain two",()=>assert.equal(normalizeTasks([{id:"a"},{id:"b"}]).length,2));
test("1-1=0: duplicate scheduling removed without deleting original input",()=>{const tasks=[{id:"a"},{id:"a"}];const p=dispatchPlan(tasks,2);assert.equal(p.unique,1);assert.equal(p.duplicatesRemoved,1);assert.equal(tasks.length,2)});
test("stable priority ordering",()=>assert.equal(normalizeTasks([{id:"low",priority:1},{id:"high",priority:9}])[0].id,"high"));
test("bounded parallel lanes",()=>assert.equal(dispatchPlan([{id:"a"}],999).lanes.length,128));

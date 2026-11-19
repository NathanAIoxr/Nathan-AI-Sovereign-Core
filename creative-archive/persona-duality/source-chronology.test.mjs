import test from "node:test";import assert from "node:assert/strict";import {CHRONOLOGY,auditChronology} from "./source-chronology.mjs";
test("source chronology is labeled and date-neutral",()=>{assert.deepEqual(auditChronology(),[]);assert.equal(CHRONOLOGY.length,4);assert.ok(CHRONOLOGY.every(x=>x.date===null));});
test("scripture is separate from creative interpretation",()=>{assert.equal(CHRONOLOGY.find(x=>x.id==="scripture").interpretation,false);assert.ok(CHRONOLOGY.filter(x=>x.id!=="scripture").every(x=>x.interpretation));});
test("rejects unsupported labels and malformed dates",()=>{assert.equal(auditChronology([{id:"x",source:"x",sourceType:"assistant_graph_interpretation",claim:"x",date:"unknown",interpretation:false}]).length,2);});

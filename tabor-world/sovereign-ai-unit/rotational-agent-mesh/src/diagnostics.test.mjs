import assert from "node:assert/strict";import {runDiagnostic} from "./diagnostics.mjs";
const r=runDiagnostic();assert.equal(r.executed,12);assert.equal(r.all_checks_passed,true);
assert.equal(runDiagnostic({authorized:false}).all_checks_passed,false);
assert.equal(runDiagnostic({thermalOk:false}).all_checks_passed,false);
assert.equal(runDiagnostic({ackCount:2}).all_checks_passed,false);
assert.equal(runDiagnostic({reserved:9}).all_checks_passed,false);
assert.throws(()=>runDiagnostic({shiftBits:40}),/invalid_shift/);
console.log("12 deterministic agent tasks and failure modes passed");
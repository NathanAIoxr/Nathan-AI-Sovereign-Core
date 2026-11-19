import test from "node:test";
import assert from "node:assert/strict";
import worker,{runProof,digest} from "./worker.mjs";

test("all 64 slots produce distinct replayable development proofs",async()=>{
  const hashes=new Set();
  for(let slot=1;slot<=64;slot++){
    const row={slot,coordinate:(slot-1).toString(2).padStart(6,"0"),ticker:null,name:null,source_status:"source_unverified"};
    const proof=await runProof(row);
    assert.equal(proof.scope,"development");
    assert.match(proof.hash,/^0[0-9a-f]{63}$/);
    assert.equal(await digest(row,proof.nonce),proof.hash);
    hashes.add(proof.hash);
  }
  assert.equal(hashes.size,64);
});
test("write endpoint requires a configured authorization secret",async()=>{
  const denied=await worker.fetch(new Request("https://localhost/internal/mine?slot=1",{method:"POST"}),{});
  assert.equal(denied.status,404);
});

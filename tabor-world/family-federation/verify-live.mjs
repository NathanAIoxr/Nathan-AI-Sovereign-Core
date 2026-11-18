import assert from "node:assert/strict";
import {createHash} from "node:crypto";
const origin="https://tabor-family-federation.nathantaboract.workers.dev";
async function get(path){
  const response=await fetch(origin+path,{signal:AbortSignal.timeout(15000)});
  assert.equal(response.ok,true,path);
  return response;
}
const [status,sequence,bytes,body]=await Promise.all([
  get("/api/status").then(r=>r.json()),
  get("/api/lock?moves=insert,right,right,left,left,left,left").then(r=>r.json()),
  get("/api/federation.bin").then(r=>r.arrayBuffer()),
  get("/api/snapshot.json").then(r=>r.text()),
]);
const packet=new DataView(bytes);
const digest=createHash("sha256").update(body).digest("hex");
const binaryHash=Buffer.from(bytes).subarray(20).toString("hex");
assert.equal(status.assignment_count,3*status.parent_count);
assert.equal(status.github+status.cloudflare,status.parent_count);
assert.equal(sequence.open,true);
assert.equal(sequence.binary,"1110000");
assert.equal(Buffer.from(bytes).subarray(0,4).toString(),"TFED");
assert.equal(packet.getUint8(6)>>1,0b1110000);
assert.equal(packet.getUint32(16),status.parent_count);
assert.equal(digest,status.sha256);
assert.equal(binaryHash,digest);
console.log(JSON.stringify({parents:status.parent_count,assignments:status.assignment_count,binaryHash,open:sequence.open}));

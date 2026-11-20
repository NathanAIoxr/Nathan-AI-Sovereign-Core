import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { miningDemo, nineMethodRun, verifyHeader } from "../src/mining.mjs";

const [cli, dataDirectory, rpcPort, address] = process.argv.slice(2);
assert.ok(cli && dataDirectory && rpcPort && address?.startsWith("bcrt1"), "Expected a private regtest node and wallet address");
const flags = ["-regtest", "-datadir=" + dataDirectory, "-rpcport=" + rpcPort,
  "-rpcconnect=127.0.0.1", "-rpcclienttimeout=5", "-noipcconnect"];
function rpc(...args) {
  return execFileSync(cli, [...flags, ...args], { encoding: "utf8", timeout: 12000 }).trim();
}

assert.equal(JSON.parse(rpc("getblockchaininfo")).chain, "regtest");
const { methods } = await miningDemo();
for (const { side, direction } of methods) {
  const block = JSON.parse(rpc("generateblock", address, "[]", "false")).hex;
  assert.match(block, /^[0-9a-f]{162,}$/);
  const header = block.slice(0, 152) + "00000000";
  assert.equal(header.slice(144, 152), "ffff7f20", "Expected regtest's easy proof target");
  let hit;
  for (let start = 0; start < 256 && !hit; start += 32) {
    const report = await nineMethodRun({ headerHex: header, start, count: 32 });
    hit = report.methods.find(method => method.side === side && method.direction === direction).hits[0];
  }
  assert.ok(hit, "No regtest proof in the bounded nonce range");
  const nonce = Buffer.alloc(4);
  nonce.writeUInt32LE(hit.nonce);
  const solved = header.slice(0, 152) + nonce.toString("hex") + block.slice(160);
  assert.equal((await verifyHeader(solved.slice(0, 160))).hash, hit.hash);
  assert.equal(rpc("submitblock", solved), "");
  assert.equal(rpc("getbestblockhash"), hit.hash);
  console.log(JSON.stringify({ side, direction, nonce: hit.nonce, acceptedBlock: hit.hash }));
}

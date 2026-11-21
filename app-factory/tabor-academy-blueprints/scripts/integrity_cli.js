import { readFileSync } from "node:fs";
import { gatekeeper } from "../worker/gatekeeper.js";
import { identifySnapshot, mechanicsRoot, rowSha256 } from "../shared/merkle.js";

const rows = JSON.parse(readFileSync(0, "utf8"));
for (const row of rows) {
  if (gatekeeper(row, { generated: process.argv.includes("--generated") }) !== 1) {
    throw new Error(`Deterministic gate rejected blueprint ${row?.id ?? "without an ID"}`);
  }
}
const [manifest, mechanismRoot, hashes] = await Promise.all([
  identifySnapshot(rows), mechanicsRoot(rows), Promise.all(rows.map(rowSha256)),
]);
process.stdout.write(JSON.stringify({ manifest: { ...manifest, mechanicsRoot: mechanismRoot }, hashes }));

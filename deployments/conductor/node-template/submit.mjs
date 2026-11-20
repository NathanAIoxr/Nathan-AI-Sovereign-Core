import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { nodeTemplate } from "./runtime.mjs";

const [source, node, event_id, operation, outcome, evidencePath, revision] = process.argv.slice(2);
if (!evidencePath) throw Error("Usage: node submit.mjs SOURCE NODE EVENT OPERATION OUTCOME EVIDENCE_FILE [REVISION]");
const file = createHash("sha256");
for await (const chunk of createReadStream(evidencePath)) file.update(chunk);
const receipt = nodeTemplate.normalize({ source, node, event_id, operation, outcome, evidence: file.digest("hex"), revision: revision ?? null });
if (!receipt) throw Error("Invalid receipt fields");
const token = process.env.NATHAN_NODE_TOKEN;
if (!token) {
  process.stdout.write(JSON.stringify(receipt) + "\n");
} else {
  const url = "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/node-template/receipts";
  const response = await fetch(url, {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + token },
    body: JSON.stringify(receipt), redirect: "error", signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  process.stdout.write(JSON.stringify(result) + "\n");
  if (!response.ok) process.exitCode = 1;
}

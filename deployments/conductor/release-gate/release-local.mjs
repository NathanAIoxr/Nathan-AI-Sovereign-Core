import { link, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { candidateBytes, discard } from './policy.mjs';

const endpoint = 'https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/api/release-gate/evaluate';
const [destination, intendedId] = process.argv.slice(2);
async function main() {
  if (!destination || !intendedId) throw new Error('Usage: release-local.mjs OUTPUT_PATH DESTINATION_ID < staged-request.json');
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 65_536) return discard('request_too_large');
    chunks.push(chunk);
  }
  const staged = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
  if (staged?.candidate?.destination !== intendedId) return discard('destination_mismatch');
  const bytes = candidateBytes(staged.candidate);
  if (!bytes) return discard('invalid_candidate');

  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(staged)
  });
  const receipt = await response.json();
  if (response.status === 422 && receipt?.bit === 0) return receipt;
  const { id, kind, producer, action } = staged.candidate;
  if (!response.ok || receipt?.bit !== 1 || receipt?.decision !== 'release' || receipt?.id !== id ||
      receipt.kind !== kind || receipt.producer !== producer || receipt.action !== action || receipt.destination !== intendedId) {
    return discard('gate_unavailable');
  }
  const output = resolve(destination);
  const staging = await mkdtemp(join(dirname(output), '.lasso-release-'));
  const temporary = join(staging, 'payload');
  try {
    await writeFile(temporary, bytes, { flag: 'wx', mode: 0o600 });
    await link(temporary, output);
  } finally {
    await rm(staging, { recursive: true, force: true }).catch(() => {});
  }
  return receipt;
}

try {
  const receipt = await main();
  console.log(JSON.stringify(receipt));
  if (receipt.bit !== 1) process.exitCode = 1;
} catch {
  console.log(JSON.stringify(discard('release_io_failed')));
  process.exitCode = 1;
}

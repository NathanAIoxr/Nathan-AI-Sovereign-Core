/** Read-only composite gate for an explicitly supplied fiber catalog JSON file. */
import { readFile } from 'node:fs/promises';
import { auditFiberGlobalIds } from './catalog-global-id-audit.mjs';

export async function auditFiberCompleteFile(path, { read = readFile } = {}) {
  if (typeof path !== 'string' || !path.trim()) throw new TypeError('explicit catalog path required');
  let document;
  try { document = JSON.parse(await read(path, 'utf8')); }
  catch (error) {
    return Object.freeze({ ok: false, source: path, craftCount: 0, stepCount: 0,
      errors: Object.freeze([`catalog unreadable or invalid JSON: ${error.message}`]) });
  }
  const crafts = Array.isArray(document) ? document : document?.crafts;
  return Object.freeze({ ...auditFiberGlobalIds(crafts), source: path });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const path = process.argv[2];
  if (!path) { console.error('Usage: node catalog-complete-file-gate.mjs <catalog.json>'); process.exitCode = 2; }
  else {
    const result = await auditFiberCompleteFile(path);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  }
}

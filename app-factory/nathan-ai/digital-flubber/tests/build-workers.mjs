import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function buildTestWorkers() {
  const output = await mkdtemp(join(tmpdir(), 'digital-flubber-'));
  try {
    execFileSync(process.execPath, [fileURLToPath(new URL('../build.mjs', import.meta.url)), output]);
    const workers = await Promise.all(['main', 'slubber', 'sos'].map(name => import(pathToFileURL(join(output, name + '.mjs')))));
    const [main, slubber, sos] = workers.map(module => module.default);
    return { main, slubber, sos };
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}

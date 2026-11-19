import { cp, rename, rm } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await cp(new URL('../public/', import.meta.url), output, { recursive: true });
for (const path of ['index.html', 'zones/index.html']) {
  await rename(new URL(path + '.in', output), new URL(path, output));
}
await cp(new URL('../worker.js', import.meta.url), new URL('_worker.js', output));

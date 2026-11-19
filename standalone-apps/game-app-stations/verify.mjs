import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const release = JSON.parse(await readFile(resolve(root, 'dist/release.json'), 'utf8'));
const catalog = JSON.parse(await readFile(resolve(root, 'dist/catalog.json'), 'utf8'));
const expected = Object.entries(release.hashes);
if (catalog.count !== catalog.stations.length || catalog.count !== release.count || expected.length !== release.count+2) {
  throw Error('Station counts do not reconcile');
}
const remote = process.argv.includes('--live');
const origin = 'https://pub-a374b836528943e2917457f04363c2ff.r2.dev/';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
for (let offset=0; offset<expected.length; offset+=8) {
  const results = await Promise.all(expected.slice(offset,offset+8).map(async ([path,sha])=>{
    const bytes = await readFile(resolve(root,'dist',path));
    if (digest(bytes)!==sha) throw Error('Local digest mismatch: ' + path);
    if (!remote) return;
    const response = await fetch(new URL(path,origin), {signal:AbortSignal.timeout(10000)});
    if (!response.ok || digest(Buffer.from(await response.arrayBuffer()))!==sha) {
      throw Error('Live digest mismatch or HTTP failure: ' + path + ' (' + response.status + ')');
    }
  }));
  if (results.length===0) throw Error('Empty verification batch');
}
console.log('Verified ' + release.count + ' ' + (remote?'live':'local') + ' app stations.');

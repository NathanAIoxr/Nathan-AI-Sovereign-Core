import { mkdir, readFile, writeFile } from 'node:fs/promises';
await import('./build.mjs');

const read = name => readFile(new URL('dist/' + name, import.meta.url), 'utf8');
const stripImports = code => code.replace(/^import .+;\n/gm, '');
const policy = (await read('policy.mjs')).replace(/^export /gm, '');
const bundle = [
  (await read('assets.mjs')).replace('export const files', 'const files'),
  policy,
  (await read('cloud-slayer.mjs')).replace(/^export /gm, ''),
  ...await Promise.all(['slubber', 'sos', 'main'].map(async name =>
    stripImports(await read(name + '.mjs')).replace('export default', 'const ' + name + ' ='))),
  `const services = {
    SLUBBER: { fetch: url => slubber.fetch(new Request(url)) },
    SOS: { fetch: url => sos.fetch(new Request(url)) }
  };
  export default { fetch: (request, env) => main.fetch(request, { ...services, CLOUD_SLAYER_DB: env.CLOUD_SLAYER_DB }) };`
].join('\n');
const output = new URL('dist/pages/', import.meta.url);
await mkdir(output, { recursive: true });
await writeFile(new URL('_worker.js', output), bundle);

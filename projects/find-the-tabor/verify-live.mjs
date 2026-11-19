import { readFile } from 'node:fs/promises';

const read = async file => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));
const config = await read('projects.json');
const releases = await read('dist/releases.json');
const selected = process.argv[2];
const editions = selected ? releases.filter(([id]) => id === selected) : releases.filter(([id]) => id !== 'checks');
if (!editions.length) throw new Error('Unknown edition');

const results = await Promise.all(editions.map(async ([id, worker, release]) => {
  const base = 'https://' + config[id].pages + '.pages.dev';
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(base + '/health.json?release=' + release, {signal:AbortSignal.timeout(12000)});
      const health = await response.json();
      if (!response.ok || health.worker !== worker || health.release !== release) throw Error('Release not yet present');
      const root = await fetch(base + '/', {signal:AbortSignal.timeout(12000)});
      if (!root.ok || !(await root.text()).includes('Project source')) throw Error('Archive root unavailable');
      console.log(`${id} ${release} ${base}`);
      return true;
    } catch (error) {
      if (attempt === 5) console.error(`${id} ${base} ${error.message}`);
      else await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
}));
if (results.includes(false)) process.exitCode = 1;

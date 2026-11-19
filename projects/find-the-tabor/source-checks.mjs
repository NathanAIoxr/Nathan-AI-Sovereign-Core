import { sources } from './dist/checks/content.mjs';
import { writeFile } from 'node:fs/promises';

const output = [];
for (let start = 0; start < sources.length; start += 5) {
  const batch = await Promise.all(sources.slice(start, start + 5).map(async ([id, url]) => {
    const checkedAt = new Date().toISOString();
    try {
      const response = await fetch(url, {redirect:'manual', signal:AbortSignal.timeout(7000)});
      if (response.body) await response.body.cancel();
      const outcome = response.ok ? 'reachable' : response.status >= 300 && response.status < 400 ? 'redirect' : 'review';
      return {id, url, checkedAt, status:response.status, outcome};
    } catch {
      return {id, url, checkedAt, status:null, outcome:'network-error'};
    }
  }));
  output.push(...batch);
}
await writeFile(process.argv[2] ?? 'source-checks.json', JSON.stringify(output, null, 2) + '\n');
console.log(`Checked ${output.length} records. ${output.filter(row => row.outcome !== 'reachable').length} returned a redirect or require review.`);

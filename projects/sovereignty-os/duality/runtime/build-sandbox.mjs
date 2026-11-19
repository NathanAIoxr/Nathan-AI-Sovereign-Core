import { readFileSync, writeFileSync } from 'node:fs';
import { select } from './select.mjs';

const profile = select('nathan-ai-bounties-db', 'sandbox');
const root = new URL('../../../../', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL(profile.source.replace('app.json', 'catalog.json'), root), 'utf8'));
const rows = catalog.groups.flatMap(({ entries, ...group }) =>
  entries.map(([id, title, description]) => ({ ...group, id, title, description, checked_on: catalog.checked_on }))
);
const fixture = JSON.stringify(rows);
const script = `const rows = ${fixture};\n` + readFileSync(new URL('./sandbox-catalog.mjs', import.meta.url), 'utf8');
if (process.argv[2]) writeFileSync(process.argv[2], script);
else process.stdout.write(script);
